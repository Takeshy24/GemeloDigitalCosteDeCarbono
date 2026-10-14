"""
regenerate_figure3.py
=====================
Regenera la Figura 3 (análisis de sensibilidad tipo tornado)
con etiquetas que NO se solapen, incluyendo valores negativos.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "resultados_experimento" / "figuras"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Valores de la Tabla 6 (importancia por permutación)
variables = [
    'data_volume_gb_day',
    'cloud_region_intensity',
    'transmission_freq_hz',
    'operation_days',
    'solar_powered',
    'crop_type',
    'sensor_count',
    'model_resolution',
    'edge_count',
]
importancias = [6146.92, 4222.76, 3578.39, 3434.80, 911.66, 323.18, 49.72, 38.87, -33.78]

# Ordenar de mayor a menor
orden = np.argsort(importancias)[::-1]
variables_ord = [variables[i] for i in orden]
importancias_ord = [importancias[i] for i in orden]

fig, ax = plt.subplots(figsize=(11, 7))
bars = ax.barh(range(len(variables_ord)), importancias_ord, color='#1565c0', alpha=0.85)
ax.set_yticks(range(len(variables_ord)))
ax.set_yticklabels(variables_ord)
ax.invert_yaxis()  # Mayor arriba
ax.set_xlabel('Incremento medio de RMSE (kg CO₂e)')
ax.set_title('Análisis de sensibilidad tipo tornado de las variables predictoras')
ax.axvline(0, color='black', linewidth=0.8, linestyle='--')

# Etiquetas de valores con separación adaptativa
for bar, val in zip(bars, importancias_ord):
    if val > 0:
        # Etiqueta a la derecha de la barra
        x_pos = bar.get_width() + 100
        ha = 'left'
    else:
        # Etiqueta a la izquierda de la barra (para valores negativos)
        x_pos = bar.get_width() - 100
        ha = 'right'
    ax.text(x_pos, bar.get_y() + bar.get_height()/2, f'{val:.2f}',
            ha=ha, va='center', fontsize=9, fontweight='bold')

# Ajustar límites para evitar solapamiento
ax.set_xlim(min(importancias_ord) - 500, max(importancias_ord) * 1.15)

# Añadir una nota sobre el valor negativo
ax.text(0.98, 0.02, 'Nota: valores negativos indican redundancia con otras variables',
        transform=ax.transAxes, ha='right', va='bottom', fontsize=8, style='italic')

fig.tight_layout()
fig.savefig(OUT_DIR / 'figura3_sensibilidad.png', dpi=300, bbox_inches='tight')
print(f"[OK] Figura 3 regenerada en: {OUT_DIR / 'figura3_sensibilidad.png'}")