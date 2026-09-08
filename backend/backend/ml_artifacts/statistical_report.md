# Reporte de Pruebas Estadísticas — Pipeline ML Carbon Twin AP-9

## Tabla resumen de modelos

| Modelo | CV-RMSE (μ) | CV-RMSE (σ) | RMSE test | MAE test | R² test | MAPE test |
|--------|-------------|-------------|-----------|----------|---------|-----------|
| RandomForest | 4232.4137 | 1375.3184 | 3749.6664 | 2002.3672 | 0.803494 | 103.1333 |
| XGBoost | 2602.3778 | 838.1867 | 2338.6075 | 1217.2798 | 0.923563 | 53.0074 |
| SVR | 5902.0769 | 1756.3972 | 4908.5281 | 1808.0625 | 0.663262 | 40.7558 |
| Stacking | 2659.5655 | 593.1875 | 2212.8853 | 1183.1971 | 0.93156 | 42.4162 |
| Blending | 3708.6263 | 1363.0939 | 2921.9377 | 1349.7331 | 0.880675 | 46.7076 |

---

## 1. Test de Friedman

- **Estadístico**: `35.92`
- **p-value**: `0.0` ***
- **Interpretación**: p=0.0000 (***). ✓ Hay diferencias significativas entre los modelos.

---

## 2. Test de Wilcoxon (post-hoc)

**XGBoost vs RandomForest**
- Estadístico: `55.0`
- p-value: `0.000977` ***
- Interpretación: XGBoost es significativamente mejor que RandomForest.

**XGBoost vs SVR**
- Estadístico: `55.0`
- p-value: `0.000977` ***
- Interpretación: XGBoost es significativamente mejor que SVR.

**XGBoost vs Stacking**
- Estadístico: `34.0`
- p-value: `0.27832` ns
- Interpretación: Sin diferencia significativa con Stacking.

**XGBoost vs Blending**
- Estadístico: `54.0`
- p-value: `0.001953` **
- Interpretación: XGBoost es significativamente mejor que Blending.


---

## 3. t-test Corregido (Nadeau-Bengio)

- **p-value**: `0.778202` ns
- **Interpretación**: p=0.7782 (ns). Sin diferencia significativa tras corrección.

---

## 4. Bootstrap Confidence Interval

- **p-value**: `` 
- **Interpretación**: RMSE del mejor modelo: 2338.6075 (IC 95%: [1837.1388, 2924.8365])
- **IC 95%**: [1837.138797, 2924.836492]

---

## 5. Test de Shapiro-Wilk (normalidad)

- **Estadístico**: `0.709604`
- **p-value**: `0.0` ***
- **Interpretación**: p=0.0000 (***). Los residuales NO siguen una distribución normal.

---

## 6. Test de Breusch-Pagan (homocedasticidad)

- **p-value**: `0.0` ***
- **Interpretación**: p=0.0000 (***). Heterocedasticidad detectada (varianza no constante).

---

## Convención de significancia

| Símbolo | p-value |
|---------|---------|
| `***`   | < 0.001 |
| `**`    | < 0.01  |
| `*`     | < 0.05  |
| `ns`    | ≥ 0.05  |

*Nivel de significancia α = 0.05*