"""
statistical_tests.py
=====================
Pruebas estadísticas de solidez sobre los 5 modelos del pipeline.

Pruebas implementadas:
  1. Friedman test (no paramétrico, k modelos × n folds)
     H0: Todos los modelos tienen el mismo rendimiento mediano
  2. Wilcoxon signed-rank (post-hoc, mejor modelo vs. cada rival)
     H0: No hay diferencia significativa entre el par de modelos
  3. Corrected paired t-test (Nadeau-Bengio) para comparación con CV
  4. Bootstrap confidence intervals (2000 reps) sobre RMSE del ganador
  5. Shapiro-Wilk sobre los residuales del mejor modelo
     H0: Los residuales siguen una distribución normal
  6. Breusch-Pagan (homocedasticidad de residuales)
     H0: Los residuales son homocedásticos

Genera:
  - backend/ml_artifacts/statistical_report.md
  - backend/ml_artifacts/plots/residuals_qq.png
  - backend/ml_artifacts/plots/bootstrap_ci.png
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import (
    friedmanchisquare,
    shapiro,
    wilcoxon,
)
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.regression.linear_model import OLS
from statsmodels.tools import add_constant

warnings.filterwarnings("ignore")

ARTIFACTS_DIR = Path("backend/ml_artifacts")
PLOTS_DIR = ARTIFACTS_DIR / "plots"
ALPHA = 0.05
N_BOOTSTRAP = 2_000
RANDOM_SEED = 42


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
def _sig_stars(p_value: float) -> str:
    if p_value < 0.001:
        return "***"
    if p_value < 0.01:
        return "**"
    if p_value < 0.05:
        return "*"
    return "ns"


def _rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


# ---------------------------------------------------------------------------
# 1. Friedman Test
# ---------------------------------------------------------------------------
def friedman_test(cv_rmse_by_model: dict[str, list[float]]) -> dict:
    """
    Aplica el test de Friedman sobre las matrices de CV-RMSE de todos los modelos.

    Args:
        cv_rmse_by_model: {model_name: [rmse_fold1, rmse_fold2, ...]}

    Returns:
        Dict con estadístico, p-value e interpretación.
    """
    names = list(cv_rmse_by_model.keys())
    arrays = [np.array(cv_rmse_by_model[n]) for n in names]

    # Asegurar misma longitud (truncar al mínimo)
    min_len = min(len(a) for a in arrays)
    arrays = [a[:min_len] for a in arrays]

    stat, p_value = friedmanchisquare(*arrays)

    result = {
        "test": "Friedman",
        "statistic": round(float(stat), 6),
        "p_value": round(float(p_value), 6),
        "significant": bool(p_value < ALPHA),
        "significance": _sig_stars(p_value),
        "interpretation": (
            f"p={p_value:.4f} ({_sig_stars(p_value)}). "
            + ("✓ Hay diferencias significativas entre los modelos." if p_value < ALPHA
               else "✗ No se detectaron diferencias significativas.")
        ),
        "models": names,
    }
    print(f"\n[Stats] Friedman: χ²={stat:.4f}, p={p_value:.4f} {_sig_stars(p_value)}")
    return result


# ---------------------------------------------------------------------------
# 2. Wilcoxon Signed-Rank (post-hoc pairwise)
# ---------------------------------------------------------------------------
def wilcoxon_tests(
    best_name: str,
    cv_rmse_by_model: dict[str, list[float]],
) -> list[dict]:
    """Wilcoxon entre el mejor modelo y cada rival."""
    names = list(cv_rmse_by_model.keys())
    results = []
    best_scores = np.array(cv_rmse_by_model[best_name])

    print(f"\n[Stats] Wilcoxon post-hoc ({best_name} vs. rivales):")
    for name in names:
        if name == best_name:
            continue
        rival_scores = np.array(cv_rmse_by_model[name])
        min_len = min(len(best_scores), len(rival_scores))
        d = rival_scores[:min_len] - best_scores[:min_len]

        if np.all(d == 0):
            stat, p_value = 0.0, 1.0
        else:
            try:
                stat, p_value = wilcoxon(d, alternative="greater")
            except Exception:
                stat, p_value = 0.0, 1.0

        r = {
            "test": "Wilcoxon signed-rank",
            "comparison": f"{best_name} vs {name}",
            "statistic": round(float(stat), 4),
            "p_value": round(float(p_value), 6),
            "significant": bool(p_value < ALPHA),
            "significance": _sig_stars(p_value),
            "interpretation": (
                f"{best_name} es significativamente mejor que {name}."
                if p_value < ALPHA
                else f"Sin diferencia significativa con {name}."
            ),
        }
        results.append(r)
        print(f"    {best_name} vs {name}: W={stat:.4f}, p={p_value:.4f} {_sig_stars(p_value)}")

    return results


# ---------------------------------------------------------------------------
# 3. Corrected Paired t-test (Nadeau-Bengio)
# ---------------------------------------------------------------------------
def corrected_paired_ttest(
    scores_a: list[float],
    scores_b: list[float],
    n_test: int,
    n_train: int,
) -> dict:
    """
    Test t pareado corregido para k-fold CV (Nadeau & Bengio, 2003).
    Corrige la varianza por la correlación inducida por el solapamiento en CV.
    """
    k = len(scores_a)
    diff = np.array(scores_b) - np.array(scores_a)
    mu = diff.mean()
    rho = n_test / (n_test + n_train)   # correlación de solapamiento
    var_corrected = (1.0 / k + rho / (1 - rho)) * diff.var(ddof=1)
    t_stat = mu / np.sqrt(var_corrected + 1e-12)
    p_value = float(2 * stats.t.sf(abs(t_stat), df=k - 1))

    return {
        "test": "Corrected paired t-test (Nadeau-Bengio)",
        "t_statistic": round(float(t_stat), 6),
        "p_value": round(p_value, 6),
        "significant": bool(p_value < ALPHA),
        "significance": _sig_stars(p_value),
        "n_folds": k,
        "rho_correction": round(float(rho), 4),
        "interpretation": (
            f"p={p_value:.4f} ({_sig_stars(p_value)}). "
            + ("Diferencia significativa tras corrección." if p_value < ALPHA
               else "Sin diferencia significativa tras corrección.")
        ),
    }


# ---------------------------------------------------------------------------
# 4. Bootstrap CI sobre RMSE del ganador
# ---------------------------------------------------------------------------
def bootstrap_rmse_ci(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    n_bootstrap: int = N_BOOTSTRAP,
    alpha: float = 0.05,
) -> dict:
    """Bootstrap percentile CI sobre el RMSE del mejor modelo."""
    rng = np.random.default_rng(RANDOM_SEED)
    n = len(y_true)
    boot_rmses = []

    for _ in range(n_bootstrap):
        idx = rng.integers(0, n, size=n)
        boot_rmses.append(_rmse(y_true[idx], y_pred[idx]))

    boot_rmses = np.array(boot_rmses)
    ci_lower = float(np.percentile(boot_rmses, 100 * alpha / 2))
    ci_upper = float(np.percentile(boot_rmses, 100 * (1 - alpha / 2)))
    point_rmse = _rmse(y_true, y_pred)

    # Plot
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.hist(boot_rmses, bins=50, color="#1565C0", alpha=0.7, edgecolor="white")
    ax.axvline(point_rmse, color="#B71C1C", linewidth=2, label=f"RMSE={point_rmse:.3f}")
    ax.axvline(ci_lower, color="#FFA000", linewidth=1.5, linestyle="--", label=f"CI lower={ci_lower:.3f}")
    ax.axvline(ci_upper, color="#FFA000", linewidth=1.5, linestyle="--", label=f"CI upper={ci_upper:.3f}")
    ax.set_xlabel("RMSE Bootstrap")
    ax.set_ylabel("Frecuencia")
    ax.set_title(f"Bootstrap CI {int((1-alpha)*100)}% sobre RMSE ({n_bootstrap} reps)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / "bootstrap_ci.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    result = {
        "test": "Bootstrap CI",
        "n_bootstrap": n_bootstrap,
        "point_rmse": round(point_rmse, 6),
        "ci_lower": round(ci_lower, 6),
        "ci_upper": round(ci_upper, 6),
        "confidence_level": f"{int((1-alpha)*100)}%",
        "interpretation": (
            f"RMSE del mejor modelo: {point_rmse:.4f} "
            f"(IC {int((1-alpha)*100)}%: [{ci_lower:.4f}, {ci_upper:.4f}])"
        ),
    }
    print(f"\n[Stats] Bootstrap CI {int((1-alpha)*100)}%: [{ci_lower:.4f}, {ci_upper:.4f}] "
          f"(RMSE puntual={point_rmse:.4f})")
    return result


# ---------------------------------------------------------------------------
# 5. Shapiro-Wilk sobre residuales
# ---------------------------------------------------------------------------
def shapiro_wilk_test(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Shapiro-Wilk sobre los residuales. Con n > 5000 usa la versión por muestreo
    (5000 obs) ya que la prueba tiene un límite práctico.
    """
    residuals = y_pred - y_true
    if len(residuals) > 5_000:
        rng = np.random.default_rng(RANDOM_SEED)
        residuals = rng.choice(residuals, size=5_000, replace=False)

    stat, p_value = shapiro(residuals)

    result = {
        "test": "Shapiro-Wilk (normalidad de residuales)",
        "statistic": round(float(stat), 6),
        "p_value": round(float(p_value), 6),
        "significant": bool(p_value < ALPHA),
        "significance": _sig_stars(p_value),
        "interpretation": (
            f"p={p_value:.4f} ({_sig_stars(p_value)}). "
            + ("Los residuales NO siguen una distribución normal." if p_value < ALPHA
               else "Los residuales siguen una distribución normal (no se rechaza H0).")
        ),
    }

    # Q-Q plot
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(6, 6))
    stats.probplot(residuals, dist="norm", plot=ax)
    ax.set_title("Q-Q plot de residuales vs. distribución Normal")
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / "residuals_qq.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    print(f"\n[Stats] Shapiro-Wilk: W={stat:.4f}, p={p_value:.4f} {_sig_stars(p_value)}")
    return result


# ---------------------------------------------------------------------------
# 6. Breusch-Pagan (homocedasticidad)
# ---------------------------------------------------------------------------
def breusch_pagan_test(y_pred: np.ndarray, residuals: np.ndarray) -> dict:
    """
    Breusch-Pagan sobre los residuales del mejor modelo.
    Regresión auxiliar: residuales² ~ y_pred.
    """
    exog = add_constant(y_pred.reshape(-1, 1))
    res_sq = residuals ** 2

    try:
        ols_res = OLS(res_sq, exog).fit()
        lm_stat, p_value, f_stat, f_p_value = het_breuschpagan(ols_res.resid, ols_res.model.exog)
    except Exception as e:
        print(f"[Stats] Breusch-Pagan error: {e}")
        return {"test": "Breusch-Pagan", "error": str(e)}

    result = {
        "test": "Breusch-Pagan (homocedasticidad)",
        "lm_statistic": round(float(lm_stat), 6),
        "p_value": round(float(p_value), 6),
        "f_statistic": round(float(f_stat), 6),
        "f_p_value": round(float(f_p_value), 6),
        "significant": bool(p_value < ALPHA),
        "significance": _sig_stars(p_value),
        "interpretation": (
            f"p={p_value:.4f} ({_sig_stars(p_value)}). "
            + ("Heterocedasticidad detectada (varianza no constante)." if p_value < ALPHA
               else "No se detecta heterocedasticidad (varianza aproximadamente constante).")
        ),
    }
    print(f"\n[Stats] Breusch-Pagan: LM={lm_stat:.4f}, p={p_value:.4f} {_sig_stars(p_value)}")
    return result


# ---------------------------------------------------------------------------
# 7. Generación del reporte Markdown
# ---------------------------------------------------------------------------
def _build_markdown_report(all_tests: dict, results: dict) -> str:
    lines = [
        "# Reporte de Pruebas Estadísticas — Pipeline ML Carbon Twin AP-9",
        "",
        "## Tabla resumen de modelos",
        "",
        "| Modelo | CV-RMSE (μ) | CV-RMSE (σ) | RMSE test | MAE test | R² test | MAPE test |",
        "|--------|-------------|-------------|-----------|----------|---------|-----------|",
    ]
    for name, data in results.items():
        m = data["test_metrics"]
        lines.append(
            f"| {name} | {data['cv_rmse_mean']} | {data['cv_rmse_std']} | "
            f"{m['RMSE']} | {m['MAE']} | {m['R2']} | {m['MAPE']} |"
        )

    lines += ["", "---", ""]

    section_titles = {
        "friedman": "1. Test de Friedman",
        "wilcoxon": "2. Test de Wilcoxon (post-hoc)",
        "nadeau_bengio": "3. t-test Corregido (Nadeau-Bengio)",
        "bootstrap_ci": "4. Bootstrap Confidence Interval",
        "shapiro_wilk": "5. Test de Shapiro-Wilk (normalidad)",
        "breusch_pagan": "6. Test de Breusch-Pagan (homocedasticidad)",
    }

    for key, title in section_titles.items():
        if key not in all_tests:
            continue
        lines.append(f"## {title}")
        lines.append("")
        test_data = all_tests[key]

        if isinstance(test_data, list):
            for item in test_data:
                lines.append(f"**{item.get('comparison', '')}**")
                lines.append(f"- Estadístico: `{item.get('statistic', item.get('t_statistic', ''))}`")
                lines.append(f"- p-value: `{item.get('p_value', '')}` {item.get('significance', '')}")
                lines.append(f"- Interpretación: {item.get('interpretation', '')}")
                lines.append("")
        else:
            if "statistic" in test_data:
                lines.append(f"- **Estadístico**: `{test_data.get('statistic', test_data.get('lm_statistic', ''))}`")
            lines.append(f"- **p-value**: `{test_data.get('p_value', '')}` {test_data.get('significance', '')}")
            lines.append(f"- **Interpretación**: {test_data.get('interpretation', '')}")
            if "ci_lower" in test_data:
                lines.append(f"- **IC {test_data.get('confidence_level', '')}**: "
                             f"[{test_data['ci_lower']}, {test_data['ci_upper']}]")
        lines.append("")
        lines.append("---")
        lines.append("")

    lines += [
        "## Convención de significancia",
        "",
        "| Símbolo | p-value |",
        "|---------|---------|",
        "| `***`   | < 0.001 |",
        "| `**`    | < 0.01  |",
        "| `*`     | < 0.05  |",
        "| `ns`    | ≥ 0.05  |",
        "",
        f"*Nivel de significancia α = {ALPHA}*",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Orquestador principal
# ---------------------------------------------------------------------------
def run_statistical_tests(
    results: dict,
    best_name: str,
    y_test: np.ndarray,
) -> dict:
    """
    Ejecuta todas las pruebas estadísticas y genera el reporte.

    Args:
        results  : dict devuelto por training.train_all_models
        best_name: nombre del mejor modelo
        y_test   : valores reales del conjunto de test
    """
    print("\n" + "="*60)
    print("  PRUEBAS ESTADÍSTICAS DE SOLIDEZ")
    print("="*60)

    cv_rmse_by_model = {
        name: data["cv_rmse_scores"]
        for name, data in results.items()
    }
    y_pred_best = results[best_name]["y_pred"]
    residuals_best = y_pred_best - y_test

    all_tests = {}

    # 1. Friedman
    all_tests["friedman"] = friedman_test(cv_rmse_by_model)

    # 2. Wilcoxon post-hoc
    all_tests["wilcoxon"] = wilcoxon_tests(best_name, cv_rmse_by_model)

    # 3. Nadeau-Bengio corrected t-test (mejor vs. segundo mejor)
    sorted_by_cv = sorted(results.keys(), key=lambda n: results[n]["cv_rmse_mean"])
    if len(sorted_by_cv) >= 2:
        second_name = sorted_by_cv[1] if sorted_by_cv[0] == best_name else sorted_by_cv[0]
        n_total = (
            len(results[best_name]["cv_rmse_scores"]) *
            (len(results[best_name]["cv_rmse_scores"]) - 1)  # proxy n_train
        )
        n_test = max(1, n_total // len(results[best_name]["cv_rmse_scores"]))
        n_train = n_total - n_test
        nb_result = corrected_paired_ttest(
            scores_a=results[best_name]["cv_rmse_scores"],
            scores_b=results[second_name]["cv_rmse_scores"],
            n_test=n_test,
            n_train=n_train,
        )
        nb_result["comparison"] = f"{best_name} vs {second_name}"
        all_tests["nadeau_bengio"] = nb_result
        print(f"\n[Stats] Nadeau-Bengio ({best_name} vs {second_name}): "
              f"t={nb_result['t_statistic']:.4f}, p={nb_result['p_value']:.4f} "
              f"{nb_result['significance']}")

    # 4. Bootstrap CI
    all_tests["bootstrap_ci"] = bootstrap_rmse_ci(y_test, y_pred_best)

    # 5. Shapiro-Wilk
    all_tests["shapiro_wilk"] = shapiro_wilk_test(y_test, y_pred_best)

    # 6. Breusch-Pagan
    all_tests["breusch_pagan"] = breusch_pagan_test(y_pred_best, residuals_best)

    # Reporte Markdown
    results_no_pred = {k: {kk: vv for kk, vv in v.items() if kk != "y_pred"} for k, v in results.items()}
    report_md = _build_markdown_report(all_tests, results_no_pred)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(ARTIFACTS_DIR / "statistical_report.md", "w", encoding="utf-8") as f:
        f.write(report_md)

    # Guardar JSON (serializable)
    def _make_serializable(obj):
        if isinstance(obj, dict):
            return {k: _make_serializable(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_make_serializable(v) for v in obj]
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        return obj

    with open(ARTIFACTS_DIR / "statistical_tests.json", "w") as f:
        json.dump(_make_serializable(all_tests), f, indent=2)

    print("\n[Stats] ✓ Reporte generado en:", ARTIFACTS_DIR / "statistical_report.md")
    return all_tests
