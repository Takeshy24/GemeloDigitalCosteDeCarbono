# Reporte de Pruebas Estadísticas — Pipeline ML Carbon Twin AP-9

## Tabla resumen de modelos

| Modelo | CV-RMSE (μ) | CV-RMSE (σ) | RMSE test | MAE test | R² test | MAPE test |
|--------|-------------|-------------|-----------|----------|---------|-----------|
| RandomForest | 64.2792 | 6.7788 | 73.3859 | 42.4271 | 0.897873 | 38.3875 |
| XGBoost | 29.4993 | 3.5068 | 29.9698 | 18.6687 | 0.982967 | 11.7142 |
| SVR | 25.4655 | 3.9084 | 25.7942 | 14.3474 | 0.987383 | 8.6414 |
| Stacking | 29.7474 | 4.7494 | 32.5168 | 17.9727 | 0.979949 | 12.8371 |
| Blending | 38.8664 | 7.4131 | 32.2673 | 17.1081 | 0.980256 | 11.2929 |

---

## 1. Test de Friedman

- **Estadístico**: `37.04`
- **p-value**: `0.0` ***
- **Interpretación**: p=0.0000 (***). ✓ Hay diferencias significativas entre los modelos.

---

## 2. Test de Wilcoxon (post-hoc)

**SVR vs RandomForest**
- Estadístico: `55.0`
- p-value: `0.000977` ***
- Interpretación: SVR es significativamente mejor que RandomForest.

**SVR vs XGBoost**
- Estadístico: `54.0`
- p-value: `0.001953` **
- Interpretación: SVR es significativamente mejor que XGBoost.

**SVR vs Stacking**
- Estadístico: `55.0`
- p-value: `0.000977` ***
- Interpretación: SVR es significativamente mejor que Stacking.

**SVR vs Blending**
- Estadístico: `55.0`
- p-value: `0.000977` ***
- Interpretación: SVR es significativamente mejor que Blending.


---

## 3. t-test Corregido (Nadeau-Bengio)

- **p-value**: `0.007298` **
- **Interpretación**: p=0.0073 (**). Diferencia significativa tras corrección.

---

## 4. Bootstrap Confidence Interval

- **p-value**: `` 
- **Interpretación**: RMSE del mejor modelo: 25.7942 (IC 95%: [20.6325, 31.3956])
- **IC 95%**: [20.632503, 31.395599]

---

## 5. Test de Shapiro-Wilk (normalidad)

- **Estadístico**: `0.745457`
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