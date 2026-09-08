"""
utils.py - Utilidades para el Laboratorio de Machine Learning con Streamlit
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Callable

import joblib
import numpy as np
import pandas as pd

# Asegurar que el backend sea importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ARTIFACTS_DIR = PROJECT_ROOT / "backend" / "ml_artifacts"
REPORT_PATH = ARTIFACTS_DIR / "ml_report.json"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.pkl"
SKLEARN_MODEL_PATH = ARTIFACTS_DIR / "best_model_sklearn.pkl"
H5_MODEL_PATH = ARTIFACTS_DIR / "best_model.h5"
STAT_REPORT_PATH = ARTIFACTS_DIR / "statistical_report.md"
MODEL_CARD_PATH = ARTIFACTS_DIR / "model_card.json"
PLOTS_DIR = ARTIFACTS_DIR / "plots"
EDA_DIR = ARTIFACTS_DIR / "eda"


def load_existing_report() -> dict[str, Any] | None:
    """Carga el último reporte generado por el pipeline de entrenamiento."""
    if REPORT_PATH.exists():
        try:
            with open(REPORT_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None


def load_dataset_for_eda(n_samples: int = 2500, seed: int = 42) -> pd.DataFrame:
    """Genera o carga el dataset para visualizaciones EDA en el laboratorio."""
    from backend.app.ml.data_generation import generate_dataset
    dataset_csv = ARTIFACTS_DIR / "dataset.csv"
    if dataset_csv.exists():
        try:
            return pd.read_csv(dataset_csv)
        except Exception:
            pass
    return generate_dataset(n_samples=n_samples, seed=seed)


def load_inference_pipeline():
    """Carga el preprocesador y el modelo sklearn para inferencia en tiempo real."""
    if not PREPROCESSOR_PATH.exists() or not SKLEARN_MODEL_PATH.exists():
        return None, None
    try:
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        model = joblib.load(SKLEARN_MODEL_PATH)
        return preprocessor, model
    except Exception as e:
        print(f"Error cargando artefactos de inferencia: {e}")
        return None, None


def predict_carbon(preprocessor, model, input_dict: dict[str, Any]) -> float:
    """Ejecuta la inferencia sobre un diccionario de características."""
    df_single = pd.DataFrame([input_dict])
    x_transformed = preprocessor.transform(df_single)
    pred = model.predict(x_transformed)
    return float(pred[0])


def read_artifact_bytes(path: Path) -> bytes | None:
    """Lee un archivo binario para el botón de descarga de Streamlit."""
    if path.exists():
        with open(path, "rb") as f:
            return f.read()
    return None


def execute_pipeline(
    n_samples: int,
    seed: int,
    n_iter_search: int,
    cv_folds: int,
    final_cv_folds: int,
    progress_callback: Callable[[str, int], None] | None = None,
) -> dict[str, Any]:
    """Ejecuta el pipeline completo de ML con parámetros personalizados."""
    from backend.app.ml.pipeline import run_pipeline

    return run_pipeline(
        n_samples=n_samples,
        seed=seed,
        n_iter_search=n_iter_search,
        cv_folds=cv_folds,
        final_cv_folds=final_cv_folds,
        progress_callback=progress_callback,
    )
