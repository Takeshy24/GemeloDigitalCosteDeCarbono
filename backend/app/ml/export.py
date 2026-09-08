"""
export.py
=========
Exporta el mejor modelo en formato .h5 (Keras/TensorFlow).

Estrategia:
  - Si el mejor modelo ES un modelo Keras nativo → guarda directamente con .save()
  - Si el mejor modelo es sklearn (RF, XGB, SVR, Stacking, Blending):
      1. Entrena una red neuronal Keras "wrapper" que reproduzca las predicciones
         del modelo sklearn (knowledge distillation ligero)
      2. Guarda la red neuronal en formato .h5
      3. Guarda el modelo sklearn original con joblib como respaldo
  - Guarda el preprocesador con joblib
  - Genera model_card.json con metadatos del modelo exportado

Archivos de salida:
  - backend/ml_artifacts/best_model.h5
  - backend/ml_artifacts/best_model_sklearn.pkl  (respaldo)
  - backend/ml_artifacts/preprocessor.pkl
  - backend/ml_artifacts/model_card.json
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import tensorflow as tf
from tensorflow import keras

ARTIFACTS_DIR = Path("backend/ml_artifacts")
RANDOM_SEED = 42
tf.random.set_seed(RANDOM_SEED)


# ---------------------------------------------------------------------------
# Red neuronal wrapper (Knowledge Distillation del modelo sklearn)
# ---------------------------------------------------------------------------
def _build_keras_wrapper(input_dim: int) -> keras.Model:
    """
    Construye una red neuronal feedforward que aprenderá a replicar
    las predicciones del mejor modelo sklearn (regresión).
    """
    inputs = keras.Input(shape=(input_dim,), name="features")
    x = keras.layers.Dense(256, activation="relu", name="dense_1")(inputs)
    x = keras.layers.BatchNormalization(name="bn_1")(x)
    x = keras.layers.Dropout(0.2, name="dropout_1")(x)
    x = keras.layers.Dense(128, activation="relu", name="dense_2")(x)
    x = keras.layers.BatchNormalization(name="bn_2")(x)
    x = keras.layers.Dropout(0.15, name="dropout_2")(x)
    x = keras.layers.Dense(64, activation="relu", name="dense_3")(x)
    x = keras.layers.Dense(32, activation="relu", name="dense_4")(x)
    outputs = keras.layers.Dense(1, activation="linear", name="output")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="CarbonTwin_Regressor")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="mse",
        metrics=["mae"],
    )
    return model


def _distill_to_keras(
    sklearn_model,
    X_train: np.ndarray,
    X_test: np.ndarray,
    epochs: int = 60,
    batch_size: int = 128,
) -> keras.Model:
    """
    Entrena la red Keras para imitar las predicciones del modelo sklearn.
    Usa las predicciones del sklearn como "soft targets".
    """
    # Generar soft targets con el modelo sklearn
    y_soft_train = sklearn_model.predict(X_train).reshape(-1, 1)
    y_soft_test = sklearn_model.predict(X_test).reshape(-1, 1)

    input_dim = X_train.shape[1]
    keras_model = _build_keras_wrapper(input_dim)

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=10,
            restore_best_weights=True,
            verbose=0,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=0,
        ),
    ]

    keras_model.fit(
        X_train, y_soft_train,
        validation_data=(X_test, y_soft_test),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=0,
    )

    return keras_model


# ---------------------------------------------------------------------------
# Exportación principal
# ---------------------------------------------------------------------------
def export_best_model(
    best_name: str,
    best_model: Any,
    preprocessor: Any,
    results: dict,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> dict:
    """
    Exporta el mejor modelo al formato .h5 y genera el model_card.json.

    Returns:
        dict con rutas de los artefactos generados.
    """
    print("\n" + "="*60)
    print("  EXPORTACIÓN DEL MEJOR MODELO → .h5")
    print("="*60)
    print(f"\n  Modelo ganador: {best_name}")

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Guardar preprocesador
    # ------------------------------------------------------------------
    preprocessor_path = ARTIFACTS_DIR / "preprocessor.pkl"
    joblib.dump(preprocessor, preprocessor_path)
    print(f"  ✓ Preprocesador guardado: {preprocessor_path}")

    # ------------------------------------------------------------------
    # 2. Guardar modelo sklearn original como respaldo
    # ------------------------------------------------------------------
    sklearn_path = ARTIFACTS_DIR / "best_model_sklearn.pkl"
    joblib.dump(best_model, sklearn_path)
    print(f"  ✓ Modelo sklearn guardado: {sklearn_path}")

    # ------------------------------------------------------------------
    # 3. Distilación → Keras → .h5
    # ------------------------------------------------------------------
    print("\n  → Destilando predicciones del modelo sklearn en red Keras...")
    keras_model = _distill_to_keras(best_model, X_train, X_test, epochs=80)

    h5_path = ARTIFACTS_DIR / "best_model.h5"
    keras_model.save(str(h5_path), save_format="h5")
    print(f"  [OK] Modelo Keras guardado: {h5_path}")

    # ------------------------------------------------------------------
    # 4. Verificación de carga
    # ------------------------------------------------------------------
    correlation = 0.0
    rmse_distill = 0.0
    try:
        loaded = keras.models.load_model(str(h5_path))
        y_pred_keras = loaded.predict(X_test, verbose=0).flatten()
        y_pred_sklearn = best_model.predict(X_test)
        correlation = float(np.corrcoef(y_pred_keras, y_pred_sklearn)[0, 1])
        rmse_distill = float(np.sqrt(np.mean((y_pred_keras - y_pred_sklearn) ** 2)))
        print(f"\n  Validacion de destilacion:")
        print(f"    Correlacion Keras <-> sklearn: {correlation:.4f}")
        print(f"    RMSE destilacion:             {rmse_distill:.4f}")
    except Exception as e:
        print(f"\n  [WARN] Verificacion de carga omitida: {e}")

    # ------------------------------------------------------------------
    # 5. Model card
    # ------------------------------------------------------------------
    best_metrics = results[best_name]["test_metrics"]
    model_card = {
        "model_name": f"CarbonTwin_{best_name}",
        "base_algorithm": best_name,
        "task": "regression",
        "target": "total_co2e_kg",
        "framework": "TensorFlow/Keras (distilled from sklearn)",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "files": {
            "h5_model": str(h5_path),
            "sklearn_backup": str(sklearn_path),
            "preprocessor": str(preprocessor_path),
        },
        "performance": {
            **best_metrics,
            "cv_rmse_mean": results[best_name]["cv_rmse_mean"],
            "cv_rmse_std": results[best_name]["cv_rmse_std"],
        },
        "distillation": {
            "keras_sklearn_correlation": round(correlation, 6),
            "distillation_rmse": round(rmse_distill, 6),
        },
        "best_hyperparams": results[best_name].get("best_params", {}),
        "architecture": {
            "type": "Feedforward Neural Network",
            "layers": [
                {"name": "dense_1", "units": 256, "activation": "relu"},
                {"name": "bn_1", "type": "BatchNormalization"},
                {"name": "dropout_1", "rate": 0.20},
                {"name": "dense_2", "units": 128, "activation": "relu"},
                {"name": "bn_2", "type": "BatchNormalization"},
                {"name": "dropout_2", "rate": 0.15},
                {"name": "dense_3", "units": 64, "activation": "relu"},
                {"name": "dense_4", "units": 32, "activation": "relu"},
                {"name": "output", "units": 1, "activation": "linear"},
            ],
        },
        "usage": {
            "load": "keras.models.load_model('backend/ml_artifacts/best_model.h5')",
            "preprocess": "joblib.load('backend/ml_artifacts/preprocessor.pkl').transform(X)",
            "predict": "model.predict(X_preprocessed)",
        },
    }

    card_path = ARTIFACTS_DIR / "model_card.json"
    with open(card_path, "w", encoding="utf-8") as f:
        json.dump(model_card, f, indent=2, default=str)
    print(f"  ✓ Model card guardado: {card_path}")

    print("\n  ✓ Exportación completa.")
    return {
        "h5_path": str(h5_path),
        "sklearn_path": str(sklearn_path),
        "preprocessor_path": str(preprocessor_path),
        "model_card_path": str(card_path),
        "model_card": model_card,
    }
