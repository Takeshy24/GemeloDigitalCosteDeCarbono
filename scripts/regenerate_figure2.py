"""
regenerate_figure2.py
=====================
Regenera la Figura 2 (comparación de RMSE, MAE, R² y MAPE)
con unidades en los ejes.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "resultados_experimento" / "figuras"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Valores de la Tabla 4
modelos = ['XGBoost', 'Stacking', 'Blending', 'Random Forest', 'SVR']
rmse = [2909.5852, 2654.8385, 3021.9306, 3193.9958, 5030.3698]
mae = [1513.1987, 1459.7429, 1444.9496, 1681.3852, 1881.3268]
r2 = [0.8817, 0.9015, 0.8724, 0.8574, 0.6463]
mape = [58.7049, 44.6908, 47.9325, 73.8022, 45.9780]

fig, axes = plt.subplots(1, 4, figsize=(18, 5))
colors = ['#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#E53935']

# RMSE
bars = axes[0].bar(modelos, rmse, color=colors, alpha=0.85, edgecolor='white')
axes[0].set_title('RMSE')
axes[0].set_ylabel('RMSE (kg CO₂e)')  # Unidad añadida
axes[0].set_xticks(range(len(modelos)))
axes[0].set_xticklabels(modelos, rotation=20, ha='right', fontsize=8)
for bar, val in zip(bars, rmse):
    axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height()*1.01, f'{val:.2f}', ha='center', va='bottom', fontsize=7)

# MAE
bars = axes[1].bar(modelos, mae, color=colors, alpha=0.85, edgecolor='white')
axes[1].set_title('MAE')
axes[1].set_ylabel('MAE (kg CO₂e)')  # Unidad añadida
axes[1].set_xticks(range(len(modelos)))
axes[1].set_xticklabels(modelos, rotation=20, ha='right', fontsize=8)
for bar, val in zip(bars, mae):
    axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height()*1.01, f'{val:.2f}', ha='center', va='bottom', fontsize=7)

# R²
bars = axes[2].bar(modelos, r2, color=colors, alpha=0.85, edgecolor='white')
axes[2].set_title('R²')
axes[2].set_ylabel('R² (adimensional)')  # Unidad añadida
axes[2].set_xticks(range(len(modelos)))
axes[2].set_xticklabels(modelos, rotation=20, ha='right', fontsize=8)
for bar, val in zip(bars, r2):
    axes[2].text(bar.get_x() + bar.get_width()/2, bar.get_height()*1.01, f'{val:.4f}', ha='center', va='bottom', fontsize=7)

# MAPE
bars = axes[3].bar(modelos, mape, color=colors, alpha=0.85, edgecolor='white')
axes[3].set_title('MAPE')
axes[3].set_ylabel('MAPE (%)')  # Unidad añadida
axes[3].set_xticks(range(len(modelos)))
axes[3].set_xticklabels(modelos, rotation=20, ha='right', fontsize=8)
for bar, val in zip(bars, mape):
    axes[3].text(bar.get_x() + bar.get_width()/2, bar.get_height()*1.01, f'{val:.2f}', ha='center', va='bottom', fontsize=7)

fig.tight_layout()
fig.savefig(OUT_DIR / 'figura2_metricas_modelos.png', dpi=300, bbox_inches='tight')
print(f"[OK] Figura 2 regenerada en: {OUT_DIR / 'figura2_metricas_modelos.png'}")