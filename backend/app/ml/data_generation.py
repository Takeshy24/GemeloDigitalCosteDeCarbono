"""
data_generation.py
==================
Genera un dataset sintético realista del dominio de gemelos digitales agrícolas
para predecir la huella de carbono total (total_co2e_kg).

Features de entrada:
  - sensor_count            : número de sensores en la parcela [2–50]
  - edge_count              : número de dispositivos edge [1–10]
  - cloud_region_intensity  : intensidad de carbono de la región cloud [0.05–0.9 kgCO2e/kWh]
  - data_volume_gb_day      : volumen de datos transmitidos al día [0.1–100 GB]
  - transmission_freq_hz    : frecuencia de envío de datos [0.001–10 Hz]
  - model_resolution        : resolución del modelo 3D [0.1–1.0]
  - crop_type               : tipo de cultivo (categórico: wheat, corn, soy, rice, tomato)
  - operation_days          : días de operación al año [30–365]
  - solar_powered           : ¿usa energía solar? (booleano → 0/1)

Target:
  - total_co2e_kg           : huella de carbono total estimada (regresión)
"""

import numpy as np
import pandas as pd
from pathlib import Path

RANDOM_SEED = 42
N_SAMPLES = 2_500

CROP_TYPES = ["wheat", "corn", "soy", "rice", "tomato"]

# Factor de emisión por tipo de cultivo (proxy de intensidad de gestión)
CROP_EMISSION_FACTOR = {
    "wheat": 1.00,
    "corn": 1.15,
    "soy": 0.85,
    "rice": 1.40,   # arroz → alta emisión CH4
    "tomato": 1.20,
}


def generate_dataset(n_samples: int = N_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Genera un DataFrame con features y target para el pipeline de ML."""
    rng = np.random.default_rng(seed)

    sensor_count = rng.integers(2, 51, size=n_samples)
    edge_count = rng.integers(1, 11, size=n_samples)
    cloud_region_intensity = rng.uniform(0.05, 0.90, size=n_samples)
    data_volume_gb_day = rng.exponential(scale=15, size=n_samples).clip(0.1, 100)
    transmission_freq_hz = rng.uniform(0.001, 10.0, size=n_samples)
    model_resolution = rng.uniform(0.1, 1.0, size=n_samples)
    crop_type = rng.choice(CROP_TYPES, size=n_samples)
    operation_days = rng.integers(30, 366, size=n_samples)
    solar_powered = rng.integers(0, 2, size=n_samples)  # 0 o 1

    # -----------------------------------------------------------------------
    # Modelo físico simplificado (base causal para el target):
    #   CO2e ≈ sensores × consumo_edge
    #         + volumen × intensidad_cloud × frecuencia
    #         + resolución_modelo × días
    #         + factor_cultivo
    #   Con reducción solar del 35 %
    # -----------------------------------------------------------------------
    crop_factor = np.array([CROP_EMISSION_FACTOR[c] for c in crop_type])

    edge_consumption_kwh = sensor_count * 0.05 * edge_count * operation_days   # kWh
    cloud_consumption_kwh = data_volume_gb_day * transmission_freq_hz * 0.8 * operation_days
    model_consumption_kwh = model_resolution * 10 * operation_days

    total_kwh = edge_consumption_kwh + cloud_consumption_kwh + model_consumption_kwh
    total_co2e_kg = (
        total_kwh * cloud_region_intensity * crop_factor * (1 - 0.35 * solar_powered)
    )

    # Ruido gaussiano (±8 %)
    noise = rng.normal(loc=1.0, scale=0.08, size=n_samples)
    total_co2e_kg = (total_co2e_kg * noise).clip(min=0.01)

    df = pd.DataFrame({
        "sensor_count": sensor_count,
        "edge_count": edge_count,
        "cloud_region_intensity": cloud_region_intensity,
        "data_volume_gb_day": data_volume_gb_day.astype(float),
        "transmission_freq_hz": transmission_freq_hz,
        "model_resolution": model_resolution,
        "crop_type": crop_type,
        "operation_days": operation_days,
        "solar_powered": solar_powered,
        "total_co2e_kg": total_co2e_kg,
    })

    return df


def load_or_generate(
    csv_path: str | Path | None = None,
    n_samples: int = N_SAMPLES,
    seed: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Si se proporciona `csv_path` y el archivo existe, lo carga.
    En caso contrario, genera el dataset sintético con los parámetros indicados.
    """
    if csv_path is not None:
        p = Path(csv_path)
        if p.exists():
            return pd.read_csv(p)

    return generate_dataset(n_samples=n_samples, seed=seed)


if __name__ == "__main__":
    df = generate_dataset()
    out = Path("backend/ml_artifacts/dataset.csv")
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Dataset generado: {len(df)} registros → {out}")
    print(df.describe())
