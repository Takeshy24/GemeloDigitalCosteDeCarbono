from pathlib import Path
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from copy import deepcopy

SOURCE = Path(r"C:\Users\USER\Downloads\Articulo_AP9_corregido_para_revision.docx")
OUT = Path("documentacion/Articulo_AP9_mejorado_revision.docx")
OUT.parent.mkdir(exist_ok=True)

doc = Document(SOURCE)

def replace_paragraph(paragraph, text):
    paragraph.clear()
    paragraph.add_run(text)

for p in doc.paragraphs:
    if p.text.startswith("Tabla 1. Factores de emisión"):
        replace_paragraph(p, "Tabla 1. Factores por defecto empleados en el motor de ACV de AP-9")
    if "La versión final debe incluir en el repositorio" in p.text:
        replace_paragraph(p, "Se evaluaron Random Forest, XGBoost y SVR, además de Stacking y Blending construidos a partir de los modelos base. El preprocesamiento usa un ColumnTransformer con estandarización de variables numéricas y codificación one-hot de cultivo. La partición fue 80/20 (2000/500 registros), estratificada solo por la semilla 42; el conjunto de prueba permaneció reservado. La selección de hiperparámetros se realizó mediante RandomizedSearchCV de cinco folds sobre entrenamiento y la evaluación final empleó diez folds. Los hiperparámetros seleccionados, versiones, commit y comandos se incluyen en el Apéndice A y en el material suplementario.")
    if p.text.startswith("Disponibilidad de materiales."):
        replace_paragraph(p, "Disponibilidad de materiales. El paquete suplementario de evaluación acompaña este manuscrito e incluye el código de AP-9, scripts de ejecución, configuración de escenarios, dataset_sintetico_semilla42.csv, resultados CSV, figuras, hiperparámetros y metadatos de reproducibilidad. El identificador del commit evaluado es cefeeef88af6115fffc624a09eb375595d6a5b208. Antes de una publicación externa, los autores deberán depositar el mismo paquete en un repositorio público o anónimo con licencia explícita y añadir la URL persistente.")

# The original compact factor table is retained to avoid creating an unreadable
# four-column layout in the two-column manuscript. Provenance is documented in Appendix A.

# Append explicit reproducibility appendix.
doc.add_heading("Apéndice A Material suplementario y reproducibilidad", level=1)
doc.add_paragraph("Este apéndice especifica los elementos necesarios para repetir el experimento y delimita el alcance de sus resultados. Los archivos señalados se entregan en el paquete suplementario resultados_experimento.")

doc.add_heading("A.1 Entorno y procedimiento", level=2)
env = doc.add_table(rows=1, cols=2); env.alignment = WD_TABLE_ALIGNMENT.CENTER; env.style = "Table Grid"
env.autofit = False
for c, text in zip(env.rows[0].cells, ["Elemento", "Configuración evaluada"]): c.text = text
for a,b in [
    ("Sistema operativo", "Windows 10 10.0.26200 SP0"), ("Semilla", "42 en Python, NumPy, scikit-learn y XGBoost"),
    ("Python", "3.11.0"), ("Node.js", "20.19.4"), ("Commit", "cefeef88af6115fffc624a09eb375595d6a5b208"),
    ("Horizonte", "3 años; maíz; 10 ha; 30 sensores"), ("ML", "2500 registros sintéticos; entrenamiento/prueba 80/20; búsqueda 5 folds; evaluación 10 folds"),
    ("Bootstrap", "2000 réplicas; nivel de significancia alpha = 0.05"),
]:
    cells=env.add_row().cells; cells[0].text=a; cells[1].text=b
for row in env.rows:
    row.cells[0].width = Inches(0.9)
    row.cells[1].width = Inches(2.4)

commands = doc.add_paragraph()
commands.alignment = WD_ALIGN_PARAGRAPH.LEFT
commands_run = commands.add_run(
    "Comandos de reproducción:\n"
    "1. npx tsx scripts/run-experiment-lca.ts resultados_experimento\n"
    "2. py -3.11 scripts/run_experiment_ml.py\n"
    "3. py -3.11 scripts/build_experiment_outputs.py"
)
commands_run.font.size = Pt(8)

doc.add_heading("A.2 Hiperparámetros finales", level=2)
hp = doc.add_table(rows=1, cols=2); hp.alignment=WD_TABLE_ALIGNMENT.CENTER; hp.style="Table Grid"
hp.autofit = False
for c,t in zip(hp.rows[0].cells,["Modelo","Configuración seleccionada"]): c.text=t
for a,b in [
    ("Random Forest","n_estimators=200; max_depth=30; max_features=log2; min_samples_split=2; min_samples_leaf=1"),
    ("XGBoost","n_estimators=500; max_depth=4; learning_rate=0.1; subsample=0.8; colsample_bytree=0.8; reg_alpha=0.5; reg_lambda=2.0"),
    ("SVR","kernel=rbf; C=500; epsilon=0.01; gamma=auto"),
    ("Stacking","final_estimator Ridge; alpha=100; base estimators RF, XGBoost y SVR"),
    ("Blending","weights RF=0.4; XGBoost=0.5; SVR=0.1"),
]:
    cells=hp.add_row().cells; cells[0].text=a; cells[1].text=b
for row in hp.rows:
    row.cells[0].width = Inches(0.9)
    row.cells[1].width = Inches(2.4)

doc.add_heading("A.3 Trazabilidad de factores y alcance", level=2)
doc.add_paragraph("El registro de factores incluido en el material suplementario conserva la procedencia declarada para cada factor; la Tabla 1 resume los valores empleados. Los factores del registro de AP-9 están explícitamente marcados como demostrativos. Por tanto, los resultados se interpretan como una evaluación reproducible del comportamiento del motor y de decisiones relativas entre arquitecturas, no como un inventario certificado de una explotación real. No se ejecutó Monte Carlo porque el registro no proporciona distribuciones ni rangos de incertidumbre validados; no se introdujeron distribuciones supuestas.")

doc.add_heading("A.4 Material suplementario entregado", level=2)
doc.add_paragraph("El paquete incluye: 00_reporte_ejecucion.md; 01_configuracion_escenarios.csv; 02_validacion_motor_lca.csv; 03_resultados_arquitecturas.csv; 04_desglose_capas_etapas.csv; 07_analisis_sensibilidad.csv; 08_metricas_modelos.csv; 09_metricas_por_fold.csv; 10_pruebas_estadisticas.csv; 11_importancia_variables.csv; 12_hiperparametros.json; 13_metadatos_reproducibilidad.json; 14_limitaciones.md y 15_verificacion_reproducibilidad.json. Una segunda ejecución con la misma semilla reprodujo los totales LCA y las métricas ML.")

doc.add_heading("A.5 Consideraciones responsables de IA", level=2)
doc.add_paragraph("El conjunto para aprendizaje automático es sintético y no contiene datos personales ni atributos protegidos. El riesgo principal no es la discriminación sobre personas, sino la extrapolación indebida: el modelo aprende relaciones del generador implementado y no debe utilizarse para inferir emisiones agrícolas reales sin calibración externa. La revisión humana verificó los parámetros, las métricas y los resultados exportados.")

for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for para in cell.paragraphs:
                para.paragraph_format.space_after = Pt(2)
                for run in para.runs: run.font.name = 'Arial'

doc.core_properties.title = "AP 9 Evaluación reproducible de la huella de carbono de gemelos digitales agrícolas"
doc.save(OUT)
print(OUT.resolve())
