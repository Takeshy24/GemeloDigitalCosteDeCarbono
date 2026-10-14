"""
measure_latency_stacking.py
===========================
Entrena Stacking y mide su latencia de inferencia para RQ4.
"""
from __future__ import annotations
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import StackingRegressor, RandomForestRegressor
from sklearn.svm import SVR
from xgboost import XGBRegressor
from sklearn.linear_model import Ridge

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

DATA_PATH = ROOT / "resultados_experimento" / "dataset_sintetico_semilla42.csv"
OUT_DIR = ROOT / "resultados_experimento"
TARGET = "total_co2e_kg"
RANDOM_SEED = 42

# Cargar datos
df = pd.read_csv(DATA_PATH)
X = df.drop(columns=[TARGET])
y = df[TARGET].values

cat_features = ["crop_type"]
num_features = [c for c in X.columns if c not in cat_features]

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), num_features),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
])

# Definir Stacking (mismos hiperparámetros que en el artículo)
estimators = [
    ("rf", RandomForestRegressor(n_estimators=300, max_depth=20, min_samples_split=5, random_state=RANDOM_SEED)),
    ("xgb", XGBRegressor(n_estimators=400, learning_rate=0.05, max_depth=6, subsample=0.8, random_state=RANDOM_SEED)),
    ("svr", SVR(C=500, epsilon=0.01, kernel="rbf", gamma="auto")),
]
stacking = StackingRegressor(estimators=estimators, final_estimator=Ridge(alpha=1.0), cv=5)

pipeline = Pipeline([("prep", preprocessor), ("stacking", stacking)])

# Entrenar
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_SEED)
print("Entrenando Stacking...")
pipeline.fit(X_train, y_train)
print("Stacking entrenado.")

# Medir latencia
n_samples_latency = min(1000, len(X_test))
X_sample = X_test.sample(n=n_samples_latency, random_state=RANDOM_SEED).reset_index(drop=True)
print(f"  -> {n_samples_latency} muestras para medición de latencia")
X_transformed = preprocessor.transform(X_sample)
latencies = []
for i in range(len(X_transformed)):
    x_i = X_transformed[i:i+1]
    start = time.perf_counter()
    _ = stacking.predict(x_i)
    end = time.perf_counter()
    latencies.append((end - start) * 1000)

latencies = np.array(latencies)
print(f"\nStacking:")
print(f"  Mediana:   {np.median(latencies):.4f} ms")
print(f"  Media:     {np.mean(latencies):.4f} ms")
print(f"  P95:       {np.percentile(latencies, 95):.4f} ms")
print(f"  P99:       {np.percentile(latencies, 99):.4f} ms")
print(f"  Mínimo:    {np.min(latencies):.4f} ms")
print(f"  Máximo:    {np.max(latencies):.4f} ms")
print(f"  Desv. típ: {np.std(latencies):.4f} ms")

# Guardar resultados
results_df = pd.DataFrame([{
    "modelo": "Stacking",
    "n_muestras": n_samples_latency,
    "latencia_mediana_ms": round(float(np.median(latencies)), 4),
    "latencia_media_ms": round(float(np.mean(latencies)), 4),
    "latencia_p95_ms": round(float(np.percentile(latencies, 95)), 4),
    "latencia_p99_ms": round(float(np.percentile(latencies, 99)), 4),
    "latencia_min_ms": round(float(np.min(latencies)), 4),
    "latencia_max_ms": round(float(np.max(latencies)), 4),
    "latencia_std_ms": round(float(np.std(latencies)), 4),
}])
output_path = OUT_DIR / "16b_latencia_stacking.csv"
results_df.to_csv(output_path, index=False)
print(f"\n[OK] Resultados guardados en: {output_path}")