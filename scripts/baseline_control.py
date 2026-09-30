"""
baseline_control.py
===================
Script para generar los dos baselines de control del artículo CarbonTwin:

1. Ridge Regression (baseline lineal ingenuo)
2. Ecuación (3) (control trivial = generador exacto del objetivo)

Usa la fórmula REAL del generador (data_generation.py).
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# ---------------------------------------------------------------------------
# Cargar datos
# ---------------------------------------------------------------------------
DATA_PATH = "resultados_experimento/dataset_sintetico_semilla42.csv"
df = pd.read_csv(DATA_PATH)

TARGET = "total_co2e_kg"
RANDOM_SEED = 42

print(f"Dataset cargado: {df.shape[0]} filas, {df.shape[1]} columnas\n")

# ---------------------------------------------------------------------------
# Baseline 1: Ridge Regression (lineal)
# ---------------------------------------------------------------------------
X = df.drop(columns=[TARGET])
y = df[TARGET].values

num_features = [c for c in X.columns if X[c].dtype in ["int64", "float64", "int32", "float32"]]
cat_features = [c for c in X.columns if X[c].dtype == "object"]

transformers = [("num", StandardScaler(), num_features)]
if cat_features:
    transformers.append(("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features))
preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

ridge_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("ridge", Ridge(alpha=1.0, random_state=RANDOM_SEED)),
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=RANDOM_SEED
)

ridge_pipeline.fit(X_train, y_train)
y_pred_ridge = ridge_pipeline.predict(X_test)

rmse_ridge = float(np.sqrt(mean_squared_error(y_test, y_pred_ridge)))
mae_ridge = float(mean_absolute_error(y_test, y_pred_ridge))
r2_ridge = float(r2_score(y_test, y_pred_ridge))
mask = y_test != 0
mape_ridge = float(np.mean(np.abs((y_test[mask] - y_pred_ridge[mask]) / y_test[mask])) * 100)

# CV-RMSE para Ridge
kf = KFold(n_splits=10, shuffle=True, random_state=RANDOM_SEED)
cv_neg_rmse = cross_val_score(ridge_pipeline, X_train, y_train, cv=kf, scoring="neg_root_mean_squared_error", n_jobs=-1)
cv_rmse_ridge = (-cv_neg_rmse).tolist()

print("=" * 60)
print("  BASELINE 1: RIDGE REGRESSION (lineal)")
print("=" * 60)
print(f"  RMSE test: {rmse_ridge:.4f} kg CO2e")
print(f"  MAE test:  {mae_ridge:.4f} kg CO2e")
print(f"  R² test:   {r2_ridge:.6f}")
print(f"  MAPE test: {mape_ridge:.4f} %")
print(f"  CV-RMSE:   {np.mean(cv_rmse_ridge):.4f} ± {np.std(cv_rmse_ridge):.4f} kg CO2e")
print()

# ---------------------------------------------------------------------------
# Baseline 2: Ecuación (3) — control trivial (fórmula REAL)
# ---------------------------------------------------------------------------
rng = np.random.default_rng(RANDOM_SEED)

# Reconstruir el generador
sensor_count = df["sensor_count"].values
edge_count = df["edge_count"].values
cloud_region_intensity = df["cloud_region_intensity"].values
data_volume_gb_day = df["data_volume_gb_day"].values
transmission_freq_hz = df["transmission_freq_hz"].values
model_resolution = df["model_resolution"].values
operation_days = df["operation_days"].values
solar_powered = df["solar_powered"].values

CROP_EMISSION_FACTOR = {"wheat": 1.00, "corn": 1.15, "soy": 0.85, "rice": 1.40, "tomato": 1.20}
crop_factor = df["crop_type"].map(CROP_EMISSION_FACTOR).values

# Fórmula REAL del generador
edge_consumption_kwh = sensor_count * 0.05 * edge_count * operation_days
cloud_consumption_kwh = data_volume_gb_day * transmission_freq_hz * 0.8 * operation_days
model_consumption_kwh = model_resolution * 10 * operation_days

total_kwh = edge_consumption_kwh + cloud_consumption_kwh + model_consumption_kwh
total_co2e_kg = total_kwh * cloud_region_intensity * crop_factor * (1 - 0.35 * solar_powered)

# Ruido (±8 %)
noise = rng.normal(loc=1.0, scale=0.08, size=len(df))
y_ecuacion = (total_co2e_kg * noise).clip(min=0.01)

rmse_ec = float(np.sqrt(mean_squared_error(y, y_ecuacion)))
mae_ec = float(mean_absolute_error(y, y_ecuacion))
r2_ec = float(r2_score(y, y_ecuacion))
mask_ec = y != 0
mape_ec = float(np.mean(np.abs((y[mask_ec] - y_ecuacion[mask_ec]) / y[mask_ec])) * 100)

print("=" * 60)
print("  BASELINE 2: ECUACIÓN (3) — CONTROL TRIVIAL")
print("=" * 60)
print(f"  RMSE: {rmse_ec:.4f} kg CO2e")
print(f"  MAE:  {mae_ec:.4f} kg CO2e")
print(f"  R²:   {r2_ec:.6f}")
print(f"  MAPE: {mape_ec:.4f} %")
print()

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------
print("=" * 60)
print("  RESUMEN DE BASELINES")
print("=" * 60)
print(f"{'Modelo':<20} {'RMSE':>12} {'MAE':>12} {'R²':>10} {'MAPE':>10}")
print("-" * 60)
print(f"{'Ridge':<20} {rmse_ridge:>12.4f} {mae_ridge:>12.4f} {r2_ridge:>10.6f} {mape_ridge:>10.4f}")
print(f"{'Ecuación (3)':<20} {rmse_ec:>12.4f} {mae_ec:>12.4f} {r2_ec:>10.6f} {mape_ec:>10.4f}")
print("-" * 60)