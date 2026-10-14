"""
sesgo_geografico.py
===================
Analiza el rendimiento del modelo XGBoost por rango de intensidad de red
(proxy de región geográfica) para cuantificar el sesgo geográfico.
"""
from __future__ import annotations
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

DATA_PATH = ROOT / "resultados_experimento" / "dataset_sintetico_semilla42.csv"
ARTIFACTS_DIR = ROOT / "backend" / "ml_artifacts"
OUT_DIR = ROOT / "resultados_experimento"
TARGET = "total_co2e_kg"
RANDOM_SEED = 42

# Cargar datos
df = pd.read_csv(DATA_PATH)
X = df.drop(columns=[TARGET])
y = df[TARGET].values

# Cargar modelo y preprocesador
model = joblib.load(ARTIFACTS_DIR / "best_model_sklearn.pkl")
preprocessor = joblib.load(ARTIFACTS_DIR / "preprocessor.pkl")

# Split idéntico al del pipeline
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_SEED)

# Transformar
X_test_transformed = preprocessor.transform(X_test)
y_pred = model.predict(X_test_transformed)

# Crear DataFrame con predicciones
results = X_test.copy()
results["y_true"] = y_test
results["y_pred"] = y_pred
results["residual"] = y_pred - y_test
results["abs_error"] = np.abs(results["residual"])

# Agrupar por cuartiles de intensidad de red
results["region_bin"] = pd.qcut(
    results["cloud_region_intensity"],
    q=4,
    labels=["Q1 (baja intensidad)", "Q2", "Q3", "Q4 (alta intensidad)"],
)

# Calcular RMSE por cuartil
print("=" * 70)
print("  SESGO GEOGRÁFICO POR CUARTIL DE INTENSIDAD DE RED")
print("=" * 70)
grouped = results.groupby("region_bin").apply(
    lambda g: pd.Series({
        "n": len(g),
        "rmse": np.sqrt(mean_squared_error(g["y_true"], g["y_pred"])),
        "mae": g["abs_error"].mean(),
        "media_target": g["y_true"].mean(),
    })
).reset_index()
print(grouped.to_string(index=False))

# Guardar
grouped.to_csv(OUT_DIR / "17_sesgo_geografico.csv", index=False)
print(f"\n[OK] Guardado en: {OUT_DIR / '17_sesgo_geografico.csv'}")