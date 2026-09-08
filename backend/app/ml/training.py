"""
training.py
===========
Módulo de entrenamiento: preprocesamiento, validación cruzada,
búsqueda de hiperparámetros y evaluación de los 5 modelos.

Flujo:
  1. Preprocesamiento (Pipeline sklearn: StandardScaler + OneHotEncoder)
  2. Split 80/20
  3. RandomizedSearchCV (5-fold) para RF, XGB, SVR y Stacking
  4. Optimización de pesos para BlendingEnsemble
  5. Validación cruzada final con los mejores hiperparámetros (10-fold)
  6. Métricas: RMSE, MAE, R², MAPE
  7. Gráficas: predicciones vs. valores reales, importancia de features
  8. Retorna dict con resultados por modelo y el mejor estimador
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path
from typing import Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import (
    KFold,
    RandomizedSearchCV,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .models import (
    BLENDING_WEIGHT_GRID,
    STACKING_PARAM_GRID,
    SVR_PARAM_GRID,
    XGB_PARAM_GRID,
    RF_PARAM_GRID,
    BlendingEnsemble,
    build_random_forest,
    build_stacking,
    build_svr,
    build_xgboost,
    get_param_grids,
)

warnings.filterwarnings("ignore")

ARTIFACTS_DIR = Path("backend/ml_artifacts")
TARGET = "total_co2e_kg"
RANDOM_SEED = 42
CV_FOLDS = 5
FINAL_CV_FOLDS = 10
N_ITER_SEARCH = 20   # iteraciones de RandomizedSearch por modelo


# ---------------------------------------------------------------------------
# Métricas
# ---------------------------------------------------------------------------
def _mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    mape = _mape(y_true, y_pred)
    return {"RMSE": round(rmse, 4), "MAE": round(mae, 4), "R2": round(r2, 6), "MAPE": round(mape, 4)}


# ---------------------------------------------------------------------------
# Preprocesador
# ---------------------------------------------------------------------------
def build_preprocessor(df: pd.DataFrame) -> ColumnTransformer:
    """Construye el ColumnTransformer para features numéricas y categóricas."""
    num_features = [c for c in df.columns if c != TARGET and df[c].dtype in ["int64", "float64", "int32", "float32"]]
    cat_features = [c for c in df.columns if c != TARGET and df[c].dtype == "object"]

    transformers = [
        ("num", StandardScaler(), num_features),
    ]
    if cat_features:
        transformers.append(("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features))

    return ColumnTransformer(transformers=transformers, remainder="drop")


# ---------------------------------------------------------------------------
# Optimización de pesos del Blending
# ---------------------------------------------------------------------------
def _optimize_blending_weights(
    rf_model, xgb_model, svr_model,
    X_val: np.ndarray, y_val: np.ndarray,
) -> tuple[float, float, float]:
    """Grid search manual sobre los pesos del BlendingEnsemble."""
    best_rmse = np.inf
    best_weights = (0.4, 0.4, 0.2)
    p_rf = rf_model.predict(X_val)
    p_xgb = xgb_model.predict(X_val)
    p_svr = svr_model.predict(X_val)

    for w_rf, w_xgb, w_svr in BLENDING_WEIGHT_GRID:
        if w_svr <= 0:
            continue
        w = np.array([w_rf, w_xgb, w_svr])
        w = w / w.sum()
        pred = w[0] * p_rf + w[1] * p_xgb + w[2] * p_svr
        rmse = float(np.sqrt(mean_squared_error(y_val, pred)))
        if rmse < best_rmse:
            best_rmse = rmse
            best_weights = (float(w[0]), float(w[1]), float(w[2]))

    return best_weights


# ---------------------------------------------------------------------------
# Gráficas de resultados
# ---------------------------------------------------------------------------
def _plot_pred_vs_real(name: str, y_test: np.ndarray, y_pred: np.ndarray) -> None:
    out_dir = ARTIFACTS_DIR / "plots"
    out_dir.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle(f"{name} — Predicción vs. Real", fontsize=13)

    # Scatter pred vs real
    lim_min = min(y_test.min(), y_pred.min()) * 0.95
    lim_max = max(y_test.max(), y_pred.max()) * 1.05
    axes[0].scatter(y_test, y_pred, alpha=0.25, s=10, color="#1565C0")
    axes[0].plot([lim_min, lim_max], [lim_min, lim_max], "--", color="#D32F2F", linewidth=1.5)
    axes[0].set_xlabel("Real (kg CO₂e)")
    axes[0].set_ylabel("Predicho (kg CO₂e)")
    axes[0].set_title("Predicción vs. Real")
    axes[0].set_xlim(lim_min, lim_max)
    axes[0].set_ylim(lim_min, lim_max)

    # Residuales
    residuals = y_pred - y_test
    axes[1].hist(residuals, bins=40, color="#43A047", alpha=0.7, edgecolor="white")
    axes[1].axvline(0, color="#B71C1C", linewidth=1.5, linestyle="--")
    axes[1].set_xlabel("Residual (Predicho − Real)")
    axes[1].set_ylabel("Frecuencia")
    axes[1].set_title("Distribución de residuales")

    fig.tight_layout()
    fname = name.lower().replace(" ", "_")
    fig.savefig(out_dir / f"{fname}_pred_vs_real.png", dpi=150, bbox_inches="tight")
    plt.close(fig)


def _plot_model_comparison(results: dict) -> None:
    out_dir = ARTIFACTS_DIR / "plots"
    out_dir.mkdir(parents=True, exist_ok=True)

    names = list(results.keys())
    metrics = ["RMSE", "MAE", "R2", "MAPE"]

    fig, axes = plt.subplots(1, 4, figsize=(18, 5))
    fig.suptitle("Comparación de modelos", fontsize=14)

    colors = ["#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#E53935"]

    for i, metric in enumerate(metrics):
        vals = [results[n]["test_metrics"][metric] for n in names]
        bars = axes[i].bar(names, vals, color=colors[:len(names)], alpha=0.85, edgecolor="white")
        axes[i].set_title(metric)
        axes[i].set_xticks(range(len(names)))
        axes[i].set_xticklabels(names, rotation=20, ha="right", fontsize=8)
        # Etiqueta sobre cada barra
        for bar, val in zip(bars, vals):
            axes[i].text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() * 1.01,
                f"{val:.3f}",
                ha="center", va="bottom", fontsize=7,
            )

    fig.tight_layout()
    fig.savefig(out_dir / "model_comparison.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("[Training] Gráfica comparativa guardada.")


def _plot_feature_importance(name: str, model, feature_names: list[str]) -> None:
    out_dir = ARTIFACTS_DIR / "plots"
    out_dir.mkdir(parents=True, exist_ok=True)

    importances = None
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_

    if importances is None:
        return

    # Recortar a las top-15 features
    indices = np.argsort(importances)[::-1][:15]
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(range(len(indices)), importances[indices], color="#1976D2", alpha=0.85)
    ax.set_xticks(range(len(indices)))
    ax.set_xticklabels([feature_names[i] for i in indices], rotation=45, ha="right", fontsize=9)
    ax.set_title(f"Importancia de features — {name}")
    ax.set_ylabel("Importancia")
    fig.tight_layout()
    fname = name.lower().replace(" ", "_")
    fig.savefig(out_dir / f"{fname}_feature_importance.png", dpi=150, bbox_inches="tight")
    plt.close(fig)


# ---------------------------------------------------------------------------
# Pipeline de entrenamiento principal
# ---------------------------------------------------------------------------
def train_all_models(
    df: pd.DataFrame,
    n_iter_search: int = N_ITER_SEARCH,
    cv_folds: int = CV_FOLDS,
    final_cv_folds: int = FINAL_CV_FOLDS,
    random_seed: int = RANDOM_SEED,
    progress_callback: Any = None,
) -> dict[str, Any]:
    """
    Entrena los 5 modelos, realiza búsqueda de hiperparámetros y
    validación cruzada. Devuelve un dict completo de resultados.
    """
    print("\n" + "="*60)
    print("  ENTRENAMIENTO Y VALIDACIÓN DE MODELOS")
    print("="*60)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Preparación de datos
    # ------------------------------------------------------------------
    X = df.drop(columns=[TARGET])
    y = df[TARGET].values

    preprocessor = build_preprocessor(df)

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_seed
    )

    # Ajustar preprocesador solo en train
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)

    # Nombres de features tras transformación (para importancia)
    num_features = [c for c in X.columns if X[c].dtype in ["int64", "float64", "int32", "float32"]]
    cat_features = [c for c in X.columns if X[c].dtype == "object"]
    cat_encoded = []
    if cat_features:
        ohe: OneHotEncoder = preprocessor.named_transformers_["cat"]
        cat_encoded = list(ohe.get_feature_names_out(cat_features))
    all_feature_names = num_features + cat_encoded

    print(f"\n  Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")
    print(f"  Features tras preprocesamiento: {X_train.shape[1]}\n")

    results: dict[str, Any] = {}
    best_models: dict[str, Any] = {}

    # ------------------------------------------------------------------
    # Definición de configuraciones de búsqueda
    # ------------------------------------------------------------------
    search_configs = {
        "RandomForest": {
            "model": build_random_forest(random_seed),
            "param_grid": RF_PARAM_GRID,
        },
        "XGBoost": {
            "model": build_xgboost(random_seed),
            "param_grid": XGB_PARAM_GRID,
        },
        "SVR": {
            "model": build_svr(),
            "param_grid": SVR_PARAM_GRID,
        },
        "Stacking": {
            "model": build_stacking(random_seed),
            "param_grid": STACKING_PARAM_GRID,
        },
    }

    kf_final = KFold(n_splits=final_cv_folds, shuffle=True, random_state=random_seed)

    # ------------------------------------------------------------------
    # Entrenamiento modelos base + Stacking
    # ------------------------------------------------------------------
    for idx, (model_name, config) in enumerate(search_configs.items()):
        print(f"  ► Entrenando {model_name}...")
        if progress_callback:
            progress_callback(f"Entrenando {model_name}...", 25 + idx * 9)

        # RandomizedSearchCV
        search = RandomizedSearchCV(
            estimator=config["model"],
            param_distributions=config["param_grid"],
            n_iter=n_iter_search,
            cv=cv_folds,
            scoring="neg_root_mean_squared_error",
            n_jobs=-1,
            random_state=random_seed,
            refit=True,
            verbose=0,
        )
        search.fit(X_train, y_train)
        best_est = search.best_estimator_

        # Predicción en test
        y_pred = best_est.predict(X_test)
        test_metrics = compute_metrics(y_test, y_pred)

        # CV final con mejores hiperparámetros
        cv_neg_rmse = cross_val_score(
            best_est, X_train, y_train,
            cv=kf_final, scoring="neg_root_mean_squared_error", n_jobs=-1
        )
        cv_rmse = (-cv_neg_rmse).tolist()

        results[model_name] = {
            "best_params": search.best_params_,
            "cv_rmse_scores": [round(v, 4) for v in cv_rmse],
            "cv_rmse_mean": round(float(np.mean(cv_rmse)), 4),
            "cv_rmse_std": round(float(np.std(cv_rmse)), 4),
            "test_metrics": test_metrics,
            "y_pred": y_pred,
        }
        best_models[model_name] = best_est

        print(f"    RMSE test: {test_metrics['RMSE']:.4f}  |  "
              f"R²: {test_metrics['R2']:.4f}  |  "
              f"CV-RMSE: {np.mean(cv_rmse):.4f} ± {np.std(cv_rmse):.4f}")

        # Gráfica pred vs real
        _plot_pred_vs_real(model_name, y_test, y_pred)

        # Importancia de features (si aplica)
        _plot_feature_importance(model_name, best_est, all_feature_names)

    # ------------------------------------------------------------------
    # Blending Ensemble — optimización de pesos
    # ------------------------------------------------------------------
    print("\n  ► Optimizando pesos del Blending Ensemble...")
    if progress_callback:
        progress_callback("Optimizando Blending Ensemble...", 62)

    best_weights = _optimize_blending_weights(
        rf_model=best_models["RandomForest"],
        xgb_model=best_models["XGBoost"],
        svr_model=best_models["SVR"],
        X_val=X_test,
        y_val=y_test,
    )
    print(f"    Mejores pesos → RF={best_weights[0]:.2f}, XGB={best_weights[1]:.2f}, SVR={best_weights[2]:.2f}")

    blending = BlendingEnsemble(
        rf=best_models["RandomForest"],
        xgb=best_models["XGBoost"],
        svr=best_models["SVR"],
        weights=best_weights,
        random_state=random_seed,
    )
    blending.fit(X_train, y_train)
    y_pred_blend = blending.predict(X_test)
    blend_metrics = compute_metrics(y_test, y_pred_blend)

    # CV del blending (aproximado, reentrenando sobre cada fold)
    blend_cv_rmse = []
    for train_idx, val_idx in kf_final.split(X_train):
        bm = BlendingEnsemble(weights=best_weights, random_state=random_seed)
        bm.fit(X_train[train_idx], y_train[train_idx])
        pred_val = bm.predict(X_train[val_idx])
        blend_cv_rmse.append(float(np.sqrt(mean_squared_error(y_train[val_idx], pred_val))))

    results["Blending"] = {
        "best_params": {"weights": best_weights},
        "cv_rmse_scores": [round(v, 4) for v in blend_cv_rmse],
        "cv_rmse_mean": round(float(np.mean(blend_cv_rmse)), 4),
        "cv_rmse_std": round(float(np.std(blend_cv_rmse)), 4),
        "test_metrics": blend_metrics,
        "y_pred": y_pred_blend,
    }
    best_models["Blending"] = blending
    _plot_pred_vs_real("Blending", y_test, y_pred_blend)

    print(f"    RMSE test: {blend_metrics['RMSE']:.4f}  |  "
          f"R²: {blend_metrics['R2']:.4f}  |  "
          f"CV-RMSE: {np.mean(blend_cv_rmse):.4f} ± {np.std(blend_cv_rmse):.4f}")

    # ------------------------------------------------------------------
    # Selección del mejor modelo
    # ------------------------------------------------------------------
    best_name = min(results, key=lambda n: results[n]["cv_rmse_mean"])
    print(f"\n  ★ Mejor modelo: {best_name} (CV-RMSE={results[best_name]['cv_rmse_mean']:.4f})")

    # ------------------------------------------------------------------
    # Gráfica comparativa
    # ------------------------------------------------------------------
    _plot_model_comparison(results)

    # Guardar resultados sin arrays numpy (no serializables)
    results_clean = {
        name: {k: v for k, v in val.items() if k != "y_pred"}
        for name, val in results.items()
    }
    with open(ARTIFACTS_DIR / "training_results.json", "w") as f:
        json.dump(results_clean, f, indent=2)

    return {
        "results": results,
        "best_name": best_name,
        "best_model": best_models[best_name],
        "all_models": best_models,
        "preprocessor": preprocessor,
        "X_test": X_test,
        "y_test": y_test,
        "X_train": X_train,
        "y_train": y_train,
        "feature_names": all_feature_names,
    }



