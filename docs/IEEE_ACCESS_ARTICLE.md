# A Machine Learning Surrogate Framework for Real-Time Carbon Footprint Estimation in Agricultural Digital Twins Using Multi-Source Historical Telemetry

**Manuscript prepared for IEEE Access review**

## Abstract

Agricultural digital twins promise better monitoring and optimisation, but their sensor, gateway, network, and cloud workloads also create an operational carbon burden that is difficult to estimate during system design. Conventional life-cycle assessment (LCA) is valuable for comprehensive accounting, yet its data requirements and static character limit its use for interactive what-if analysis. This paper presents CarbonTwin, a machine-learning surrogate framework for estimating the operational carbon footprint of an agricultural digital twin from its deployment and telemetry configuration. A reproducible dataset of 2,500 records combines historical electricity-carbon-intensity observations from Our World in Data/Ember across 13 cloud-relevant countries (2018-2025) with sampled crop observations and a transparent edge-cloud physical accounting model. Five regressors--Random Forest, XGBoost, radial-basis-function support vector regression (SVR), stacking, and weighted blending--were tuned and evaluated. The best model, SVR, achieved a held-out RMSE of 25.7942 kg CO2e, MAE of 14.3474 kg CO2e, R2 of 0.9874, and MAPE of 8.6414%; its 10-fold CV RMSE was 25.4655 +/- 3.9084 kg CO2e. A Friedman test rejected equal model performance (chi-square = 37.0400, p < 0.001); all SVR post-hoc Wilcoxon comparisons were significant. A 2,000-replicate bootstrap gave a 95% RMSE interval of [20.6325, 31.3956] kg CO2e. The resulting model is exported with its preprocessor for low-latency inference and is also distilled to Keras HDF5 for deployment. The work provides a reproducible decision-support layer, while explicitly delimiting its operational, hybrid-data, and scenario-based claims.

**Index Terms**--Carbon footprint, cyber-physical systems, digital twins, green computing, Internet of Things, machine learning surrogate, precision agriculture, statistical validation.

## I. Introduction

Digital twins couple a physical asset with a data-driven virtual representation that supports monitoring, prediction, and intervention [1]-[4]. In agriculture, that coupling can integrate soil and weather sensing, crop models, communications, and cloud analytics [5]-[7]. The same connectivity that makes a twin useful also consumes electricity: sensors and gateways draw power continuously, data traverse wide-area networks, and cloud execution is conditioned by the carbon intensity of the selected electrical grid. Recent reviews identify the environmental impacts of digital agriculture itself as a material but still incompletely assessed concern [8], [9].

LCA remains indispensable for cradle-to-grave claims, but it is not normally an interactive estimator for a design engineer choosing a cloud region, telemetry rate, or solar-powered gateway. CarbonTwin therefore addresses a narrower question: given a specified agricultural twin configuration, can a transparent operational model be approximated accurately enough for interactive design-space exploration? The framework implements an empirical surrogate rather than claiming a full product LCA or direct measurement of field emissions.

This paper makes four contributions:

1. It formalises an operational, physics-informed carbon model for agricultural twins, guided by Software Carbon Intensity (SCI) and cloud-carbon-accounting principles [10], [11].
2. It constructs a reproducible hybrid dataset that combines historical OWID/Ember electricity intensities for 13 countries with crop observations and calibrated IoT/edge/cloud parameters [12], [13].
3. It benchmarks five regression families and exports the selected SVR together with its fitted preprocessor; a Keras student network is additionally exported for lightweight serving.
4. It applies 10-fold comparison, Friedman and one-sided Wilcoxon tests, a corrected Nadeau-Bengio comparison, bootstrap uncertainty, and residual diagnostics.

## II. Related Work

The digital-twin concept originated in product-lifecycle management and subsequently matured into a broad cyber-physical paradigm [1]-[4]. Agricultural reviews describe applications in irrigation, soil, machinery, livestock, and farm management, but also note fragmented evidence and dependencies on sensing, communication, analytics, and data governance [5], [6]. Edge-fog-cloud architectures can reduce cloud load for latency-sensitive agricultural IoT workloads [7], yet their carbon consequences depend on where computation occurs and which grid supplies it.

Environmental assessments of digital agriculture commonly prioritise agricultural activity while treating the digital technology boundary inconsistently [8], [9]. Parametric approaches have begun to quantify deployed digital devices, but they do not yield a millisecond-scale surrogate for configuration-level decision support [9]. On the modelling side, tree ensembles, kernel methods, and stacked predictors are established tabular-regression baselines [14]-[18]. The research gap is thus a reproducible bridge between a stated operational carbon model, historical grid conditions, and statistically validated surrogate inference for agricultural digital-twin configurations.

## III. Mathematical and Physical Modeling

Let the design vector be

$$X=[N_{sens},N_{edge},I_{grid},V_{data},f_{tx},R_{mesh},c,D_{op},S]^T,$$

where the components correspond respectively to `sensor_count`, `edge_count`, `cloud_region_intensity`, `data_volume_gb_day`, `transmission_freq_hz`, `model_resolution`, `crop_type`, `operation_days`, and `solar_powered`. The implementation represents sensor power as 0.15 W per ESP32-class node and gateway power as 4 W per Raspberry-Pi-class gateway. With power expressed in kW, edge consumption is

$$E_{edge}=(0.00015N_{sens}+0.004N_{edge})24D_{op}. \tag{1}$$

The cloud/network term is implemented as

$$E_{cloud}=(0.001V_{data}+0.45\,R_{mesh}\,24)D_{op}. \tag{2}$$

The label is generated by

$$Y=(E_{edge}+E_{cloud})I_{grid}\gamma_c(1-0.35S)\epsilon, \tag{3}$$

where $\gamma_c$ is 1.00, 1.15, 0.85, 1.40, and 1.20 for wheat, corn, soy, rice, and tomato, respectively, and $\epsilon\sim\mathcal{N}(1,0.05)$. Equation (3) operationalises a 35% solar mitigation, not a complete renewable-energy or embodied-carbon model. The chosen crop factors encode scenario-specific agronomic intensity and should not be interpreted as a replacement for crop-specific field emission inventories.

## IV. Dataset and Exploratory Data Analysis

The dataset contains 2,500 rows, nine predictors, and target `total_co2e_kg`. Historical carbon intensity was sampled from OWID/Ember observations for Australia, Brazil, Canada, France, Germany, India, Ireland, Japan, the Netherlands, Spain, Sweden, the United Kingdom, and the United States, with years 2018-2025. Crop labels and agronomic covariates were sampled from an open field-crop dataset, then mapped to five crop categories. Consequently, the dataset is *hybrid*: electricity intensity and crop observations originate from open historical data, whereas deployment telemetry and target emissions are generated by the documented physical-empirical construction. This distinction is essential for interpreting external validity.

**TABLE I. Descriptive statistics of numerical variables.**

| Variable | Min | Mean | Max | Std. dev. | Unit |
|---|---:|---:|---:|---:|---|
| Sensor count | 12 | 32.2048 | 50 | 8.0670 | nodes |
| Edge count | 2 | 6.4676 | 10 | 1.9108 | gateways |
| Grid intensity | 0.0349 | 0.3205 | 0.7377 | 0.1989 | kg CO2e/kWh |
| Data volume | 0.10 | 5.7339 | 24.43 | 3.2172 | GB/day |
| Transmission frequency | 0.0132 | 2.4645 | 4.9986 | 1.4305 | Hz |
| Model resolution | 0.150 | 0.5789 | 1.000 | 0.2454 | normalized |
| Operation days | 75 | 116.1912 | 165 | 20.4868 | days |
| Solar powered | 0 | 0.3924 | 1 | 0.4884 | binary |
| Target | 5.3812 | 247.4172 | 1674.0336 | 217.2217 | kg CO2e |

The target is right-skewed (skewness 1.6745); results are reported on the original target scale rather than after a target transformation. Grid intensity is the strongest recorded association with the target (Pearson 0.7183; Spearman 0.8030), followed by model resolution (0.4287; 0.4353). Solar power is negatively associated (Pearson -0.2222). The 1.5-IQR rule flags 96 target values (3.84%) and 46 data-volume values (1.84%); the 3-sigma rule flags 41 (1.64%) and 27 (1.08%), respectively. These observations motivate nonlinear models and robust, distribution-free performance comparisons.

## V. Machine Learning Framework

An 80/20 train-test split with random seed 42 was used. Numeric variables were standardised with `StandardScaler`; `crop_type` was encoded with `OneHotEncoder(handle_unknown='ignore')`, producing 13 transformed features. The preprocessor was fitted only on training data. For Random Forest, XGBoost, SVR, and stacking, `RandomizedSearchCV` used 20 candidate configurations and five internal folds; selected estimators were then scored by shuffled 10-fold CV on the training partition.

Random Forest uses decorrelated bootstrap trees [14]. XGBoost uses regularised gradient-boosted trees [15]. SVR uses an RBF kernel with selected $C=500$, $\epsilon=0.01$, and `gamma=auto` [16]. Stacking uses RF, XGBoost, and SVR base learners and a Ridge meta-learner with five-fold internal out-of-fold predictions [17], [18]. Blending searches nonnegative weights that sum to one; the selected order (RF, XGB, SVR) is $(0.2,0.2,0.6)$.

The selected SVR is persisted as `best_model_sklearn.pkl` with `preprocessor.pkl`. A feedforward Keras student is also exported as `best_model.h5`: dense layers of 256, 128, 64, and 32 units, batch normalisation after the first two dense layers, dropout rates 0.20 and 0.15, ReLU hidden activations, and a linear output. The model card reports zero-valued distillation correlation and RMSE fields; therefore, this manuscript does **not** claim validated fidelity of the Keras student to the SVR teacher. Production accuracy claims refer to the persisted scikit-learn SVR.

## VI. Experimental Results and Discussion

**TABLE II. Held-out and cross-validated performance.**

| Algorithm | Test RMSE (kg CO2e) | Test MAE | Test R2 | Test MAPE (%) | 10-Fold CV-RMSE (Mean +/- Std) |
|---|---:|---:|---:|---:|---:|
| SVR | 25.7942 | 14.3474 | 0.9874 | 8.6414 | 25.4655 +/- 3.9084 |
| XGBoost | 29.9698 | 18.6687 | 0.9830 | 11.7142 | 29.4993 +/- 3.5068 |
| Stacking | 32.5168 | 17.9727 | 0.9799 | 12.8371 | 29.7474 +/- 4.7494 |
| Blending | 32.2673 | 17.1081 | 0.9803 | 11.2929 | 38.8664 +/- 7.4131 |
| Random Forest | 73.3859 | 42.4271 | 0.8979 | 38.3875 | 64.2792 +/- 6.7788 |

SVR is best on the held-out and mean-CV RMSE criteria. This is consistent with a smooth response surface induced by Eq. (3): continuous grid intensity, resolution, operation duration, and solar mitigation dominate the target, while the RBF kernel can represent their nonlinear interactions without the piecewise partitioning of trees. XGBoost remains competitive, but its 4.1756 kg CO2e higher held-out RMSE suggests less efficient approximation of this calibrated smooth mapping. Stacking does not improve upon its best base learner, and blending--despite SVR receiving 0.6 weight--inherits error from weaker components. These are empirical results on one controlled hybrid dataset, not a universal ordering of algorithms for every farm or carbon-accounting system.

## VII. Statistical Validation and Hypothesis Testing

Friedman's omnibus test on the ten CV-RMSE values gives $\chi^2=37.0400$ and $p<0.001$, rejecting the null hypothesis of identical model performance [19], [20]. The reported one-sided Wilcoxon tests compare rival-fold error minus SVR-fold error; positive differences support lower SVR error [21].

**TABLE III. Wilcoxon signed-rank post-hoc comparisons.**

| Comparison | W | p-value | Conclusion at alpha = 0.05 |
|---|---:|---:|---|
| SVR vs. Random Forest | 55.0 | 0.000977 | Significant |
| SVR vs. XGBoost | 54.0 | 0.001953 | Significant |
| SVR vs. Stacking | 55.0 | 0.000977 | Significant |
| SVR vs. Blending | 55.0 | 0.000977 | Significant |

For SVR versus XGBoost, the corrected paired Nadeau-Bengio test gives $t=3.4480$, $p=0.0073$, using 10 folds and a recorded correlation correction of 0.1 [22]. The bootstrap used 2,000--not 1,000--replicates and returned a 95% RMSE interval of [20.6325, 31.3956] kg CO2e [23]. Residual normality is rejected by Shapiro-Wilk ($W=0.7455$, $p<0.001$) [24], and Breusch-Pagan detects nonconstant variance ($LM=41.5744$, $p<0.001$) [25]. These diagnostics support nonparametric rank-based inference, but they also caution against treating a single RMSE as a complete uncertainty description. Holm-Bonferroni adjustment is recommended for any expanded family of post-hoc hypotheses; the saved artifact reports unadjusted Wilcoxon p-values.

## VIII. Software Architecture and Deployment

CarbonTwin uses a modular FastAPI backend with endpoints for asynchronous training, status and report retrieval, and prediction. The prediction endpoint loads the scikit-learn model and preprocessor, transforms a single configuration, and returns `total_co2e_kg`. Artifacts include the HDF5 student, scikit-learn backup, preprocessor, model card, EDA plots, and statistical report. An independent Streamlit laboratory exposes EDA, retraining, statistical results, artifact download, and an interactive simulator. The wider application uses a React/Next.js frontend, PostgreSQL persistence, and a conversational assistant implemented with LangChain and Gemini when configured; a local carbon adviser is used as fallback. This separation keeps serving, experimentation, and user-facing operational workflows decoupled.

## IX. Threats to Validity and Limitations

Internal validity is constrained by the calibrated target equation: excellent predictive fit partly reflects recovery of a controlled generative relationship, even though input carbon intensity and crop records originate in real public sources. The held-out test set is a random split from the same construction process, so it does not demonstrate temporal, geographical, or hardware transfer. The system does not directly measure device power, WAN energy, cloud PUE, embodied emissions, Scope 3 procurement impacts, or farm-process emissions. Solar mitigation is a fixed 35% scenario rather than a radiation-, battery-, and load-aware measurement. Seasonal irradiance, rural network latency and outages, sensor aging, crop-management heterogeneity, and shifts in grid intensity can change deployment behaviour. Finally, the statistical tests compare correlated folds from one dataset; their p-values establish relative performance under this protocol, not causal superiority in all settings.

## X. Conclusion and Future Work

This work presents a transparent surrogate framework for operational carbon estimation in agricultural digital twins. On a documented hybrid dataset, SVR achieved the lowest test RMSE (25.7942 kg CO2e) and strongest explained variance (R2 = 0.9874), with statistically significant fold-level advantages over the evaluated alternatives. The framework is useful as a configuration-time decision aid because it couples interpretable inputs, a stated accounting model, historical grid conditions, and deployable artifacts.

Next steps should replace calibrated telemetry parameters with measured device, gateway, network, and cloud traces; evaluate temporal and leave-country-out generalisation; incorporate explicit PUE and embodied hardware emissions; and validate the Keras student's fidelity before using it for accuracy-critical predictions. Sentinel-2-informed crop and field signals, solar irradiance telemetry, uncertainty-aware prediction intervals, and benchmarked TinyML deployment are promising extensions.

## References

[1] M. Grieves and J. Vickers, “Digital twin: Mitigating unpredictable, undesirable emergent behavior in complex systems,” in *Transdisciplinary Perspectives on Complex Systems*, 2017, pp. 85-113.

[2] F. Tao, H. Zhang, A. Liu, and A. Y. C. Nee, “Digital twin in industry: State-of-the-art,” *IEEE Trans. Ind. Informatics*, vol. 15, no. 4, pp. 2405-2415, 2019, doi: 10.1109/TII.2018.2873186.

[3] W. Kritzinger, M. Karner, G. Traar, J. Henjes, and W. Sihn, “Digital twin in manufacturing: A categorical literature review,” *IFAC-PapersOnLine*, vol. 51, no. 11, pp. 1016-1022, 2018, doi: 10.1016/j.ifacol.2018.08.474.

[4] A. Fuller, Z. Fan, C. Day, and C. Barlow, “Digital twin: Enabling technologies, challenges and open research,” *IEEE Access*, vol. 8, pp. 108952-108971, 2020, doi: 10.1109/ACCESS.2020.2998358.

[5] A. Nasirahmadi and O. Hensel, “Toward the next generation of digitalization in agriculture based on digital twin paradigm,” *Sensors*, vol. 22, no. 2, Art. no. 498, 2022, doi: 10.3390/s22020498.

[6] W. Purcell, T. Neubauer, and K. Mallinger, “Digital twins in agriculture: Challenges and opportunities for environmental sustainability,” *Current Opinion in Environmental Sustainability*, vol. 61, Art. no. 101252, 2023, doi: 10.1016/j.cosust.2022.101252.

[7] H. A. Alharbi and M. Aldossary, “Energy-efficient edge-fog-cloud architecture for IoT-based smart agriculture environment,” *IEEE Access*, vol. 9, pp. 110480-110492, 2021, doi: 10.1109/ACCESS.2021.3101397.

[8] C. Huck, A. Gobrecht, T. Salou, V. Bellon-Maurel, and E. Loiseau, “Environmental assessment of digitalization in agriculture: A systematic review,” *J. Cleaner Production*, vol. 454, Art. no. 143369, 2024, doi: 10.1016/j.jclepro.2024.143369.

[9] P. La Rocca, G. Guennebaud, A. Bugeau, and A.-L. Ligozat, “Estimating the carbon footprint of digital agriculture deployment: A bottom-up parametric modelling approach,” *J. Industrial Ecology*, vol. 28, pp. 1801-1815, 2024, doi: 10.1111/jiec.13568.

[10] Green Software Foundation, *Software Carbon Intensity Specification*, 2024. [Online]. Available: https://sci.greensoftware.foundation/

[11] Cloud Carbon Footprint, *Methodology*, 2024. [Online]. Available: https://www.cloudcarbonfootprint.org/docs/methodology/

[12] H. Ritchie, P. Rosado, and M. Roser, “Energy,” *Our World in Data*, 2023. [Online]. Available: https://ourworldindata.org/energy

[13] Ember, *Yearly Electricity Data*, 2025. [Online]. Available: https://ember-energy.org/data/yearly-electricity-data/

[14] L. Breiman, “Random forests,” *Mach. Learn.*, vol. 45, pp. 5-32, 2001, doi: 10.1023/A:1010933404324.

[15] T. Chen and C. Guestrin, “XGBoost: A scalable tree boosting system,” in *Proc. 22nd ACM SIGKDD*, 2016, pp. 785-794, doi: 10.1145/2939672.2939785.

[16] A. J. Smola and B. Schölkopf, “A tutorial on support vector regression,” *Stat. Comput.*, vol. 14, pp. 199-222, 2004, doi: 10.1023/B:STCO.0000035301.49549.88.

[17] D. H. Wolpert, “Stacked generalization,” *Neural Netw.*, vol. 5, no. 2, pp. 241-259, 1992, doi: 10.1016/S0893-6080(05)80023-1.

[18] F. Pedregosa *et al.*, “Scikit-learn: Machine learning in Python,” *J. Mach. Learn. Res.*, vol. 12, pp. 2825-2830, 2011.

[19] M. Friedman, “The use of ranks to avoid the assumption of normality implicit in the analysis of variance,” *J. Amer. Stat. Assoc.*, vol. 32, pp. 675-701, 1937, doi: 10.1080/01621459.1937.10503522.

[20] J. Demšar, “Statistical comparisons of classifiers over multiple data sets,” *J. Mach. Learn. Res.*, vol. 7, pp. 1-30, 2006.

[21] F. Wilcoxon, “Individual comparisons by ranking methods,” *Biometrics Bull.*, vol. 1, no. 6, pp. 80-83, 1945, doi: 10.2307/3001968.

[22] C. Nadeau and Y. Bengio, “Inference for the generalization error,” *Mach. Learn.*, vol. 52, pp. 239-281, 2003, doi: 10.1023/A:1024068626366.

[23] B. Efron and R. J. Tibshirani, *An Introduction to the Bootstrap*. New York, NY, USA: Chapman & Hall, 1993.

[24] S. S. Shapiro and M. B. Wilk, “An analysis of variance test for normality,” *Biometrika*, vol. 52, pp. 591-611, 1965, doi: 10.1093/biomet/52.3-4.591.

[25] T. S. Breusch and A. R. Pagan, “A simple test for heteroscedasticity and random coefficient variation,” *Econometrica*, vol. 47, no. 5, pp. 1287-1294, 1979, doi: 10.2307/1911963.

[26] E. Masanet *et al.*, “Recalibrating global data center energy-use estimates,” *Science*, vol. 367, no. 6481, pp. 984-986, 2020, doi: 10.1126/science.aba3758.

[27] M. R. Islam *et al.*, “The internet of things for sustainable agriculture: A comprehensive review,” *IEEE Access*, vol. 8, pp. 177573-177595, 2020, doi: 10.1109/ACCESS.2020.3027354.

[28] IPCC, *Climate Change 2023: Synthesis Report*. Geneva, Switzerland: IPCC, 2023, doi: 10.59327/IPCC/AR6-9789291691647.
