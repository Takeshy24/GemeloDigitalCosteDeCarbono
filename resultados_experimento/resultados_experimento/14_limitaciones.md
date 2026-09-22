# Limitaciones

- Los factores de emisión incluidos están marcados como datos demostrativos; no contienen distribuciones de incertidumbre. Por ello no se ejecutó Monte Carlo ni se asignaron intervalos inventados.
- El motor Cloud usa factores por vCPU-hora; no expone un campo de intensidad regional Cloud continuo.
- La resolución 0,70 solicitada no existe como campo de cálculo LCA. Se documentó como metadato y se usó `dailyProcessedDataMB=500`, campo real del motor.
- El LCA añade una red dedicada fija (fabricación/operación); por ello la validación manual por componentes presenta una diferencia trazable de 25,50 kg CO2e.
- La implementación ML conserva métricas por fold de RMSE; MAE, R² y MAPE por fold no son expuestos por el pipeline actual.
- No hay una fuente válida de emisiones agrícolas base, por lo que el punto de equilibrio ambiental no es calculable.
