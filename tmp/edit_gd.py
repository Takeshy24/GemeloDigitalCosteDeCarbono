from __future__ import annotations

import json
from pathlib import Path
from copy import deepcopy

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(r"C:\Users\TAKESHY\SOFTWAREII\ap-9_-análisis-de-coste-de-carbono-de-gemelos-digitales")
SOURCE = Path(r"C:\Users\USER\Downloads\GD.docx")
OUTPUT = ROOT / "GD_actualizado.docx"
ART = ROOT / "backend" / "ml_artifacts"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_borders(cell, color="D9D9D9", size="6") -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def format_table(table) -> None:
    table.style = "Table Grid"
    for r, row in enumerate(table.rows):
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_borders(cell)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2)
                for run in p.runs:
                    run.font.name = "Aptos"
                    run.font.size = Pt(9)
                    if r == 0:
                        run.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
        if r == 0:
            for cell in row.cells:
                set_cell_shading(cell, "1F4E78")
        elif r % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, "F2F6FA")


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.space_before = Pt(10 if level == 1 else 6)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p


def add_body(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="Normal")
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.08
    if bold_prefix and text.startswith(bold_prefix):
        p.add_run(bold_prefix).bold = True
        p.add_run(text[len(bold_prefix):])
    else:
        p.add_run(text)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(2)
    p.add_run(text)
    return p


def add_figure(doc, path: Path, caption: str, width=6.2):
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(str(path), width=Inches(width))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(6)
    r = cap.add_run(caption)
    r.italic = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(89, 89, 89)


def move_before(nodes, anchor):
    for node in nodes:
        anchor.addprevious(node)


def main():
    report = json.loads((ART / "ml_report.json").read_text(encoding="utf-8"))
    meta = report["dataset"].get("metadata", {})
    doc = Document(str(SOURCE))

    # Consistent typography for the inserted report section.
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    for style_name in ("Title", "Heading 1", "Heading 2", "Heading 3"):
        style = doc.styles[style_name]
        style.font.name = "Aptos Display" if style_name == "Title" else "Aptos"
        style.font.color.rgb = RGBColor(0, 0, 0)

    original_anchor = doc.paragraphs[5]._p
    new_nodes = []

    def capture_before(func):
        before = set(id(x._element) for x in doc.paragraphs) | set(id(x._element) for x in doc.tables)
        func()
        for child in list(doc.element.body):
            if id(child) not in before and child.tag in {qn("w:p"), qn("w:tbl")}:
                new_nodes.append(child)

    def build_section():
        p = doc.add_paragraph(style="Title")
        p.paragraph_format.space_after = Pt(4)
        p.add_run("Informe de mejoras del laboratorio de Machine Learning")
        sub = doc.add_paragraph()
        sub.paragraph_format.space_after = Pt(10)
        r = sub.add_run("Análisis de coste de carbono de gemelos digitales")
        r.bold = True
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(31, 78, 121)

        add_body(doc, "Esta sección documenta la versión actualizada del motor Python con Streamlit. Integra el dataset real seleccionado, la metodología CRISP-DM, la evaluación comparativa de modelos, la validación cruzada, las pruebas estadísticas y la explicabilidad de las predicciones.")
        add_body(doc, "Resultado principal: el modelo SVR fue seleccionado por presentar el menor RMSE medio en validación cruzada. La aplicación muestra las figuras, tablas e interpretaciones en pantalla y permite descargar los reportes generados.", bold_prefix="Resultado principal:")

        add_heading(doc, "Fuente de datos y trazabilidad", 1)
        add_body(doc, f"Se utilizó el dataset real preparado en backend/ml_artifacts/real_dataset.csv, con {report['dataset']['n_samples']:,} registros y {report['dataset']['n_features']} variables predictoras. El objetivo es total_co2e_kg, expresado en kg CO₂e.")
        sources = meta.get("data_sources", {})
        source_table = doc.add_table(rows=1, cols=2)
        source_table.rows[0].cells[0].text = "Componente"
        source_table.rows[0].cells[1].text = "Fuente o criterio documentado"
        for label, data in [
            ("Intensidad eléctrica", sources.get("electricity_carbon_intensity", {}).get("source", "Our World in Data / Ember Climate")),
            ("Telemetría agrícola", sources.get("crop_and_soil_telemetry", {}).get("source", "Precision Agriculture Field Crop Dataset")),
            ("Contabilidad de carbono", sources.get("carbon_accounting_standard", {}).get("methodology", "GSF SCI y Cloud Carbon Footprint")),
        ]:
            cells = source_table.add_row().cells
            cells[0].text = label
            cells[1].text = data
        format_table(source_table)

        add_heading(doc, "Flujo CRISP DM implementado", 1)
        stages = [
            ("1. EDA", "Distribuciones, estadísticas descriptivas, correlaciones Pearson y Spearman, outliers, dispersión y diferencias por cultivo."),
            ("2. Entrenamientos", "Random Forest, XGBoost, SVR, Stacking y Blending con preprocesamiento reproducible y búsqueda de hiperparámetros."),
            ("3. Mejor modelo", "Selección basada en el menor CV-RMSE medio, no únicamente en un único resultado de prueba."),
            ("4. Validación cruzada", f"K-Fold estratificado por semilla reproducible; se conservaron los scores de cada fold para evaluar estabilidad."),
            ("5. Pruebas estadísticas", "Friedman, Wilcoxon post-hoc, t pareado corregido de Nadeau-Bengio, bootstrap, Shapiro-Wilk y Breusch-Pagan."),
            ("6. Reportes", "Reporte JSON, reporte Markdown CRISP-DM, tablas CSV, figuras EDA, comparación de modelos y explicación por permutación."),
        ]
        crisp_table = doc.add_table(rows=1, cols=2)
        crisp_table.rows[0].cells[0].text = "Etapa"
        crisp_table.rows[0].cells[1].text = "Implementación y evidencia"
        for stage, desc in stages:
            cells = crisp_table.add_row().cells
            cells[0].text = stage
            cells[1].text = desc
        format_table(crisp_table)

        add_heading(doc, "Resultados de los entrenamientos", 1)
        best = report["best_model"]
        add_body(doc, f"El modelo ganador fue {best['name']}. Sus métricas en el conjunto de prueba fueron RMSE = {best['metrics']['RMSE']:.4f} kg CO₂e, MAE = {best['metrics']['MAE']:.4f} kg CO₂e, R² = {best['metrics']['R2']:.4f} y MAPE = {best['metrics']['MAPE']:.2f}%.", bold_prefix="El modelo ganador fue")
        model_table = doc.add_table(rows=1, cols=6)
        for cell, text in zip(model_table.rows[0].cells, ["Modelo", "RMSE test", "MAE test", "R²", "CV-RMSE media", "CV-RMSE sd"]):
            cell.text = text
        for name, data in report["models"].items():
            cells = model_table.add_row().cells
            metrics = data["test_metrics"]
            values = [name, f"{metrics['RMSE']:.4f}", f"{metrics['MAE']:.4f}", f"{metrics['R2']:.4f}", f"{data['cv_rmse_mean']:.4f}", f"{data['cv_rmse_std']:.4f}"]
            for cell, value in zip(cells, values):
                cell.text = value
        format_table(model_table)
        add_figure(doc, ART / "plots" / "model_comparison.png", "Figura 1. Comparación de métricas de los cinco modelos evaluados.")

        add_heading(doc, "Validación cruzada y pruebas estadísticas", 1)
        add_body(doc, "La validación cruzada conserva los scores de cada fold para mostrar la variabilidad del error. El criterio de selección es el promedio de CV-RMSE y su desviación estándar permite valorar estabilidad.")
        stats = report.get("statistical_tests", {})
        friedman = stats.get("friedman", {})
        bootstrap = stats.get("bootstrap_ci", {})
        shapiro = stats.get("shapiro_wilk", {})
        bp = stats.get("breusch_pagan", {})
        stat_table = doc.add_table(rows=1, cols=3)
        for cell, text in zip(stat_table.rows[0].cells, ["Prueba", "Resultado", "Interpretación"]):
            cell.text = text
        rows = [
            ("Friedman", f"χ² = {friedman.get('statistic', 0):.4f}; p = {friedman.get('p_value', 0):.4f}", friedman.get("interpretation", "")),
            ("Bootstrap RMSE", f"IC {bootstrap.get('confidence_level', '95%')}: [{bootstrap.get('ci_lower', 0):.4f}, {bootstrap.get('ci_upper', 0):.4f}]", bootstrap.get("interpretation", "")),
            ("Shapiro-Wilk", f"W = {shapiro.get('statistic', 0):.4f}; p = {shapiro.get('p_value', 0):.4f}", shapiro.get("interpretation", "")),
            ("Breusch-Pagan", f"LM = {bp.get('lm_statistic', 0):.4f}; p = {bp.get('p_value', 0):.4f}", bp.get("interpretation", "")),
        ]
        for label, result, interpretation in rows:
            cells = stat_table.add_row().cells
            cells[0].text, cells[1].text, cells[2].text = label, result, interpretation
        format_table(stat_table)
        add_body(doc, "Interpretación metodológica: los resultados estadísticos deben leerse junto con los intervalos de bootstrap y la dispersión por fold. En particular, un p-value significativo indica evidencia de diferencias o incumplimiento de un supuesto, pero no prueba causalidad.")
        add_figure(doc, ART / "plots" / "bootstrap_ci.png", "Figura 2. Intervalo bootstrap del RMSE del modelo ganador.")
        add_figure(doc, ART / "plots" / "residuals_qq.png", "Figura 3. Diagnóstico Q-Q de los residuales del modelo ganador.")

        add_heading(doc, "Interpretabilidad y explicabilidad", 1)
        add_body(doc, "La importancia por permutación se calculó sobre el conjunto de prueba. Indica cuánto empeora el score RMSE cuando se rompe aleatoriamente la relación de una variable con el objetivo. Es una explicación global del comportamiento del modelo y no debe interpretarse como causalidad.")
        explain_table = doc.add_table(rows=1, cols=3)
        for cell, text in zip(explain_table.rows[0].cells, ["Variable transformada", "Importancia media", "Desviación"]):
            cell.text = text
        for item in best.get("explainability", [])[:10]:
            cells = explain_table.add_row().cells
            cells[0].text = item["feature"]
            cells[1].text = f"{item['importance_mean']:.4f}"
            cells[2].text = f"{item['importance_std']:.4f}"
        format_table(explain_table)
        add_figure(doc, ART / "plots" / "winner_permutation_importance.png", "Figura 4. Importancia global por permutación del modelo ganador.")

        add_heading(doc, "Artefactos reproducibles y ejecución", 1)
        for item in [
            "backend/ml_artifacts/ml_report.json: resultados estructurados del pipeline.",
            "backend/ml_artifacts/crisp_dm_report.md: reporte consolidado para entrega.",
            "backend/ml_artifacts/statistical_report.md y statistical_tests.json: pruebas estadísticas.",
            "backend/ml_artifacts/permutation_importance.csv: explicación tabular del modelo ganador.",
            "backend/ml_artifacts/plots/: figuras EDA, comparación, validación y explicabilidad.",
            "backend/ml_artifacts/best_model_sklearn.pkl y best_model.h5: artefactos de inferencia.",
        ]:
            add_bullet(doc, item)
        add_body(doc, "Para iniciar la interfaz: npm run ml:lab. La configuración por defecto utiliza el dataset real; la barra lateral permite seleccionar el dataset sintético únicamente para pruebas reproducibles.")

    capture_before(build_section)
    move_before(new_nodes, original_anchor)
    doc.save(str(OUTPUT))
    print(OUTPUT)


if __name__ == "__main__":
    main()
