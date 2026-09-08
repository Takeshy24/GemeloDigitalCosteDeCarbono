"""
eda.py
======
Análisis Exploratorio de Datos (EDA) para el dataset de huella de carbono.

Genera y guarda en backend/ml_artifacts/eda/:
  1. Estadísticas descriptivas (CSV + JSON)
  2. Distribución del target (histograma + KDE)
  3. Matriz de correlación Pearson y Spearman
  4. Boxplots por variable numérica
  5. Detección y reporte de outliers (IQR + Z-score)
  6. Gráfica de dispersión target vs. features numéricas
  7. Distribución del target por tipo de cultivo
"""

import json
import warnings
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # sin interfaz gráfica en servidor
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy import stats

warnings.filterwarnings("ignore")

EDA_DIR = Path("backend/ml_artifacts/eda")
TARGET = "total_co2e_kg"
PALETTE = "viridis"


def _save(fig: plt.Figure, name: str) -> None:
    EDA_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(EDA_DIR / name, dpi=150, bbox_inches="tight")
    plt.close(fig)


# ---------------------------------------------------------------------------
# 1. Estadísticas descriptivas
# ---------------------------------------------------------------------------
def descriptive_stats(df: pd.DataFrame) -> dict:
    """Calcula estadísticas descriptivas extendidas."""
    num_df = df.select_dtypes(include="number")
    desc = num_df.describe(percentiles=[0.25, 0.5, 0.75, 0.90, 0.95]).T
    desc["skewness"] = num_df.skew()
    desc["kurtosis"] = num_df.kurtosis()
    desc["missing"] = df.isnull().sum()

    out = {col: {k: round(float(v), 6) for k, v in row.items()} for col, row in desc.iterrows()}

    EDA_DIR.mkdir(parents=True, exist_ok=True)
    desc.to_csv(EDA_DIR / "descriptive_stats.csv")
    with open(EDA_DIR / "descriptive_stats.json", "w") as f:
        json.dump(out, f, indent=2)

    print("[EDA] Estadísticas descriptivas guardadas.")
    return out


# ---------------------------------------------------------------------------
# 2. Distribución del target
# ---------------------------------------------------------------------------
def plot_target_distribution(df: pd.DataFrame) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    fig.suptitle("Distribución de la variable objetivo (total_co2e_kg)", fontsize=14)

    # Histograma + KDE
    axes[0].set_title("Distribución original")
    df[TARGET].plot(kind="hist", bins=50, density=True, alpha=0.6, ax=axes[0], color="#4CAF50")
    df[TARGET].plot(kind="kde", ax=axes[0], color="#1B5E20", linewidth=2)
    axes[0].set_xlabel("kg CO₂e")

    # Log-transformado
    log_target = np.log1p(df[TARGET])
    axes[1].set_title("Distribución log(1 + target)")
    log_target.plot(kind="hist", bins=50, density=True, alpha=0.6, ax=axes[1], color="#2196F3")
    log_target.plot(kind="kde", ax=axes[1], color="#0D47A1", linewidth=2)
    axes[1].set_xlabel("log(1 + kg CO₂e)")

    _save(fig, "target_distribution.png")
    print("[EDA] Distribución del target guardada.")


# ---------------------------------------------------------------------------
# 3. Matrices de correlación
# ---------------------------------------------------------------------------
def plot_correlations(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include="number")

    pearson_corr = num_df.corr(method="pearson")
    spearman_corr = num_df.corr(method="spearman")

    for method, corr in [("pearson", pearson_corr), ("spearman", spearman_corr)]:
        fig, ax = plt.subplots(figsize=(10, 8))
        mask = np.triu(np.ones_like(corr, dtype=bool))
        sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="coolwarm",
                    center=0, ax=ax, linewidths=0.5, annot_kws={"size": 8})
        ax.set_title(f"Correlación {method.capitalize()}", fontsize=13)
        _save(fig, f"correlation_{method}.png")

    print("[EDA] Matrices de correlación guardadas.")
    return {
        "pearson_with_target": pearson_corr[TARGET].drop(TARGET).to_dict(),
        "spearman_with_target": spearman_corr[TARGET].drop(TARGET).to_dict(),
    }


# ---------------------------------------------------------------------------
# 4. Boxplots por variable numérica
# ---------------------------------------------------------------------------
def plot_boxplots(df: pd.DataFrame) -> None:
    num_cols = [c for c in df.select_dtypes(include="number").columns if c != TARGET]
    n = len(num_cols)
    cols = 3
    rows = (n + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(15, 4 * rows))
    axes = axes.flatten()

    for i, col in enumerate(num_cols):
        axes[i].boxplot(df[col].dropna(), vert=True, patch_artist=True,
                        boxprops=dict(facecolor="#90CAF9"),
                        medianprops=dict(color="#0D47A1", linewidth=2))
        axes[i].set_title(col, fontsize=10)
        axes[i].set_ylabel("Valor")

    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    fig.suptitle("Boxplots de features numéricas", fontsize=14, y=1.01)
    fig.tight_layout()
    _save(fig, "boxplots.png")
    print("[EDA] Boxplots guardados.")


# ---------------------------------------------------------------------------
# 5. Detección de outliers
# ---------------------------------------------------------------------------
def detect_outliers(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include="number")
    report = {}

    for col in num_df.columns:
        series = num_df[col].dropna()
        q1, q3 = series.quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        n_iqr = int(((series < lower) | (series > upper)).sum())

        z_scores = np.abs(stats.zscore(series))
        n_zscore = int((z_scores > 3).sum())

        report[col] = {
            "outliers_IQR": n_iqr,
            "outliers_Zscore_3sigma": n_zscore,
            "pct_IQR": round(n_iqr / len(series) * 100, 2),
            "pct_Zscore": round(n_zscore / len(series) * 100, 2),
        }

    EDA_DIR.mkdir(parents=True, exist_ok=True)
    with open(EDA_DIR / "outliers_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("[EDA] Reporte de outliers guardado.")
    return report


# ---------------------------------------------------------------------------
# 6. Scatter: target vs. features numéricas
# ---------------------------------------------------------------------------
def plot_scatter_features(df: pd.DataFrame) -> None:
    num_cols = [c for c in df.select_dtypes(include="number").columns if c != TARGET]
    n = len(num_cols)
    cols = 3
    rows = (n + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(15, 4 * rows))
    axes = axes.flatten()

    for i, col in enumerate(num_cols):
        axes[i].scatter(df[col], df[TARGET], alpha=0.15, s=10, color="#1976D2")
        # Línea de tendencia
        m, b = np.polyfit(df[col], df[TARGET], 1)
        x_line = np.linspace(df[col].min(), df[col].max(), 100)
        axes[i].plot(x_line, m * x_line + b, color="#D32F2F", linewidth=1.5)
        axes[i].set_xlabel(col, fontsize=9)
        axes[i].set_ylabel("CO₂e (kg)", fontsize=9)
        axes[i].set_title(f"{col} vs. target", fontsize=10)

    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    fig.suptitle("Dispersión: features vs. total_co2e_kg", fontsize=14, y=1.01)
    fig.tight_layout()
    _save(fig, "scatter_features.png")
    print("[EDA] Scatter plots guardados.")


# ---------------------------------------------------------------------------
# 7. Target por tipo de cultivo
# ---------------------------------------------------------------------------
def plot_target_by_crop(df: pd.DataFrame) -> None:
    if "crop_type" not in df.columns:
        return
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    # Boxplot
    groups = [df[df["crop_type"] == c][TARGET].values for c in sorted(df["crop_type"].unique())]
    labels = sorted(df["crop_type"].unique())
    bp = axes[0].boxplot(groups, labels=labels, patch_artist=True,
                         medianprops=dict(color="black", linewidth=2))
    colors = plt.cm.Set2(np.linspace(0, 1, len(labels)))
    for patch, color in zip(bp["boxes"], colors):
        patch.set_facecolor(color)
    axes[0].set_title("CO₂e total por tipo de cultivo")
    axes[0].set_ylabel("kg CO₂e")

    # Violin
    df_cat = df[["crop_type", TARGET]].copy()
    sns.violinplot(data=df_cat, x="crop_type", y=TARGET, palette="Set2",
                   order=labels, ax=axes[1], inner="box")
    axes[1].set_title("Violinplot por tipo de cultivo")
    axes[1].set_ylabel("kg CO₂e")

    fig.suptitle("Distribución de emisiones por tipo de cultivo", fontsize=14)
    fig.tight_layout()
    _save(fig, "target_by_crop.png")
    print("[EDA] Gráficas por cultivo guardadas.")


# ---------------------------------------------------------------------------
# Función principal de EDA
# ---------------------------------------------------------------------------
def run_eda(df: pd.DataFrame) -> dict:
    """Ejecuta el EDA completo y devuelve un resumen."""
    print("\n" + "="*60)
    print("  ANÁLISIS EXPLORATORIO DE DATOS (EDA)")
    print("="*60)
    print(f"  Registros: {len(df):,}  |  Features: {df.shape[1] - 1}")
    print(f"  Target: {TARGET}")
    print("="*60 + "\n")

    stats_report = descriptive_stats(df)
    plot_target_distribution(df)
    corr_report = plot_correlations(df)
    plot_boxplots(df)
    outlier_report = detect_outliers(df)
    plot_scatter_features(df)
    plot_target_by_crop(df)

    summary = {
        "n_samples": len(df),
        "n_features": df.shape[1] - 1,
        "target_mean": round(float(df[TARGET].mean()), 4),
        "target_std": round(float(df[TARGET].std()), 4),
        "target_min": round(float(df[TARGET].min()), 4),
        "target_max": round(float(df[TARGET].max()), 4),
        "target_skewness": round(float(df[TARGET].skew()), 4),
        "correlations": corr_report,
        "outliers": outlier_report,
    }

    EDA_DIR.mkdir(parents=True, exist_ok=True)
    with open(EDA_DIR / "eda_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("\n[EDA] ✓ Análisis completado. Artefactos en:", EDA_DIR)
    return summary
