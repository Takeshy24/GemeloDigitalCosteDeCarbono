# Reporte de Pruebas Estadísticas — Pipeline ML Carbon Twin AP-9

## Tabla resumen de modelos

| Modelo | CV-RMSE (μ) | CV-RMSE (σ) | RMSE test | MAE test | R² test | MAPE test |
|--------|-------------|-------------|-----------|----------|---------|-----------|
| RandomForest | 3699.2959 | 1287.5878 | 3193.9958 | 1681.3852 | 0.85742 | 73.8022 |
| XGBoost | 2980.1675 | 905.1661 | 2909.5852 | 1513.1987 | 0.881682 | 58.7049 |
| SVR | 6029.2342 | 1818.0826 | 5030.3698 | 1881.3268 | 0.646337 | 45.978 |
| Stacking | 3028.5754 | 606.7342 | 2654.8385 | 1459.7429 | 0.901493 | 44.6908 |
| Blending | 3756.9484 | 1340.9736 | 3021.9306 | 1444.9496 | 0.872368 | 47.9325 |

---

## 1. Test de Friedman

- **Estadístico**: `32.24`
- **p-value**: `2e-06` ***
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
- Estadístico: `37.0`
- p-value: `0.1875` ns
- Interpretación: Sin diferencia significativa con Stacking.

**XGBoost vs Blending**
- Estadístico: `54.0`
- p-value: `0.001953` **
- Interpretación: XGBoost es significativamente mejor que Blending.


---

## 3. t-test Corregido (Nadeau-Bengio)

- **p-value**: `0.810834` ns
- **Interpretación**: p=0.8108 (ns). Sin diferencia significativa tras corrección.

---

## 4. Bootstrap Confidence Interval

- **p-value**: `` 
- **Interpretación**: RMSE del mejor modelo: 2909.5852 (IC 95%: [2280.9641, 3600.4499])
- **IC 95%**: [2280.964056, 3600.44993]

---

## 5. Test de Shapiro-Wilk (normalidad)

- **Estadístico**: `0.712241`
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