# Reporte CRISP-DM — Análisis de coste de carbono de gemelos digitales

## 1. Comprensión y exploración de los datos
- Fuente: `backend\ml_artifacts\real_dataset.csv`; dataset real: **True**.
- Registros: **2,500**; variables predictoras: **9**; objetivo: `total_co2e_kg`.
- Las tablas y figuras EDA muestran distribución, correlaciones, dispersión, categorías y outliers.

## 2. Entrenamiento
Se evaluaron Random Forest, XGBoost, SVR, Stacking y Blending con preprocesamiento reproducible y búsqueda de hiperparámetros.

## 3. Selección del mejor modelo
El ganador se seleccionó por menor CV-RMSE: **SVR**.

## 4. Validación cruzada
| Modelo | RMSE test | MAE test | R² test | CV-RMSE (media ± sd) |
|---|---:|---:|---:|---:|
| RandomForest | 86.2662 | 50.7420 | 0.8589 | 80.8139 ± 5.9956 |
| XGBoost | 64.6393 | 35.3725 | 0.9208 | 57.0100 ± 4.6346 |
| SVR | 25.7887 | 14.3434 | 0.9874 | 27.7427 ± 2.6027 |
| Stacking | 32.5166 | 17.9727 | 0.9799 | 33.5686 ± 3.3405 |
| Blending | 41.7663 | 22.0202 | 0.9669 | 43.4265 ± 4.9628 |

## 5. Pruebas estadísticas rigurosas
Se aplicaron Friedman, Wilcoxon post-hoc, t pareado corregido de Nadeau-Bengio, bootstrap del RMSE, Shapiro-Wilk y Breusch-Pagan.
Los p-values e interpretaciones se encuentran en `statistical_report.md` y en la interfaz.

## 6. Interpretabilidad y explicabilidad
La importancia por permutación del conjunto de prueba explica el ganador (SVR); una mayor disminución del score indica mayor influencia predictiva.
- **cloud_region_intensity**: 218.701824 ± 9.234311
- **model_resolution**: 140.841942 ± 5.622628
- **solar_powered**: 72.718084 ± 2.968499
- **operation_days**: 62.750040 ± 4.401746
- **crop_type_soy**: 19.874381 ± 2.550444
- **sensor_count**: 14.240239 ± 4.616477
- **crop_type_rice**: 12.401923 ± 1.502022
- **edge_count**: 11.107325 ± 3.437428
- **crop_type_wheat**: 5.461617 ± 1.459019
- **data_volume_gb_day**: 4.253682 ± 1.608436

## Reproducibilidad y limitaciones
Semilla: `42`. La selección por CV evita decidir solo con un split; las conclusiones estadísticas se interpretan con α = 0.05.