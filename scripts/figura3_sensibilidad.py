"""
figura3_sensibilidad.py
=======================
Genera la Figura 3: Análisis de sensibilidad tipo tornado
a partir de los datos reales de importancia por permutación.
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# ---------------------------------------------------------------------------
# Cargar datos
# ---------------------------------------------------------------------------
CSV_PATH = "resultados_experimento/11_importancia_variables.csv"
df = pd.read_csv(CSV_PATH)

# Ordenar por importancia (de menor a mayor para que la más importante quede arriba)
df = df.sort_values("permutation_importance_mean", ascending=True).reset_index(drop=True)

# ---------------------------------------------------------------------------
# Crear figura
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 5.5))

# Colores: azul para positivos, rojo para negativos
colors = ["#D32F2F" if v < 0 else "#1976D2" for v in df["permutation_importance_mean"]]

# Barras horizontales
bars = ax.barh(
    df["variable"],
    df["permutation_importance_mean"],
    color=colors,
    alpha=0.85,
    edgecolor="white",
    height=0.7,
)

# Etiquetas de valores al final de cada barra
for bar, val in zip(bars, df["permutation_importance_mean"]):
    if val >= 0:
        ax.text(
            bar.get_width() + 50,
            bar.get_y() + bar.get_height() / 2,
            f"{val:.2f}",
            va="center",
            ha="left",
            fontsize=9,
            color="#333333",
        )
    else:
        ax.text(
            bar.get_width() - 50,
            bar.get_y() + bar.get_height() / 2,
            f"{val:.2f}",
            va="center",
            ha="right",
            fontsize=9,
            color="#333333",
        )

# Línea vertical en 0
ax.axvline(0, color="#666666", linewidth=1, linestyle="--", alpha=0.7)

# Etiquetas de ejes
ax.set_xlabel("Importancia por permutación (media)", fontsize=11)
ax.set_ylabel("Variable", fontsize=11)
ax.set_title("Análisis de sensibilidad tipo tornado de las variables predictoras", fontsize=12, pad=15)

# Grid
ax.grid(axis="x", alpha=0.3, linestyle="--")
ax.set_axisbelow(True)

# Ajustar límites del eje X
x_max = df["permutation_importance_mean"].max()
x_min = df["permutation_importance_mean"].min()
ax.set_xlim(x_min * 1.2 if x_min < 0 else -x_max * 0.1, x_max * 1.15)

# Ajustar layout
fig.tight_layout()

# Guardar figura
OUT_PATH = "resultados_experimento/figuras/07_sensibilidad_tornado_ml.png"
fig.savefig(OUT_PATH, dpi=300, bbox_inches="tight")
print(f"Figura guardada en: {OUT_PATH}")

plt.show()