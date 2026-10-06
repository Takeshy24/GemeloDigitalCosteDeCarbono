"""Calcula la importancia por permutación de crop_type."""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Cargar dataset
df = pd.read_csv(ROOT / 'resultados_experimento' / 'dataset_sintetico_semilla42.csv')
X = df.drop(columns=['total_co2e_kg'])
y = df['total_co2e_kg'].values

# Identificar columnas numéricas y categóricas (excluyendo crop_type de las numéricas)
cat_features = ['crop_type']
num_features = [c for c in X.columns if c not in cat_features]

print(f"Numéricas: {num_features}")
print(f"Categóricas: {cat_features}")

# Preprocesador
preprocessor = ColumnTransformer([
    ('num', StandardScaler(), num_features),
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
], remainder='drop')

# Modelo
model = Pipeline([
    ('prep', preprocessor),
    ('model', GradientBoostingRegressor(n_estimators=200, random_state=42)),
])

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model.fit(X_train, y_train)

# Importancia por permutación sobre X_test
result = permutation_importance(
    model, X_test, y_test,
    n_repeats=20,
    random_state=42,
    scoring='neg_root_mean_squared_error',
    n_jobs=-1,
)

# Mostrar resultados
names = X_test.columns.tolist()
print("\n=== Importancia por permutación ===")
for i, name in enumerate(names):
    print(f"{name}: {result.importances_mean[i]:.4f} ± {result.importances_std[i]:.4f}")