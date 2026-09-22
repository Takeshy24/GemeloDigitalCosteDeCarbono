"""Ejecución ML aislada y reproducible para AP-9; no modifica ml_artifacts existentes."""
from __future__ import annotations
import json, os, random, sys, time, io
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.inspection import permutation_importance
from joblib import parallel_backend

ROOT = Path(__file__).resolve().parents[1]
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8','utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
OUT = ROOT / 'resultados_experimento'
ML = OUT / 'ml_artifacts'
FIG = OUT / 'figuras'
OUT.mkdir(exist_ok=True); ML.mkdir(exist_ok=True); FIG.mkdir(exist_ok=True)
sys.path.insert(0, str(ROOT))
SEED=42
random.seed(SEED); np.random.seed(SEED); os.environ['PYTHONHASHSEED']=str(SEED)

from backend.app.ml import training, statistical_tests
from backend.app.ml.data_generation import generate_dataset

training.ARTIFACTS_DIR = ML
statistical_tests.ARTIFACTS_DIR = ML
statistical_tests.PLOTS_DIR = ML / 'plots'

def save_csv(name, rows): pd.DataFrame(rows).to_csv(OUT/name, index=False, encoding='utf-8')

t0=time.perf_counter()
df=generate_dataset(n_samples=2500, seed=SEED)
df.to_csv(OUT/'dataset_sintetico_semilla42.csv',index=False)
with parallel_backend('loky', n_jobs=2):
    train=training.train_all_models(df=df, n_iter_search=20, cv_folds=5, final_cv_folds=10, random_seed=SEED)
elapsed=time.perf_counter()-t0
results=train['results']; best=train['best_name']; y_test=np.asarray(train['y_test']); y_pred=np.asarray(results[best]['y_pred'])
tests=statistical_tests.run_statistical_tests(results,best,y_test)

metrics=[]; folds=[]
for name,data in results.items():
    row={'model':name, **{f'test_{k}':v for k,v in data['test_metrics'].items()}, 'cv_rmse_mean_kgCO2e':data['cv_rmse_mean'], 'cv_rmse_std_kgCO2e':data['cv_rmse_std'], 'training_time_seconds_not_exposed_by_pipeline':'not_available'}
    metrics.append(row)
    for i,rmse in enumerate(data['cv_rmse_scores'],1): folds.append({'model':name,'fold':i,'rmse_kgCO2e':rmse,'mae_kgCO2e':'not_available','r2':'not_available','mape_pct':'not_available'})
save_csv('08_metricas_modelos.csv',metrics); save_csv('09_metricas_por_fold.csv',folds)

test_rows=[]
for key,val in tests.items():
    vals=val if isinstance(val,list) else [val]
    for v in vals:
        test_rows.append({'test':v.get('test',key),'comparison':v.get('comparison',''),'statistic':v.get('statistic',v.get('t_statistic',v.get('lm_statistic',''))),'p_value':v.get('p_value',''),'alpha':0.05,'significant':v.get('significant',''),'interpretation':v.get('interpretation',''),'ci_lower':v.get('ci_lower',''),'ci_upper':v.get('ci_upper',''),'n_bootstrap':v.get('n_bootstrap','')})
save_csv('10_pruebas_estadisticas.csv',test_rows)

feature_names=train['feature_names']; model=train['best_model']; imp=[]
internal=None
if hasattr(model,'feature_importances_'): internal=np.asarray(model.feature_importances_)
elif hasattr(model,'rf') and hasattr(model.rf,'feature_importances_'): internal=np.asarray(model.rf.feature_importances_)
perm=permutation_importance(model,train['X_test'],y_test,n_repeats=20,random_state=SEED,n_jobs=-1,scoring='neg_root_mean_squared_error')
for i,f in enumerate(feature_names): imp.append({'variable':f,'internal_importance':float(internal[i]) if internal is not None and i<len(internal) else 'not_available','permutation_importance_mean':float(perm.importances_mean[i]),'permutation_importance_std':float(perm.importances_std[i]),'method':'internal + permutation' if internal is not None else 'permutation'})
imp=sorted(imp,key=lambda x:float(x['permutation_importance_mean']),reverse=True)
for i,row in enumerate(imp,1): row['rank']=i; row['direction_approx']='higher value increases/decreases depends on model; not inferred from importance'
save_csv('11_importancia_variables.csv',imp)

with open(OUT/'12_hiperparametros.json','w',encoding='utf-8') as f: json.dump({n:d.get('best_params',{}) for n,d in results.items()},f,indent=2,default=str)
with open(OUT/'ml_summary.json','w',encoding='utf-8') as f: json.dump({'best_model':best,'elapsed_seconds':elapsed,'metrics':metrics,'tests':tests},f,indent=2,default=str)

# required ML plots @300 dpi
names=[m['model'] for m in metrics]; values=[m['test_RMSE'] for m in metrics]; errs=[m['cv_rmse_std_kgCO2e'] for m in metrics]
fig,ax=plt.subplots(figsize=(8,5)); ax.bar(names,values,yerr=errs,capsize=4,color='#1565c0'); ax.set_ylabel('RMSE (kg CO2e)'); ax.set_title('RMSE de modelos (test; barras de error = DE CV)'); plt.xticks(rotation=20); fig.tight_layout(); fig.savefig(FIG/'04_rmse_modelos.png',dpi=300); plt.close(fig)
fig,ax=plt.subplots(figsize=(6,5)); ax.scatter(y_test,y_pred,alpha=.5); lo=min(y_test.min(),y_pred.min()); hi=max(y_test.max(),y_pred.max()); ax.plot([lo,hi],[lo,hi],'r--'); ax.set_xlabel('Real (kg CO2e)'); ax.set_ylabel('Predicho (kg CO2e)'); ax.set_title(f'Real frente a predicho — {best}'); fig.tight_layout(); fig.savefig(FIG/'05_real_vs_predicho.png',dpi=300); plt.close(fig)
fig,ax=plt.subplots(figsize=(7,5)); ax.hist(y_pred-y_test,bins=35,color='#2e7d32'); ax.set_xlabel('Residual (predicho - real, kg CO2e)'); ax.set_title(f'Distribución de residuos — {best}'); fig.tight_layout(); fig.savefig(FIG/'06_residuos_modelo_ganador.png',dpi=300); plt.close(fig)
print(json.dumps({'best_model':best,'elapsed_seconds':elapsed,'metrics':metrics},ensure_ascii=False))
