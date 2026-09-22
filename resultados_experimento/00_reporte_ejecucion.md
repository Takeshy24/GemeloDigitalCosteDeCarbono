# Reporte de ejecución experimental — AP-9 Carbon Twin

Fecha UTC: 2026-09-15T06:20:13.852898+00:00  
Semilla: 42. Horizonte: 3 años. Proyecto aislado: `EXP-AP9-42`.

## Alcance y motor
El LCA fue ejecutado con `src/services/carbonEngine.ts`; usa kg CO2e, kWh, kg CO2e/kWh, kg CO2e/GB, kg CO2e/vCPU-hora y kg CO2e/TB-mes según `src/services/emissionFactorsData.ts`. El dataset ML es sintético y fue generado por `backend/app/ml/data_generation.py`.

## Principales resultados
| Arquitectura | kg CO2e total | reducción vs Cloud-heavy |
|---|---:|---:|
| Cloud-heavy | 1665.68 | 0.00% |
| Híbrida | 852.03 | 48.85% |
| Edge-heavy sin solar | 626.25 | 62.40% |
| Edge-heavy con solar | 547.41 | 67.14% |

La variante Edge-heavy con solar reduce 67.14% frente a Cloud-heavy. Por tanto, con estos supuestos del motor se rechaza H0 y se apoya H1 (reducción >= 40%).

## Validación LCA
Los tres casos se ejecutaron contra el motor. La diferencia es fija (25,50 kg CO2e) y se explica por la red dedicada fija incorporada por el motor; no se ajustaron resultados. Ver `02_validacion_motor_lca.csv`.

## ML
El mejor modelo por CV-RMSE fue XGBoost. XGBoost reprodujo RMSE=2338.6075 kg CO2e y R²=0.923563. Las pruebas estadísticas completas están en `10_pruebas_estadisticas.csv`.

## Reproducción
Ejecutar, desde la raíz del proyecto:
```powershell
npx tsx scripts/run-experiment-lca.ts resultados_experimento
py -3.11 scripts/run_experiment_ml.py
py -3.11 scripts/build_experiment_outputs.py
```

## Limitaciones
Ver `14_limitaciones.md`. No se modificó el artículo científico.
