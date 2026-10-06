# Reporte de Pruebas Estadísticas — Pipeline ML Carbon Twin AP-9

## Tabla resumen de modelos

| Modelo | CV-RMSE (μ) | CV-RMSE (σ) | RMSE test | MAE test | R² test | MAPE test |
|--------|-------------|-------------|-----------|----------|---------|-----------|
| RandomForest | 80.8139 | 5.9956 | 86.2662 | 50.742 | 0.858877 | 48.2365 |
| XGBoost | 57.01 | 4.6346 | 64.6393 | 35.3725 | 0.920766 | 26.2187 |
| SVR | 27.7427 | 2.6027 | 25.7887 | 14.3434 | 0.987388 | 8.6252 |
| Stacking | 33.5686 | 3.3405 | 32.5166 | 17.9727 | 0.979949 | 12.837 |
| Blending | 43.4265 | 4.9628 | 41.7663 | 22.0202 | 0.96692 | 17.2549 |

---

## 1. Test de Friedman

- **Estadístico**: `12.0`
- **p-value**: `0.017351` *
- **Interpretación**: p=0.0174 (*). ✓ Hay diferencias significativas entre los modelos.

---

## 2. Test de Wilcoxon (post-hoc)

**SVR vs RandomForest**
- Estadístico: `6.0`
- p-value: `0.125` ns
- Interpretación: Sin diferencia significativa con RandomForest.

**SVR vs XGBoost**
- Estadístico: `6.0`
- p-value: `0.125` ns
- Interpretación: Sin diferencia significativa con XGBoost.

**SVR vs Stacking**
- Estadístico: `6.0`
- p-value: `0.125` ns
- Interpretación: Sin diferencia significativa con Stacking.

**SVR vs Blending**
- Estadístico: `6.0`
- p-value: `0.125` ns
- Interpretación: Sin diferencia significativa con Blending.


---

## 3. t-test Corregido (Nadeau-Bengio)

- **p-value**: `0.078773` ns
- **Interpretación**: p=0.0788 (ns). Sin diferencia significativa tras corrección.

---

## 4. Bootstrap Confidence Interval

- **p-value**: `` 
- **Interpretación**: RMSE del mejor modelo: 25.7887 (IC 95%: [20.6336, 31.3907])
- **IC 95%**: [20.633593, 31.390668]

---

## 5. Test de Shapiro-Wilk (normalidad)

- **Estadístico**: `0.745584`
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