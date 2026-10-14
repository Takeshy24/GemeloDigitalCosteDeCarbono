"""
nadeau_bengio_all_pairs.py
==========================
Calcula la corrección de Nadeau-Bengio para los 4 pares de comparaciones
XGBoost vs {RandomForest, SVR, Stacking, Blending}.
"""
from __future__ import annotations
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Cargar métricas por fold
folds_path = ROOT / "resultados_experimento" / "09_metricas_por_fold.csv"
df = pd.read_csv(folds_path)

print("Columnas:", df.columns.tolist())
print(df.head())

# Pivot: filas = fold, columnas = modelo
pivot = df.pivot(index="fold", columns="model", values="rmse_kgCO2e")
print("\nPivot:")
print(pivot)

# Nadeau-Bengio: corrección por particiones solapadas
# Fórmula: t = mean(diff) / sqrt( (1/k + n_test/n_train) * var(diff) )
# donde k = número de folds, n_test/n_train = ratio de tamaños

k = pivot.shape[0]  # número de folds
n_test = 500
n_train = 2000
ratio = n_test / n_train

print(f"\nNadeau-Bengio (k={k}, n_test/n_train={ratio:.4f})")
print("=" * 60)

rivals = ["RandomForest", "SVR", "Stacking", "Blending"]

for rival in rivals:
    diff = pivot[rival] - pivot["XGBoost"]
    mean_diff = diff.mean()
    var_diff = diff.var(ddof=1)
    
    # Corrección de Nadeau-Bengio
    t_stat = mean_diff / np.sqrt((1/k + ratio) * var_diff)
    df_nb = k - 1
    p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df=df_nb))
    
    print(f"\nXGBoost vs {rival}:")
    print(f"  Diferencia media: {mean_diff:.4f} kg CO₂e")
    print(f"  Varianza: {var_diff:.4f}")
    print(f"  t = {t_stat:.4f}")
    print(f"  p = {p_value:.4f}")
    print(f"  Significativo (α=0.05): {'Sí' if p_value < 0.05 else 'No'}")