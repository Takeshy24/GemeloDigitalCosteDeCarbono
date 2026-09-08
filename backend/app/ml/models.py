"""
models.py
=========
Define los 5 modelos del pipeline de ML:

ALGORITMOS BASE
  1. Random Forest Regressor       (ensemble, bagging)
  2. XGBoost Regressor             (ensemble, boosting)
  3. Support Vector Regressor      (kernel RBF)

HÍBRIDOS
  4. Stacking Ensemble             (RF + XGB + SVR → meta-learner Ridge)
  5. Blending Ensemble             (promedio ponderado optimizable de los 3 base)

También define el espacio de hiperparámetros para búsqueda con
RandomizedSearchCV/GridSearchCV.
"""

from __future__ import annotations

import numpy as np
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Ridge
from sklearn.svm import SVR
from xgboost import XGBRegressor


# ---------------------------------------------------------------------------
# 1. Random Forest
# ---------------------------------------------------------------------------
def build_random_forest(random_state: int = 42) -> RandomForestRegressor:
    return RandomForestRegressor(
        n_estimators=200,
        max_depth=None,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        bootstrap=True,
        random_state=random_state,
        n_jobs=-1,
    )


RF_PARAM_GRID = {
    "n_estimators": [100, 200, 300],
    "max_depth": [None, 10, 20, 30],
    "min_samples_split": [2, 4, 8],
    "min_samples_leaf": [1, 2, 4],
    "max_features": ["sqrt", "log2"],
}


# ---------------------------------------------------------------------------
# 2. XGBoost
# ---------------------------------------------------------------------------
def build_xgboost(random_state: int = 42) -> XGBRegressor:
    return XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=random_state,
        n_jobs=-1,
        verbosity=0,
        eval_metric="rmse",
    )


XGB_PARAM_GRID = {
    "n_estimators": [200, 300, 500],
    "max_depth": [4, 6, 8],
    "learning_rate": [0.01, 0.05, 0.1],
    "subsample": [0.7, 0.8, 0.9],
    "colsample_bytree": [0.7, 0.8, 0.9],
    "reg_alpha": [0.0, 0.1, 0.5],
    "reg_lambda": [0.5, 1.0, 2.0],
}


# ---------------------------------------------------------------------------
# 3. SVR (Support Vector Regression)
# ---------------------------------------------------------------------------
def build_svr() -> SVR:
    return SVR(
        kernel="rbf",
        C=100.0,
        epsilon=0.1,
        gamma="scale",
    )


SVR_PARAM_GRID = {
    "C": [10, 50, 100, 500],
    "epsilon": [0.01, 0.05, 0.1, 0.5],
    "gamma": ["scale", "auto"],
    "kernel": ["rbf"],
}


# ---------------------------------------------------------------------------
# 4. Stacking Ensemble (Híbrido)
#    Estimadores base: RF + XGB + SVR
#    Meta-learner: Ridge Regression (lineal, evita overfitting)
#    cv=5 → OOF predictions como features del meta-learner
# ---------------------------------------------------------------------------
def build_stacking(random_state: int = 42) -> StackingRegressor:
    estimators = [
        ("rf", build_random_forest(random_state)),
        ("xgb", build_xgboost(random_state)),
        ("svr", build_svr()),
    ]
    return StackingRegressor(
        estimators=estimators,
        final_estimator=Ridge(alpha=1.0),
        cv=5,
        n_jobs=-1,
        passthrough=False,   # solo usa las predicciones OOF como features
    )


STACKING_PARAM_GRID = {
    "final_estimator__alpha": [0.01, 0.1, 1.0, 10.0, 100.0],
}


# ---------------------------------------------------------------------------
# 5. Blending Ensemble (Híbrido)
#    Implementación manual: media ponderada de las predicciones de RF, XGB, SVR.
#    Los pesos se optimizan por grid search sobre el set de validación.
# ---------------------------------------------------------------------------
class BlendingEnsemble:
    """
    Ensemble por blending: predice como suma ponderada de los modelos base.
    Los pesos w_rf, w_xgb, w_svr se optimizan minimizando el RMSE en el
    conjunto de validación.
    """

    def __init__(
        self,
        rf: RandomForestRegressor | None = None,
        xgb: XGBRegressor | None = None,
        svr: SVR | None = None,
        weights: tuple[float, float, float] = (0.4, 0.4, 0.2),
        random_state: int = 42,
    ):
        self.rf = rf or build_random_forest(random_state)
        self.xgb = xgb or build_xgboost(random_state)
        self.svr = svr or build_svr()
        self.weights = np.array(weights, dtype=float)
        self.weights /= self.weights.sum()  # normaliza a suma 1
        self.is_fitted_ = False

    def fit(self, X, y):
        self.rf.fit(X, y)
        self.xgb.fit(X, y)
        self.svr.fit(X, y)
        self.is_fitted_ = True
        return self

    def predict(self, X):
        p_rf = self.rf.predict(X)
        p_xgb = self.xgb.predict(X)
        p_svr = self.svr.predict(X)
        return (
            self.weights[0] * p_rf
            + self.weights[1] * p_xgb
            + self.weights[2] * p_svr
        )

    def get_params(self, deep: bool = True) -> dict:
        return {"weights": tuple(self.weights)}

    def set_params(self, **params):
        if "weights" in params:
            self.weights = np.array(params["weights"], dtype=float)
            self.weights /= self.weights.sum()
        return self


BLENDING_WEIGHT_GRID = [
    (w_rf, w_xgb, round(1.0 - w_rf - w_xgb, 2))
    for w_rf in [0.2, 0.3, 0.4, 0.5]
    for w_xgb in [0.2, 0.3, 0.4, 0.5]
    if 0 < round(1.0 - w_rf - w_xgb, 2) <= 0.6
]


# ---------------------------------------------------------------------------
# Registro centralizado de modelos
# ---------------------------------------------------------------------------
def get_all_models(random_state: int = 42) -> dict:
    """Devuelve un dict {nombre: modelo_instanciado}."""
    return {
        "RandomForest": build_random_forest(random_state),
        "XGBoost": build_xgboost(random_state),
        "SVR": build_svr(),
        "Stacking": build_stacking(random_state),
        "Blending": BlendingEnsemble(random_state=random_state),
    }


def get_param_grids() -> dict:
    """Devuelve los espacios de hiperparámetros para búsqueda."""
    return {
        "RandomForest": RF_PARAM_GRID,
        "XGBoost": XGB_PARAM_GRID,
        "SVR": SVR_PARAM_GRID,
        "Stacking": STACKING_PARAM_GRID,
        "Blending": None,  # se maneja con BLENDING_WEIGHT_GRID
    }


def build_blending_base_models(random_state: int = 42) -> dict:
    """Devuelve instancias frescas de los modelos base del BlendingEnsemble."""
    return {
        "rf": build_random_forest(random_state),
        "xgb": build_xgboost(random_state),
        "svr": build_svr(),
    }
