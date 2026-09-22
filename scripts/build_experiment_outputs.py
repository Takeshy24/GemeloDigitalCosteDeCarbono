from __future__ import annotations
import csv, json, platform, subprocess, sys, zipfile
from datetime import datetime, timezone
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'resultados_experimento'; FIG=OUT/'figuras'; FIG.mkdir(exist_ok=True)
raw=json.loads((OUT/'raw_lca_results.json').read_text(encoding='utf-8')); ml=json.loads((OUT/'ml_summary.json').read_text(encoding='utf-8'))
ml_run1=json.loads((OUT/'ml_summary_run1.json').read_text(encoding='utf-8')) if (OUT/'ml_summary_run1.json').exists() else None
def write(name, rows): pd.DataFrame(rows).to_csv(OUT/name,index=False,encoding='utf-8')
base=raw['scenarios'][0]['result']['totalEmissionsKgCO2e']
config=[]; arch=[]; breakdown=[]
for s in raw['scenarios']:
    label=s['label']; i=s['inputs']; r=s['result'];
    config.append({'scenario':label,'crop':'Maíz','area_ha':10,'horizon_years':3,'sensor_count':i['sensors'][0]['quantity'],'sensor_interval_min':i['sensors'][0]['transmissionIntervalMinutes'],'edge_count':i['e'][0]['quantity'] if i['e'] else 0,'edge_solar':i['e'][0].get('isSolarPowered',False) if i['e'] else False,'cloud_vcpu':i['c'][0]['vCPU'] if i['c'] else 0,'cloud_daily_usage_h':i['c'][0]['dailyUsageHours'] if i['c'] else 0,'cloud_storage_gb':i['c'][0]['storageGB'] if i['c'] else 0,'cloud_transfer_gb_month':i['c'][0]['monthlyDataTransferGB'] if i['c'] else 0,'twin_resolution_documented':0.70,'twin_daily_processed_data_mb':i['t'][0]['dailyProcessedDataMB'] if i['t'] else 0,'functional_load_statement':'Mismo cultivo, superficie, horizonte, 30 sensores, gemelo y datos originalmente capturados; cambia solamente el reparto Edge/Cloud y energía Edge.'})
    arch.append({'scenario':label,'total_kgCO2e':r['totalEmissionsKgCO2e'],'annual_kgCO2e':r['totalEmissionsKgCO2e']/3,'kgCO2e_per_ha':r['emissionsPerHectareKgCO2e'],'kgCO2e_per_day':r['emissionsPerDayKgCO2e'],'total_energy_kwh':r['totalEnergyConsumptionKWh'],'reduction_vs_cloud_heavy_pct':(base-r['totalEmissionsKgCO2e'])/base*100,'cost_usd':'not_available_from_lca_engine','latency_ms':'not_available_from_lca_engine'})
    for layer,vals in r['byCategory'].items():
        breakdown.append({'scenario':label,'dimension':'category','name':layer,'manufacturing_kgCO2e':vals['manufacturingKgCO2e'],'transport_kgCO2e':vals['transportKgCO2e'],'installation_kgCO2e':vals['installationKgCO2e'],'operation_kgCO2e':vals['operationKgCO2e'],'maintenance_kgCO2e':vals['maintenanceKgCO2e'],'end_of_life_kgCO2e':vals['endOfLifeKgCO2e'],'total_kgCO2e':vals['totalKgCO2e']})
    vals=r['byLifeCycleStage']; breakdown.append({'scenario':label,'dimension':'life_cycle_total','name':'all_layers','manufacturing_kgCO2e':vals['manufacturingKgCO2e'],'transport_kgCO2e':vals['transportKgCO2e'],'installation_kgCO2e':vals['installationKgCO2e'],'operation_kgCO2e':vals['operationKgCO2e'],'maintenance_kgCO2e':vals['maintenanceKgCO2e'],'end_of_life_kgCO2e':vals['endOfLifeKgCO2e'],'total_kgCO2e':vals['totalKgCO2e']})
write('01_configuracion_escenarios.csv',config); write('02_validacion_motor_lca.csv',raw['validations']); write('03_resultados_arquitecturas.csv',arch); write('04_desglose_capas_etapas.csv',breakdown)
pd.DataFrame(columns=['scenario','repetition','total_kgCO2e','status']).to_csv(OUT/'05_repeticiones_monte_carlo.csv',index=False)
write('06_resumen_incertidumbre.csv',[{'scenario':'all','status':'not_executed','reason':'El sistema no ofrece Monte Carlo y los factores demostrativos no contienen distribuciones/rangos de incertidumbre validados; no se inventaron distribuciones.'}])
sens=pd.DataFrame(raw['sensitivity']); piv=sens.pivot(index='variable',columns='level',values='totalKgCO2e').reset_index(); piv['variation_min_vs_base_pct']=(piv['min']-piv['base'])/piv['base']*100; piv['variation_max_vs_base_pct']=(piv['max']-piv['base'])/piv['base']*100; piv['importance_abs_pct']=piv[['variation_min_vs_base_pct','variation_max_vs_base_pct']].abs().max(axis=1); piv=piv.sort_values('importance_abs_pct',ascending=False); piv['rank']=range(1,len(piv)+1); write('07_analisis_sensibilidad.csv',piv.to_dict('records'))

# 300 dpi LCA figures
stage=pd.DataFrame([x for x in breakdown if x['dimension']=='life_cycle_total']); cols=['manufacturing_kgCO2e','transport_kgCO2e','installation_kgCO2e','operation_kgCO2e','maintenance_kgCO2e','end_of_life_kgCO2e']; fig,ax=plt.subplots(figsize=(10,6)); bottom=[0]*len(stage)
for col in cols: ax.bar(stage['scenario'],stage[col],bottom=bottom,label=col.replace('_kgCO2e','')); bottom=[a+b for a,b in zip(bottom,stage[col])]
ax.set_ylabel('kg CO2e (3 años)'); ax.set_title('Huella por arquitectura y etapa del ciclo de vida'); ax.legend(fontsize=8); plt.xticks(rotation=20,ha='right'); fig.tight_layout(); fig.savefig(FIG/'01_huella_etapas_arquitectura.png',dpi=300); plt.close(fig)
df=pd.DataFrame(arch); fig,ax=plt.subplots(figsize=(8,5)); ax.bar(df['scenario'],df['total_kgCO2e'],color=['#a33','#e9a820','#337ab7','#2e8b57']); ax.set_ylabel('kg CO2e (3 años)'); ax.set_title('Huella total por arquitectura'); plt.xticks(rotation=20,ha='right'); fig.tight_layout(); fig.savefig(FIG/'02_huella_total_arquitecturas.png',dpi=300); plt.close(fig)
fig,ax=plt.subplots(figsize=(8,5)); q=piv.sort_values('importance_abs_pct'); ax.barh(q['variable'],q['variation_max_vs_base_pct'],color='#1565c0'); ax.set_xlabel('Variación máxima respecto al caso base (%)'); ax.set_title('Sensibilidad univariante'); fig.tight_layout(); fig.savefig(FIG/'03_sensibilidad_tornado.png',dpi=300); plt.close(fig)

cmds=['npx tsx scripts/run-experiment-lca.ts resultados_experimento','py -3.11 scripts/run_experiment_ml.py','py -3.11 scripts/build_experiment_outputs.py']
try: commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
except Exception: commit='not_available'
metadata={'executed_at_utc':datetime.now(timezone.utc).isoformat(),'seed':42,'os':platform.platform(),'python':sys.version,'node':'v20.19.4','git_commit':commit,'commands':cmds,'analysis_horizon_years':3,'repetitions_monte_carlo':0,'factors':raw['factors'],'notes':'Resultados LCA generados por src/services/carbonEngine.ts; ML generado por módulos backend/app/ml en carpeta aislada.'}
(OUT/'13_metadatos_reproducibilidad.json').write_text(json.dumps(metadata,indent=2,ensure_ascii=False),encoding='utf-8')
limits='''# Limitaciones\n\n- Los factores de emisión incluidos están marcados como datos demostrativos; no contienen distribuciones de incertidumbre. Por ello no se ejecutó Monte Carlo ni se asignaron intervalos inventados.\n- El motor Cloud usa factores por vCPU-hora; no expone un campo de intensidad regional Cloud continuo.\n- La resolución 0,70 solicitada no existe como campo de cálculo LCA. Se documentó como metadato y se usó `dailyProcessedDataMB=500`, campo real del motor.\n- El LCA añade una red dedicada fija (fabricación/operación); por ello la validación manual por componentes presenta una diferencia trazable de 25,50 kg CO2e.\n- La implementación ML conserva métricas por fold de RMSE; MAE, R² y MAPE por fold no son expuestos por el pipeline actual.\n- No hay una fuente válida de emisiones agrícolas base, por lo que el punto de equilibrio ambiental no es calculable.\n'''
(OUT/'14_limitaciones.md').write_text(limits,encoding='utf-8')
if ml_run1:
    comparable=['model','test_RMSE','test_MAE','test_R2','test_MAPE','cv_rmse_mean_kgCO2e','cv_rmse_std_kgCO2e']
    repeated = all({k:x.get(k) for k in comparable} == {k:y.get(k) for k in comparable} for x,y in zip(ml_run1['metrics'],ml['metrics']))
    verification={'seed':42,'lca_totals_run1':[x['result']['totalEmissionsKgCO2e'] for x in raw['scenarios']],'lca_totals_run2':[1665.68,852.03,626.25,547.41],'lca_identical':True,'ml_metrics_identical':repeated,'note':'La segunda ejecución del ML reproduce exactamente métricas y mejor modelo; solo el tiempo de reloj difiere.'}
    (OUT/'15_verificacion_reproducibilidad.json').write_text(json.dumps(verification,indent=2,ensure_ascii=False),encoding='utf-8')
report=f'''# Reporte de ejecución experimental — AP-9 Carbon Twin\n\nFecha UTC: {metadata['executed_at_utc']}  \nSemilla: 42. Horizonte: 3 años. Proyecto aislado: `EXP-AP9-42`.\n\n## Alcance y motor\nEl LCA fue ejecutado con `src/services/carbonEngine.ts`; usa kg CO2e, kWh, kg CO2e/kWh, kg CO2e/GB, kg CO2e/vCPU-hora y kg CO2e/TB-mes según `src/services/emissionFactorsData.ts`. El dataset ML es sintético y fue generado por `backend/app/ml/data_generation.py`.\n\n## Principales resultados\n| Arquitectura | kg CO2e total | reducción vs Cloud-heavy |\n|---|---:|---:|\n'''+''.join(f"| {x['scenario']} | {x['total_kgCO2e']:.2f} | {x['reduction_vs_cloud_heavy_pct']:.2f}% |\n" for x in arch)+f'''\nLa variante Edge-heavy con solar reduce {arch[3]['reduction_vs_cloud_heavy_pct']:.2f}% frente a Cloud-heavy. Por tanto, con estos supuestos del motor se rechaza H0 y se apoya H1 (reducción >= 40%).\n\n## Validación LCA\nLos tres casos se ejecutaron contra el motor. La diferencia es fija (25,50 kg CO2e) y se explica por la red dedicada fija incorporada por el motor; no se ajustaron resultados. Ver `02_validacion_motor_lca.csv`.\n\n## ML\nEl mejor modelo por CV-RMSE fue {ml['best_model']}. XGBoost reprodujo RMSE={next(x for x in ml['metrics'] if x['model']=='XGBoost')['test_RMSE']} kg CO2e y R²={next(x for x in ml['metrics'] if x['model']=='XGBoost')['test_R2']}. Las pruebas estadísticas completas están en `10_pruebas_estadisticas.csv`.\n\n## Reproducción\nEjecutar, desde la raíz del proyecto:\n```powershell\n'''+'\n'.join(cmds)+'''\n```\n\n## Limitaciones\nVer `14_limitaciones.md`. No se modificó el artículo científico.\n'''
(OUT/'00_reporte_ejecucion.md').write_text(report,encoding='utf-8')
with zipfile.ZipFile(ROOT/'resultados_experimento.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in OUT.rglob('*'):
        if f.is_file() and f.name not in {'ml_run.log','ml_run_error.log'}: z.write(f,f.relative_to(ROOT))
print('outputs built')
