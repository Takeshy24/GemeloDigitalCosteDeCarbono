"""
pipeline.py
===========
Orquestador principal del pipeline de Machine Learning.

Orden de ejecución:
  1. Generación / carga de datos
  2. EDA completo
  3. Entrenamiento de los 5 modelos con tuning de hiperparámetros
  4. Pruebas estadísticas de solidez
  5. Exportación del mejor modelo → best_model.h5
  6. Generación del informe final ml_report.json

Uso:
  python -m backend.app.ml.pipeline
  python -m backend.app.ml.pipeline --csv /ruta/al/datos.csv
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

# Forzar UTF-8 en stdout/stderr en Windows para evitar UnicodeEncodeError
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Estado global del pipeline (para el endpoint /api/ml/status)
PIPELINE_STATUS: dict = {
    "status": "idle",       # idle | running | done | error
    "step": "",
    "progress": 0,          # 0–100
    "started_at": None,
    "finished_at": None,
    "error": None,
    "report": None,
}

from ..artifacts import ARTIFACTS_DIR
REAL_DATASET_PATH = ARTIFACTS_DIR / "real_dataset.csv"
REAL_DATASET_METADATA_PATH = ARTIFACTS_DIR / "real_dataset_metadata.json"


def _update_status(status: str, step: str, progress: int, error: str | None = None) -> None:
    PIPELINE_STATUS.update({
        "status": status,
        "step": step,
        "progress": progress,
        "error": error,
    })


def run_pipeline(
    csv_path: str | None = None,
    n_samples: int = 2500,
    seed: int = 42,
    n_iter_search: int = 20,
    cv_folds: int = 5,
    final_cv_folds: int = 10,
    progress_callback: Any = None,
) -> dict:
    """
    Ejecuta el pipeline completo de ML con parámetros configurables.
    """
    # Importaciones diferidas para acelerar el arranque de la API
    from .data_generation import load_or_generate
    from .eda import run_eda
    from .training import train_all_models
    from .statistical_tests import run_statistical_tests
    from .export import export_best_model

    def notify(step_name: str, pct: int):
        _update_status("running", step_name, pct)
        if progress_callback:
            progress_callback(step_name, pct)

    global PIPELINE_STATUS
    PIPELINE_STATUS["started_at"] = datetime.now(timezone.utc).isoformat()
    PIPELINE_STATUS["finished_at"] = None
    PIPELINE_STATUS["error"] = None
    PIPELINE_STATUS["report"] = None
    t0 = time.time()

    try:
        # ------------------------------------------------------------------
        # PASO 1 — Datos
        # ------------------------------------------------------------------
        notify("Cargando / generando datos", 5)
        print("\n" + "="*60)
        print("  ML PIPELINE -- Carbon Twin AP-9")
        print("="*60)

        df = load_or_generate(csv_path=csv_path, n_samples=n_samples, seed=seed)
        print(f"\n  Dataset: {len(df):,} registros × {df.shape[1]} columnas")

        # ------------------------------------------------------------------
        # PASO 2 — EDA
        # ------------------------------------------------------------------
        notify("Análisis Exploratorio de Datos (EDA)", 12)
        eda_summary = run_eda(df)

        # ------------------------------------------------------------------
        # PASO 3 — Entrenamiento
        # ------------------------------------------------------------------
        notify("Entrenamiento y validación cruzada", 25)
        train_output = train_all_models(
            df=df,
            n_iter_search=n_iter_search,
            cv_folds=cv_folds,
            final_cv_folds=final_cv_folds,
            random_seed=seed,
            progress_callback=notify,
        )

        results = train_output["results"]
        best_name = train_output["best_name"]
        best_model = train_output["best_model"]
        preprocessor = train_output["preprocessor"]
        X_train = train_output["X_train"]
        X_test = train_output["X_test"]
        y_test = train_output["y_test"]

        # ------------------------------------------------------------------
        # PASO 4 — Pruebas estadísticas
        # ------------------------------------------------------------------
        notify("Pruebas estadísticas de solidez", 72)
        stat_tests = run_statistical_tests(results, best_name, y_test)

        # ------------------------------------------------------------------
        # PASO 5 — Exportación
        # ------------------------------------------------------------------
        notify("Exportando mejor modelo → .h5", 86)
        export_info = export_best_model(
            best_name=best_name,
            best_model=best_model,
            preprocessor=preprocessor,
            results=results,
            X_train=X_train,
            X_test=X_test,
            y_test=y_test,
        )

        # ------------------------------------------------------------------
        # PASO 6 — Reporte final
        # ------------------------------------------------------------------
        _update_status("running", "Generando reporte final", 95)

        elapsed = round(time.time() - t0, 1)

        def _make_serializable(obj):
            if isinstance(obj, dict):
                return {k: _make_serializable(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_make_serializable(v) for v in obj]
            try:
                import numpy as np
                if isinstance(obj, (np.integer, np.floating)):
                    return float(obj)
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                if isinstance(obj, np.bool_):
                    return bool(obj)
            except ImportError:
                pass
            return obj

        resolved_source = str(Path(csv_path)) if csv_path else (
            str(REAL_DATASET_PATH) if REAL_DATASET_PATH.exists() else "synthetic"
        )
        dataset_metadata = {}
        if REAL_DATASET_METADATA_PATH.exists() and Path(resolved_source).name == REAL_DATASET_PATH.name:
            with open(REAL_DATASET_METADATA_PATH, "r", encoding="utf-8") as f:
                dataset_metadata = json.load(f)

        report = {
            "pipeline_version": "1.0.0",
            "methodology": "CRISP-DM",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "elapsed_seconds": elapsed,
            "dataset": {
                "n_samples": int(len(df)),
                "n_features": int(df.shape[1] - 1),
                "source": resolved_source,
                "is_real_dataset": Path(resolved_source).name == REAL_DATASET_PATH.name,
                "metadata": dataset_metadata,
            },
            "eda_summary": _make_serializable(eda_summary),
            "models": {
                name: {k: v for k, v in data.items() if k != "y_pred"}
                for name, data in results.items()
            },
            "best_model": {
                "name": best_name,
                "metrics": results[best_name]["test_metrics"],
                "cv_rmse_mean": results[best_name]["cv_rmse_mean"],
                "cv_rmse_std": results[best_name]["cv_rmse_std"],
                "hyperparams": results[best_name].get("best_params", {}),
                "explainability": results[best_name].get("permutation_importance", []),
            },
            "statistical_tests": _make_serializable(stat_tests),
            "export": export_info,
            "artifacts": {
                "eda_dir": "backend/ml_artifacts/eda/",
                "plots_dir": "backend/ml_artifacts/plots/",
                "h5_model": "backend/ml_artifacts/best_model.h5",
                "sklearn_backup": "backend/ml_artifacts/best_model_sklearn.pkl",
                "preprocessor": "backend/ml_artifacts/preprocessor.pkl",
                "model_card": "backend/ml_artifacts/model_card.json",
                "statistical_report": "backend/ml_artifacts/statistical_report.md",
                "permutation_importance": "backend/ml_artifacts/permutation_importance.csv",
                "crisp_dm_report": "backend/ml_artifacts/crisp_dm_report.md",
            },
        }

        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        with open(ARTIFACTS_DIR / "ml_report.json", "w", encoding="utf-8") as f:
            json.dump(_make_serializable(report), f, indent=2, default=str)

        # Informe legible para entrega académica: mantiene trazabilidad entre
        # datos, modelos, validación, pruebas estadísticas y explicabilidad.
        model_lines = [
            "| Modelo | RMSE test | MAE test | R² test | CV-RMSE (media ± sd) |",
            "|---|---:|---:|---:|---:|",
        ]
        for name, data in results.items():
            metrics = data["test_metrics"]
            model_lines.append(
                f"| {name} | {metrics['RMSE']:.4f} | {metrics['MAE']:.4f} | "
                f"{metrics['R2']:.4f} | {data['cv_rmse_mean']:.4f} ± {data['cv_rmse_std']:.4f} |"
            )
        explain_lines = "\n".join(
            f"- **{item['feature']}**: {item['importance_mean']:.6f} ± {item['importance_std']:.6f}"
            for item in results[best_name].get("permutation_importance", [])[:10]
        )
        crisp_report = "\n".join([
            "# Reporte CRISP-DM — Análisis de coste de carbono de gemelos digitales",
            "",
            "## 1. Comprensión y exploración de los datos",
            f"- Fuente: `{resolved_source}`; dataset real: **{report['dataset']['is_real_dataset']}**.",
            f"- Registros: **{len(df):,}**; variables predictoras: **{df.shape[1] - 1}**; objetivo: `total_co2e_kg`.",
            "- Las tablas y figuras EDA muestran distribución, correlaciones, dispersión, categorías y outliers.",
            "",
            "## 2. Entrenamiento",
            "Se evaluaron Random Forest, XGBoost, SVR, Stacking y Blending con preprocesamiento reproducible y búsqueda de hiperparámetros.",
            "",
            "## 3. Selección del mejor modelo",
            f"El ganador se seleccionó por menor CV-RMSE: **{best_name}**.",
            "",
            "## 4. Validación cruzada",
            *model_lines,
            "",
            "## 5. Pruebas estadísticas rigurosas",
            "Se aplicaron Friedman, Wilcoxon post-hoc, t pareado corregido de Nadeau-Bengio, bootstrap del RMSE, Shapiro-Wilk y Breusch-Pagan.",
            "Los p-values e interpretaciones se encuentran en `statistical_report.md` y en la interfaz.",
            "",
            "## 6. Interpretabilidad y explicabilidad",
            f"La importancia por permutación del conjunto de prueba explica el ganador ({best_name}); una mayor disminución del score indica mayor influencia predictiva.",
            explain_lines or "No disponible.",
            "",
            "## Reproducibilidad y limitaciones",
            f"Semilla: `{seed}`. La selección por CV evita decidir solo con un split; las conclusiones estadísticas se interpretan con α = 0.05.",
        ])
        with open(ARTIFACTS_DIR / "crisp_dm_report.md", "w", encoding="utf-8") as f:
            f.write(crisp_report)

        _update_status("done", "Pipeline completado", 100)
        PIPELINE_STATUS["finished_at"] = datetime.now(timezone.utc).isoformat()
        PIPELINE_STATUS["report"] = report

        print(f"\n{'='*60}")
        print(f"  [OK] PIPELINE COMPLETADO en {elapsed}s")
        print(f"  [*] Mejor modelo: {best_name}")
        print(f"  -> RMSE test: {results[best_name]['test_metrics']['RMSE']}")
        print(f"  -> R2 test:   {results[best_name]['test_metrics']['R2']}")
        print(f"{'='*60}\n")

        return report

    except Exception as e:
        tb = traceback.format_exc()
        _update_status("error", "Error en el pipeline", PIPELINE_STATUS["progress"], str(e))
        PIPELINE_STATUS["finished_at"] = datetime.now(timezone.utc).isoformat()
        print(f"\n[Pipeline] ERROR: {e}\n{tb}", file=sys.stderr)
        raise


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline ML Carbon Twin AP-9")
    parser.add_argument("--csv", type=str, default=None,
                        help="Ruta a un CSV propio (opcional). Si no se indica, se usan datos sintéticos.")
    args = parser.parse_args()
    run_pipeline(csv_path=args.csv)
