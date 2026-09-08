"""
app.py - Laboratorio de Entrenamiento de Machine Learning para Gemelos Digitales (AP-9)
Construido con Streamlit con soporte armónico de Modo Oscuro y Modo Claro.
"""

from __future__ import annotations

import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st

from utils import (
    ARTIFACTS_DIR,
    EDA_DIR,
    H5_MODEL_PATH,
    MODEL_CARD_PATH,
    PLOTS_DIR,
    PREPROCESSOR_PATH,
    SKLEARN_MODEL_PATH,
    STAT_REPORT_PATH,
    execute_pipeline,
    load_dataset_for_eda,
    load_existing_report,
    load_inference_pipeline,
    predict_carbon,
    read_artifact_bytes,
)

# -----------------------------------------------------------------------------
# Configuración general de la página
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Laboratorio de Entrenamiento ML | Gemelos Digitales",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -----------------------------------------------------------------------------
# CONTROL DE TEMA (Modo Oscuro / Claro) en Sidebar
# -----------------------------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/artificial-intelligence.png", width=56)
    st.title("Laboratorio ML")
    st.caption("Gemelos Digitales • Huella de Carbono (AP-9)")

    st.markdown("---")
    st.markdown("**🎨 Apariencia de la Interfaz**")
    theme_choice = st.radio(
        "Tema visual",
        options=["🌙 Modo Oscuro", "☀️ Modo Claro"],
        index=0,
        horizontal=True,
        label_visibility="collapsed",
    )
    is_dark = "Oscuro" in theme_choice

# -----------------------------------------------------------------------------
# DEFINICIÓN DE PALETA ARMONIOSA (CSS Custom Properties)
# -----------------------------------------------------------------------------
if is_dark:
    # Paleta Modo Oscuro: Obsidian Navy, acentos índigo y esmeralda
    css_vars = """
    :root {
        --bg-page: #0B1120;
        --bg-sidebar: #070D1B;
        --bg-card: rgba(22, 33, 56, 0.85);
        --bg-card-hover: rgba(30, 45, 75, 0.95);
        --border-card: rgba(99, 102, 241, 0.22);
        --border-card-hover: rgba(129, 140, 248, 0.55);
        --border-subtle: #1E293B;
        --card-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45);
        --text-primary: #F8FAFC;
        --text-secondary: #CBD5E1;
        --text-muted: #94A3B8;
        --accent-indigo: #818CF8;
        --accent-indigo-glow: rgba(99, 102, 241, 0.35);
        --accent-emerald: #34D399;
        --accent-amber: #FBBF24;
        --badge-sig-bg: rgba(16, 185, 129, 0.18);
        --badge-sig-text: #34D399;
        --badge-sig-border: rgba(16, 185, 129, 0.4);
        --badge-ns-bg: rgba(148, 163, 184, 0.15);
        --badge-ns-text: #94A3B8;
        --badge-ns-border: rgba(148, 163, 184, 0.3);
        --sim-bg: linear-gradient(135deg, rgba(30, 58, 138, 0.65), rgba(15, 23, 42, 0.85));
        --sim-border: rgba(96, 165, 250, 0.45);
        --sim-value: #93C5FD;
        --sim-meta: #E2E8F0;
        --nav-btn-bg: rgba(30, 41, 59, 0.8);
        --nav-btn-border: #334155;
        --nav-btn-text: #818CF8;
        --nav-btn-hover: #1E293B;
        --table-header-bg: #1E293B;
        --expander-bg: rgba(22, 33, 56, 0.85);
    }
    """
else:
    # Paleta Modo Claro: Crisp Clean Slate, acentos índigo y esmeralda balanceados
    css_vars = """
    :root {
        --bg-page: #F8FAFC;
        --bg-sidebar: #FFFFFF;
        --bg-card: #FFFFFF;
        --bg-card-hover: #F8FAFC;
        --border-card: #E2E8F0;
        --border-card-hover: #6366F1;
        --border-subtle: #E2E8F0;
        --card-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
        --text-primary: #0F172A;
        --text-secondary: #334155;
        --text-muted: #64748B;
        --accent-indigo: #4F46E5;
        --accent-indigo-glow: rgba(79, 70, 229, 0.2);
        --accent-emerald: #059669;
        --accent-amber: #D97706;
        --badge-sig-bg: #ECFDF5;
        --badge-sig-text: #059669;
        --badge-sig-border: #A7F3D0;
        --badge-ns-bg: #F1F5F9;
        --badge-ns-text: #64748B;
        --badge-ns-border: #CBD5E1;
        --sim-bg: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
        --sim-border: #818CF8;
        --sim-value: #1E40AF;
        --sim-meta: #334155;
        --nav-btn-bg: #F1F5F9;
        --nav-btn-border: #CBD5E1;
        --nav-btn-text: #4F46E5;
        --nav-btn-hover: #E2E8F0;
        --table-header-bg: #F1F5F9;
        --expander-bg: #FFFFFF;
    }
    """

st.markdown(f"""
<style>
    {css_vars}

    /* Fondo de la aplicación */
    .stApp {{
        background-color: var(--bg-page) !important;
        color: var(--text-secondary) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    }}

    /* Barra lateral */
    section[data-testid="stSidebar"] {{
        background-color: var(--bg-sidebar) !important;
        border-right: 1px solid var(--border-subtle) !important;
    }}
    section[data-testid="stSidebar"] h1,
    section[data-testid="stSidebar"] h2,
    section[data-testid="stSidebar"] h3,
    section[data-testid="stSidebar"] p,
    section[data-testid="stSidebar"] span,
    section[data-testid="stSidebar"] label {{
        color: var(--text-primary) !important;
    }}

    /* Encabezados */
    h1, h2, h3, h4, h5, h6 {{
        color: var(--text-primary) !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em;
    }}
    p, span, label {{
        color: var(--text-secondary);
    }}

    /* Pestañas (Tabs) */
    button[data-baseweb="tab"] {{
        background: transparent !important;
        color: var(--text-muted) !important;
        font-weight: 600 !important;
        border-radius: 6px 6px 0 0 !important;
        padding: 0.6rem 1.2rem !important;
        transition: all 0.2s ease;
    }}
    button[data-baseweb="tab"]:hover {{
        color: var(--text-primary) !important;
    }}
    button[data-baseweb="tab"][aria-selected="true"] {{
        color: var(--accent-indigo) !important;
        border-bottom: 2px solid var(--accent-indigo) !important;
    }}
    [data-baseweb="tab-highlight"] {{
        background-color: var(--accent-indigo) !important;
    }}

    /* Tarjetas personalizadas de métricas */
    .metric-card {{
        background: var(--bg-card);
        border: 1px solid var(--border-card);
        border-radius: 14px;
        padding: 20px 22px;
        box-shadow: var(--card-shadow);
        backdrop-filter: blur(10px);
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }}
    .metric-card:hover {{
        transform: translateY(-2px);
        border-color: var(--border-card-hover);
        box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.15);
    }}
    .metric-title {{
        font-size: 0.8rem;
        color: var(--text-muted);
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.06em;
        margin-bottom: 6px;
    }}
    .metric-value {{
        font-size: 1.85rem;
        color: var(--text-primary);
        font-weight: 800;
        letter-spacing: -0.03em;
    }}
    .metric-sub {{
        font-size: 0.82rem;
        color: var(--accent-emerald);
        margin-top: 4px;
        font-weight: 600;
    }}

    /* Insignias (Badges) */
    .badge {{
        display: inline-block;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }}
    .badge-winner {{
        background: linear-gradient(135deg, #F59E0B, #D97706);
        color: #FFFFFF;
    }}
    .badge-sig {{
        background: var(--badge-sig-bg);
        color: var(--badge-sig-text);
        border: 1px solid var(--badge-sig-border);
    }}
    .badge-ns {{
        background: var(--badge-ns-bg);
        color: var(--badge-ns-text);
        border: 1px solid var(--badge-ns-border);
    }}

    /* Botones primarios */
    .stButton > button {{
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
        color: #FFFFFF !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 0.65rem 1.4rem !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 14px var(--accent-indigo-glow) !important;
    }}
    .stButton > button:hover {{
        opacity: 0.95 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px var(--accent-indigo-glow) !important;
    }}

    /* Botones de descarga */
    .stDownloadButton > button {{
        background: var(--bg-card) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-card) !important;
        border-radius: 10px !important;
        padding: 0.65rem 1.2rem !important;
        font-weight: 600 !important;
        box-shadow: var(--card-shadow) !important;
        transition: all 0.2s ease !important;
    }}
    .stDownloadButton > button:hover {{
        border-color: var(--accent-indigo) !important;
        color: var(--accent-indigo) !important;
        transform: translateY(-1px) !important;
    }}

    /* Dataframes y tablas */
    div[data-testid="stDataFrame"] {{
        border: 1px solid var(--border-card) !important;
        border-radius: 10px !important;
        overflow: hidden;
    }}

    /* Expanders */
    div[data-testid="stExpander"] {{
        background: var(--expander-bg) !important;
        border: 1px solid var(--border-card) !important;
        border-radius: 10px !important;
    }}

    /* Enlace de navegación de retorno */
    .nav-back-link {{
        background: var(--nav-btn-bg);
        border: 1px solid var(--nav-btn-border);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        color: var(--nav-btn-text);
        font-weight: 600;
        text-decoration: none;
        display: block;
        transition: all 0.2s ease;
    }}
    .nav-back-link:hover {{
        background: var(--nav-btn-hover);
        text-decoration: none;
    }}
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Cargar datos existentes
# -----------------------------------------------------------------------------
report = load_existing_report()

# -----------------------------------------------------------------------------
# BARRA LATERAL (Sidebar) — Configuración del Laboratorio
# -----------------------------------------------------------------------------
with st.sidebar:
    st.subheader("⚙️ Configuración de Experimentos")

    n_samples = st.slider(
        "Muestras del dataset sintético",
        min_value=1000,
        max_value=10000,
        value=2500,
        step=500,
        help="Número de simulaciones agronómicas y físicas a generar para el entrenamiento.",
    )

    seed = st.number_input(
        "Semilla aleatoria (Seed)",
        min_value=1,
        max_value=99999,
        value=42,
        help="Garantiza reproducibilidad de los datos y splits.",
    )

    cv_folds = st.selectbox(
        "Folds de Validación Cruzada (K-Fold)",
        options=[5, 10],
        index=0,
        help="Folds usados en la optimización de hiperparámetros.",
    )

    search_mode = st.radio(
        "Intensidad de Búsqueda de Hiperparámetros",
        options=["Rápido (5 iteraciones)", "Riguroso (20 iteraciones)"],
        index=1,
        help="Cantidad de combinaciones evaluadas por RandomizedSearchCV para cada modelo.",
    )
    n_iter_search = 5 if "Rápido" in search_mode else 20

    st.markdown("---")
    
    start_training = st.button("🚀 Iniciar Entrenamiento en Laboratorio", use_container_width=True)

    st.markdown("---")
    st.markdown("### 🔗 Navegación")
    st.markdown(
        """
        <a href="http://localhost:3000" target="_blank" class="nav-back-link">
            ⬅ Volver a la App Principal (3000)
        </a>
        """,
        unsafe_allow_html=True,
    )
    st.caption("La aplicación web principal se ejecuta en el puerto 3000.")

# -----------------------------------------------------------------------------
# EJECUCIÓN DE ENTRENAMIENTO (Si se presiona el botón)
# -----------------------------------------------------------------------------
if start_training:
    st.markdown("## 🔄 Ejecutando Pipeline de Entrenamiento...")
    progress_bar = st.progress(0)
    status_text = st.empty()

    def update_progress(step_name: str, pct: int):
        progress_bar.progress(pct)
        status_text.markdown(f"**Etapa actual ({pct}%):** {step_name}")

    try:
        with st.spinner("Procesando modelos de ML, validación cruzada y pruebas estadísticas..."):
            new_report = execute_pipeline(
                n_samples=int(n_samples),
                seed=int(seed),
                n_iter_search=int(n_iter_search),
                cv_folds=int(cv_folds),
                final_cv_folds=10,
                progress_callback=update_progress,
            )
            report = new_report
        st.success(f"🎉 ¡Entrenamiento completado exitosamente en {report.get('elapsed_seconds', 0)}s!")
    except Exception as e:
        st.error(f"❌ Error durante el entrenamiento: {e}")

# -----------------------------------------------------------------------------
# HEADER Y MÉTRICAS PRINCIPALES
# -----------------------------------------------------------------------------
st.title("🧪 Laboratorio de Entrenamiento de Gemelos Digitales")
st.markdown(
    "Plataforma de experimentación con **3 algoritmos base** (Random Forest, XGBoost, SVR), "
    "**2 ensambles híbridos** (Stacking y Blending), validación cruzada rigurosa, "
    "**pruebas de hipótesis estadísticas** y destilación a red neuronal **Keras `.h5`**."
)

# Métricas rápidas superiores
col1, col2, col3, col4 = st.columns(4)

dataset_samples = report["dataset"]["n_samples"] if report else n_samples
best_name = report["best_model"]["name"] if report else "Pendiente"
best_r2 = report["best_model"]["metrics"]["R2"] if report else 0.0
best_rmse = report["best_model"]["metrics"]["RMSE"] if report else 0.0

with col1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Tamaño Dataset</div>
        <div class="metric-value">{dataset_samples:,}</div>
        <div class="metric-sub">9 variables agronómicas</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Algoritmos Evaluados</div>
        <div class="metric-value">5 Modelos</div>
        <div class="metric-sub">3 Base + 2 Híbridos</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Modelo Ganador 👑</div>
        <div class="metric-value" style="color: var(--accent-amber);">{best_name}</div>
        <div class="metric-sub">Menor RMSE en prueba</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Precisión R² / RMSE</div>
        <div class="metric-value">{best_r2:.4f}</div>
        <div class="metric-sub">RMSE: {best_rmse:,.1f} kg CO₂e</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# PESTAÑAS PRINCIPALES DEL LABORATORIO
# -----------------------------------------------------------------------------
tab_eda, tab_train, tab_stats, tab_export, tab_sim = st.tabs([
    "📊 1. Exploración y EDA",
    "🚀 2. Entrenamiento y Comparativa",
    "📐 3. Rigor Estadístico",
    "💾 4. Destilación y Descarga .h5",
    "🔮 5. Simulador en Vivo",
])

# =============================================================================
# TAB 1: EDA Y DATASET
# =============================================================================
with tab_eda:
    st.subheader("📊 Análisis Exploratorio de Datos (EDA)")
    st.markdown("Explora las correlaciones físicas, distribución de huella de carbono y dispersión por variables clave.")

    df_eda = load_dataset_for_eda(n_samples=n_samples, seed=seed)

    col_view1, col_view2 = st.columns([2, 1])
    with col_view1:
        st.markdown("##### Vista Previa de Simulaciones de Gemelos Digitales")
        st.dataframe(df_eda.head(15), use_container_width=True, height=350)
    with col_view2:
        st.markdown("##### Resumen Estadístico")
        st.dataframe(df_eda.describe().round(2), use_container_width=True, height=350)

    st.markdown("---")
    st.markdown("##### Visualizaciones de Distribución y Correlación")
    
    row1_col1, row1_col2 = st.columns(2)
    target_dist_img = EDA_DIR / "target_distribution.png"
    corr_pearson_img = EDA_DIR / "correlation_pearson.png"

    with row1_col1:
        if target_dist_img.exists():
            st.image(str(target_dist_img), caption="Distribución de la Huella de Carbono (kg CO₂e)", use_container_width=True)
        else:
            st.info("La gráfica de distribución se generará al entrenar.")

    with row1_col2:
        if corr_pearson_img.exists():
            st.image(str(corr_pearson_img), caption="Matriz de Correlación Lineal (Pearson)", use_container_width=True)
        else:
            st.info("La matriz de correlación se generará al entrenar.")

    row2_col1, row2_col2 = st.columns(2)
    crop_carbon_img = EDA_DIR / "crop_type_carbon.png"
    outliers_img = EDA_DIR / "outliers_target.png"

    with row2_col1:
        if crop_carbon_img.exists():
            st.image(str(crop_carbon_img), caption="Emisión de Carbono por Tipo de Cultivo", use_container_width=True)
    with row2_col2:
        if outliers_img.exists():
            st.image(str(outliers_img), caption="Detección de Valores Atípicos (Outliers)", use_container_width=True)

# =============================================================================
# TAB 2: ENTRENAMIENTO Y COMPARATIVA
# =============================================================================
with tab_train:
    st.subheader("🚀 Comparativa de los 5 Modelos de Machine Learning")
    
    if not report:
        st.warning("⚠️ Todavía no se ha ejecutado ningún entrenamiento. Pulsa el botón de la barra lateral para comenzar.")
    else:
        models_dict = report.get("models", {})
        
        # Construir tabla comparativa
        table_rows = []
        for name, data in models_dict.items():
            tm = data.get("test_metrics", {})
            is_winner = (name == best_name)
            table_rows.append({
                "Modelo": f"👑 {name}" if is_winner else name,
                "Tipo": "Ensamble Híbrido" if name in ["Stacking", "Blending"] else "Algoritmo Base",
                "R² Test": f"{tm.get('R2', 0):.4f}",
                "RMSE Test": f"{tm.get('RMSE', 0):,.2f}",
                "MAE Test": f"{tm.get('MAE', 0):,.2f}",
                "MAPE (%)": f"{tm.get('MAPE', 0):.2f}%",
                "CV-RMSE (Media ± Desv)": f"{data.get('cv_rmse_mean', 0):,.2f} ± {data.get('cv_rmse_std', 0):,.2f}",
            })

        df_comparison = pd.DataFrame(table_rows)
        st.dataframe(df_comparison, use_container_width=True, hide_index=True)

        st.markdown("---")
        st.subheader("📈 Curvas de Ajuste y Diagnóstico")
        
        col_plot1, col_plot2 = st.columns(2)
        model_comp_img = PLOTS_DIR / "model_comparison.png"
        winner_pred_img = PLOTS_DIR / f"{best_name.lower()}_pred_vs_real.png"

        with col_plot1:
            if model_comp_img.exists():
                st.image(str(model_comp_img), caption="Comparación de Métricas entre los 5 Algoritmos", use_container_width=True)
        with col_plot2:
            if winner_pred_img.exists():
                st.image(str(winner_pred_img), caption=f"Predicción vs Realidad ({best_name})", use_container_width=True)

        # Importancia de features
        st.markdown("##### Importancia de Características (Feature Importance)")
        rf_feat_img = PLOTS_DIR / "randomforest_feature_importance.png"
        xgb_feat_img = PLOTS_DIR / "xgboost_feature_importance.png"
        
        c_feat1, c_feat2 = st.columns(2)
        with c_feat1:
            if rf_feat_img.exists():
                st.image(str(rf_feat_img), caption="Importancia de Variables — Random Forest", use_container_width=True)
        with c_feat2:
            if xgb_feat_img.exists():
                st.image(str(xgb_feat_img), caption="Importancia de Variables — XGBoost", use_container_width=True)

        # Hiperparámetros óptimos
        with st.expander("🔍 Ver Hiperparámetros Óptimos Encontrados por RandomizedSearchCV"):
            for m_name, m_data in models_dict.items():
                st.markdown(f"**{m_name}:**")
                st.json(m_data.get("best_params", {}))

# =============================================================================
# TAB 3: RIGOR ESTADÍSTICO
# =============================================================================
with tab_stats:
    st.subheader("📐 Pruebas Estadísticas de Hipótesis y Significancia")
    st.markdown(
        "Para validar con rigor científico que las diferencias de rendimiento entre modelos no se deben al azar, "
        "se ejecutaron las siguientes pruebas no paramétricas y de validación cruzada corregida."
    )

    if not report:
        st.warning("⚠️ Ejecuta el entrenamiento para visualizar el informe estadístico.")
    else:
        st_data = report.get("statistical_tests", {})

        # Test de Friedman
        friedman = st_data.get("friedman_test", {})
        f_p = friedman.get("p_value", 1.0)
        f_sig = friedman.get("significance", "ns")
        f_stat = friedman.get("statistic", 0.0)

        st.markdown(f"""
        <div class="metric-card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: var(--text-primary);">🏆 Test de Friedman (Omnibus No Paramétrico)</h4>
                <span class="badge badge-sig">{f_sig} (p = {f_p:.4e})</span>
            </div>
            <p style="margin-top: 10px; color: var(--text-secondary); line-height: 1.5;">
                Evalúa si existen diferencias globales estadísticamente significativas entre los 5 algoritmos evaluados sobre los 10 folds de validación cruzada.
            </p>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0;">
                <strong>Estadístico Chi-cuadrado:</strong> {f_stat:.4f} &nbsp;|&nbsp;
                <strong>Conclusión:</strong> {'Rechaza H0 con alta significancia' if f_p < 0.05 else 'No rechaza H0'}
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Test de Wilcoxon y Nadeau-Bengio
        col_w, col_nb = st.columns(2)
        
        with col_w:
            st.markdown("##### Wilcoxon Signed-Rank Test (vs Ganador)")
            wilcoxon_dict = st_data.get("wilcoxon_tests", {})
            w_rows = []
            for comp_name, w_info in wilcoxon_dict.items():
                p_v = w_info.get("p_value", 1.0)
                sig = w_info.get("significance", "ns")
                w_rows.append({
                    "Comparación": comp_name,
                    "Estadístico W": round(w_info.get("statistic", 0), 2),
                    "p-value": f"{p_v:.4f}",
                    "Significancia": sig,
                    "Mejor Modelo": w_info.get("better_model", ""),
                })
            st.dataframe(pd.DataFrame(w_rows), use_container_width=True, hide_index=True)

        with col_nb:
            st.markdown("##### Test t Corregido de Nadeau-Bengio")
            nb_dict = st_data.get("nadeau_bengio_tests", {})
            nb_rows = []
            for comp_name, nb_info in nb_dict.items():
                nb_rows.append({
                    "Comparación": comp_name,
                    "t-stat": round(nb_info.get("t_statistic", 0), 3),
                    "p-value": f"{nb_info.get('p_value', 1):.4f}",
                    "Significancia": nb_info.get("significance", "ns"),
                })
            st.dataframe(pd.DataFrame(nb_rows), use_container_width=True, hide_index=True)

        # Bootstrap Confidence Interval
        st.markdown("---")
        b_ci = st_data.get("bootstrap_ci", {})
        st.markdown("##### Intervalo de Confianza Bootstrap 95% (2,000 réplicas)")
        
        ci_c1, ci_c2, ci_c3 = st.columns(3)
        with ci_c1:
            st.metric("RMSE Puntual", f"{b_ci.get('point_rmse', 0):,.2f} kg CO₂e")
        with ci_c2:
            st.metric("Límite Inferior (2.5%)", f"{b_ci.get('ci_lower', 0):,.2f} kg CO₂e")
        with ci_c3:
            st.metric("Límite Superior (97.5%)", f"{b_ci.get('ci_upper', 0):,.2f} kg CO₂e")

        # Tests de Residuos
        st.markdown("---")
        st.markdown("##### Verificación de Supuestos de Residuos")
        c_res1, c_res2 = st.columns(2)
        shapiro = st_data.get("shapiro_wilk", {})
        bp = st_data.get("breusch_pagan", {})
        
        with c_res1:
            st.info(f"**Shapiro-Wilk (Normalidad):** p = {shapiro.get('p_value', 0):.4f} — {shapiro.get('interpretation', '')}")
        with c_res2:
            st.info(f"**Breusch-Pagan (Homocedasticidad):** p = {bp.get('p_value', 0):.4f} — {bp.get('interpretation', '')}")

# =============================================================================
# TAB 4: EXPORTACIÓN Y DESCARGA .H5
# =============================================================================
with tab_export:
    st.subheader("💾 Red Neuronal Destilada y Artefactos de Exportación")
    st.markdown(
        "El modelo ganador fue destilado mediante regresión de conocimiento hacia una **red neuronal profunda Keras Feedforward**, "
        "optimizada para inferencia de baja latencia y exportada en formato nativo **`.h5`**."
    )

    col_card, col_downloads = st.columns([3, 2])

    with col_card:
        st.markdown("##### Ficha Técnica del Modelo (Model Card)")
        if MODEL_CARD_PATH.exists():
            with open(MODEL_CARD_PATH, "r", encoding="utf-8") as f:
                card_data = json.load(f)
            st.json(card_data)
        else:
            st.info("El Model Card estará disponible al entrenar.")

    with col_downloads:
        st.markdown("##### Descargas Directas")
        
        # Botón Descargar best_model.h5
        h5_bytes = read_artifact_bytes(H5_MODEL_PATH)
        if h5_bytes:
            st.download_button(
                label="📥 Descargar best_model.h5 (Keras NN)",
                data=h5_bytes,
                file_name="best_model.h5",
                mime="application/x-hdf5",
                use_container_width=True,
            )
        
        # Botón Descargar best_model_sklearn.pkl
        pkl_bytes = read_artifact_bytes(SKLEARN_MODEL_PATH)
        if pkl_bytes:
            st.download_button(
                label="📥 Descargar best_model_sklearn.pkl",
                data=pkl_bytes,
                file_name="best_model_sklearn.pkl",
                mime="application/octet-stream",
                use_container_width=True,
            )

        # Botón Descargar preprocessor.pkl
        prep_bytes = read_artifact_bytes(PREPROCESSOR_PATH)
        if prep_bytes:
            st.download_button(
                label="📥 Descargar preprocessor.pkl",
                data=prep_bytes,
                file_name="preprocessor.pkl",
                mime="application/octet-stream",
                use_container_width=True,
            )

        # Botón Descargar ml_report.json
        if report:
            st.download_button(
                label="📄 Descargar Informe ml_report.json",
                data=json.dumps(report, indent=2),
                file_name="ml_report.json",
                mime="application/json",
                use_container_width=True,
            )

# =============================================================================
# TAB 5: SIMULADOR DE INFERENCIA EN TIEMPO REAL
# =============================================================================
with tab_sim:
    st.subheader("🔮 Simulador de Inferencia de Gemelo Digital")
    st.markdown("Ingresa los parámetros operativos de la parcela o invernadero para calcular la huella de carbono estimada.")

    preprocessor, model = load_inference_pipeline()

    if preprocessor is None or model is None:
        st.warning("⚠️ Los artefactos de inferencia no se encuentran. Ejecuta el entrenamiento primero.")
    else:
        with st.form("inference_form"):
            f_col1, f_col2, f_col3 = st.columns(3)

            with f_col1:
                in_crop = st.selectbox("Tipo de cultivo", ["wheat", "corn", "soy", "rice", "tomato"], index=1)
                in_sensors = st.slider("Cantidad de sensores IoT", 2, 50, 24)
                in_edges = st.slider("Dispositivos Edge Gateway", 1, 10, 3)

            with f_col2:
                in_cloud_intensity = st.slider("Intensidad de carbono región cloud (kgCO₂e/kWh)", 0.05, 0.90, 0.45, 0.01)
                in_data_vol = st.slider("Volumen de datos diario (GB/día)", 0.1, 100.0, 18.5, 0.5)
                in_freq = st.slider("Frecuencia de telemetría (Hz)", 0.01, 10.0, 1.0, 0.05)

            with f_col3:
                in_res = st.slider("Resolución del modelo 3D (0.1 a 1.0)", 0.1, 1.0, 0.8, 0.05)
                in_days = st.slider("Días de operación en el ciclo", 30, 365, 180)
                in_solar = st.checkbox("¿Cuenta con energía solar fotovoltaica propia?", value=False)

            predict_btn = st.form_submit_button("⚡ Calcular Huella de Carbono del Gemelo Digital", use_container_width=True)

        if predict_btn:
            sample_input = {
                "sensor_count": int(in_sensors),
                "edge_count": int(in_edges),
                "cloud_region_intensity": float(in_cloud_intensity),
                "data_volume_gb_day": float(in_data_vol),
                "transmission_freq_hz": float(in_freq),
                "model_resolution": float(in_res),
                "crop_type": in_crop,
                "operation_days": int(in_days),
                "solar_powered": 1 if in_solar else 0,
            }

            try:
                predicted_val = predict_carbon(preprocessor, model, sample_input)
                
                # Equivalencias
                trees_needed = int(round(predicted_val / 22.0))  # 1 árbol absorbe aprox 22 kg CO2 al año
                km_car = int(round(predicted_val * 4.5))         # ~0.22 kg CO2 por km

                st.markdown(f"""
                <div class="metric-card" style="background: var(--sim-bg); border-color: var(--sim-border); margin-top: 20px;">
                    <div class="metric-title" style="color: var(--sim-value);">Huella de Carbono Total Estimada</div>
                    <div class="metric-value" style="color: var(--sim-value); font-size: 2.5rem;">{predicted_val:,.2f} kg CO₂e</div>
                    <div style="margin-top: 14px; display: flex; gap: 24px; color: var(--sim-meta); font-size: 0.95rem; flex-wrap: wrap;">
                        <span>🌳 <strong>{trees_needed:,}</strong> árboles/año para compensar</span>
                        <span>🚗 Equivalente a <strong>{km_car:,}</strong> km conducidos en auto térmico</span>
                        <span>☀️ {'Reducción ~35% aplicada por energía solar' if in_solar else 'Sin energía solar activa'}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            except Exception as e:
                st.error(f"Error al calcular la predicción: {e}")
