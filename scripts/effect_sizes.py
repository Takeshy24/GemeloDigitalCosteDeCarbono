"""
effect_sizes.py
===============
Calcula los tamaños del efecto (r de Wilcoxon) para los 4 pares.
"""
import numpy as np

n = 10  # número de folds

# Valores W de Wilcoxon (de la Tabla 6/7)
# XGBoost vs RF: W=55
# XGBoost vs SVR: W=55
# XGBoost vs Stacking: W=37
# XGBoost vs Blending: W=54

pairs = {
    "XGBoost vs Random Forest": 55,
    "XGBoost vs SVR": 55,
    "XGBoost vs Stacking": 37,
    "XGBoost vs Blending": 54,
}

print("Tamaños del efecto (rank-biserial r)")
print("=" * 60)
for name, W in pairs.items():
    r_rb = 1 - (4 * W) / (n * (n + 1))
    # Interpretación
    if abs(r_rb) < 0.1:
        interp = "despreciable"
    elif abs(r_rb) < 0.3:
        interp = "pequeño"
    elif abs(r_rb) < 0.5:
        interp = "mediano"
    else:
        interp = "grande"
    print(f"{name}: W={W}, r_rb={r_rb:.4f} ({interp})")