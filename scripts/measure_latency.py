"""
measure_latency.py
==================
Mide la latencia de inferencia de los modelos entrenados (XGBoost)
para responder a la RQ4 del artículo CarbonTwin.

Usa las mismas 500 muestras de X_test que measure_latency_stacking.py
para garantizar comparabilidad.

Salida:
  - resultados_experimento/16_latencia_inferencia.csv
"""

from __future__ import annotations
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Configuración de rutas
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

DATA_PATH = ROOT / "resultados_experimento" / "dataset_sintetico_semilla42.csv"
ARTIFACTS_DIR = ROOT / "backend" / "ml_artifacts"
OUT_DIR = ROOT / "resultados_experimento"
OUT_DIR.mkdir(exist_ok=True)

TARGET = "total_co2e_kg"
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Cargar datos
# ---------------------------------------------------------------------------
print(f"Cargando dataset: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"  -> {len(df)} registros cargados")

X = df.drop(columns=[TARGET])
y = df[TARGET].values

# Mismo split que en measure_latency_stacking.py
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_SEED)

# Usar las mismas 500 muestras de X_test
n_samples_latency = min(1000, len(X_test))
X_sample = X_test.sample(n=n_samples_latency, random_state=RANDOM_SEED).reset_index(drop=True)
print(f"  -> {n_samples_latency} muestras de X_test para medición de latencia")

# ---------------------------------------------------------------------------
# Cargar modelos
# ---------------------------------------------------------------------------
print("\nCargando modelos...")

models = {}

# XGBoost (modelo persistido)
try:
    xgb_model = joblib.load(ARTIFACTS_DIR / "best_model_sklearn.pkl")
    preprocessor = joblib.load(ARTIFACTS_DIR / "preprocessor.pkl")
    models["XGBoost"] = ("sklearn", xgb_model, preprocessor)
    print("  -> XGBoost cargado (best_model_sklearn.pkl)")
except Exception as e:
    print(f"  -> ERROR cargando XGBoost: {e}")

# ---------------------------------------------------------------------------
# Medir latencia
# ---------------------------------------------------------------------------
def measure_latency(model, X_transformed, model_type="sklearn", n_samples=500):
    latencies = []
    for i in range(min(n_samples, len(X_transformed))):
        x_i = X_transformed[i:i+1]
        start = time.perf_counter()
        if model_type == "keras":
            _ = model.predict(x_i, verbose=0)
        else:
            _ = model.predict(x_i)
        end = time.perf_counter()
        latencies.append((end - start) * 1000)
    return np.array(latencies)


print("\n" + "=" * 70)
print("  MEDICIÓN DE LATENCIA DE INFERENCIA")
print("=" * 70)

results = []

for name, (model_type, model, prep) in models.items():
    print(f"\nMidiendo latencia de {name}...")
    
    try:
        X_transformed = prep.transform(X_sample)
    except Exception as e:
        print(f"  -> ERROR en preprocesamiento: {e}")
        continue
    
    try:
        latencies = measure_latency(model, X_transformed, model_type=model_type, n_samples=n_samples_latency)
    except Exception as e:
        print(f"  -> ERROR midiendo latencia: {e}")
        continue
    
    median = float(np.median(latencies))
    mean = float(np.mean(latencies))
    p95 = float(np.percentile(latencies, 95))
    p99 = float(np.percentile(latencies, 99))
    min_lat = float(np.min(latencies))
    max_lat = float(np.max(latencies))
    std = float(np.std(latencies))
    
    print(f"  Mediana:   {median:.4f} ms")
    print(f"  Media:     {mean:.4f} ms")
    print(f"  P95:       {p95:.4f} ms")
    print(f"  P99:       {p99:.4f} ms")
    print(f"  Mínimo:    {min_lat:.4f} ms")
    print(f"  Máximo:    {max_lat:.4f} ms")
    print(f"  Desv. típ: {std:.4f} ms")
    
    results.append({
        "modelo": name,
        "n_muestras": n_samples_latency,
        "latencia_mediana_ms": round(median, 4),
        "latencia_media_ms": round(mean, 4),
        "latencia_p95_ms": round(p95, 4),
        "latencia_p99_ms": round(p99, 4),
        "latencia_min_ms": round(min_lat, 4),
        "latencia_max_ms": round(max_lat, 4),
        "latencia_std_ms": round(std, 4),
    })

# ---------------------------------------------------------------------------
# Guardar resultados
# ---------------------------------------------------------------------------
if results:
    results_df = pd.DataFrame(results)
    output_path = OUT_DIR / "16_latencia_inferencia.csv"
    results_df.to_csv(output_path, index=False)
    print(f"\n[OK] Resultados guardados en: {output_path}")
    print("\nResumen:")
    print(results_df.to_string(index=False))
else:
    print("\n[!] No se pudo medir la latencia de ningún modelo.")

print("\n" + "=" * 70)
print("  FIN DE LA MEDICIÓN")
print("=" * 70)