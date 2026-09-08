import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  Settings,
  Sparkles,
  FileCheck,
  Table,
  Layers,
  Activity,
  Award
} from 'lucide-react';
import {
  Project,
  ProjectCarbonAssessment,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  EmissionFactor,
  Scenario,
  AIRecommendation,
  ReportConfig
} from '../types';
import { ReportExportService } from '../services/exportService';

interface ReportsModuleProps {
  project: Project;
  assessment: ProjectCarbonAssessment;
  sensors: IoTSensor[];
  edgeDevices: EdgeDevice[];
  cloudResources: CloudResource[];
  digitalTwins: DigitalTwin[];
  emissionFactors: EmissionFactor[];
  scenarios: Scenario[];
  aiRecommendations: AIRecommendation[];
  currentUser: string;
  onExport?: (format: 'PDF' | 'DOCX' | 'XLSX') => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  project,
  assessment,
  sensors,
  edgeDevices,
  cloudResources,
  digitalTwins,
  emissionFactors,
  scenarios,
  aiRecommendations,
  currentUser,
  onExport
}) => {
  const [config, setConfig] = useState<ReportConfig>({
    includeSensors: true,
    includeEdge: true,
    includeCloud: true,
    includeDigitalTwins: true,
    includeLCAStages: true,
    includeScenarios: true,
    includeAIRecommendations: true,
    reportTitle: `Informe de Sostenibilidad y Coste de Carbono - ${project.name}`,
    reportAuthor: currentUser || 'Dr. Carlos Mendoza (Auditor LCA)',
    organizationName: 'Instituto de Agricultura Sostenible y Gemelos Digitales (IAS)',
    customNotes: 'Evaluación realizada bajo estándares ISO 14040/14044 y GHG Protocol para infraestructura digital en agricultura de regadío.'
  });

  const [generatingFormat, setGeneratingFormat] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExportPDF = () => {
    try {
      setGeneratingFormat('PDF');
      ReportExportService.exportPDF(
        project,
        assessment,
        sensors,
        edgeDevices,
        cloudResources,
        digitalTwins,
        scenarios,
        aiRecommendations,
        config
      );
      onExport?.('PDF');
      setSuccessMessage('¡Informe PDF generado y descargado con éxito!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert('Error generando PDF: ' + e.message);
    } finally {
      setGeneratingFormat(null);
    }
  };

  const handleExportWord = async () => {
    try {
      setGeneratingFormat('DOCX');
      await ReportExportService.exportWord(
        project,
        assessment,
        sensors,
        edgeDevices,
        cloudResources,
        digitalTwins,
        scenarios,
        aiRecommendations,
        config
      );
      onExport?.('DOCX');
      setSuccessMessage('¡Documento Word (.docx) generado y descargado!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert('Error generando Word: ' + e.message);
    } finally {
      setGeneratingFormat(null);
    }
  };

  const handleExportExcel = () => {
    try {
      setGeneratingFormat('XLSX');
      ReportExportService.exportExcel(
        project,
        assessment,
        sensors,
        edgeDevices,
        cloudResources,
        digitalTwins,
        emissionFactors,
        scenarios,
        config
      );
      onExport?.('XLSX');
      setSuccessMessage('¡Libro de cálculo Excel (.xlsx) con 7 hojas generado con éxito!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert('Error generando Excel: ' + e.message);
    } finally {
      setGeneratingFormat(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Generador de Informes y Exportación Multiformato</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Descarga informes ejecutivos en PDF de alta calidad, documentos editables en Word (.docx) y matrices completas en Excel (.xlsx).
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid de Formatos de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tarjeta PDF */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Informe Ejecutivo en PDF
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Documento formal con membrete, tablas formateadas, desglose por etapas LCA ISO 14040, comparación de escenarios y recomendaciones de IA.
            </p>
            <ul className="mt-3 text-[11px] text-slate-600 space-y-1">
              <li>✓ Portada institucional con datos del proyecto</li>
              <li>✓ Tabla de indicadores clave de sostenibilidad</li>
              <li>✓ Matriz completa de ciclo de vida (6 fases)</li>
              <li>✓ Paginación y notas científicas normalizadas</li>
            </ul>
          </div>

          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            disabled={generatingFormat === 'PDF'}
            className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generatingFormat === 'PDF' ? 'Generando PDF...' : 'Descargar Informe PDF'}</span>
          </button>
        </div>

        {/* Tarjeta Word */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Documento Técnico Word (.docx)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Informe editable con estructura de encabezados, tablas de datos, texto descriptivo y conclusiones listo para memorias técnicas o tesis.
            </p>
            <ul className="mt-3 text-[11px] text-slate-600 space-y-1">
              <li>✓ Totalmente editable en Microsoft Word o LibreOffice</li>
              <li>✓ Formato nativo XML (.docx) compatible</li>
              <li>✓ Secciones de metodología y recomendaciones</li>
              <li>✓ Ideal para integración en memorias de proyectos</li>
            </ul>
          </div>

          <button
            id="btn-export-word"
            onClick={handleExportWord}
            disabled={generatingFormat === 'DOCX'}
            className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generatingFormat === 'DOCX' ? 'Generando Word...' : 'Descargar Word (.docx)'}</span>
          </button>
        </div>

        {/* Tarjeta Excel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Matriz de Cálculo Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Libro multidimensional con 7 hojas de trabajo: Resumen KPIs, Sensores, Edge, Cloud, Gemelos Digitales, Factores de Emisión y Escenarios.
            </p>
            <ul className="mt-3 text-[11px] text-slate-600 space-y-1">
              <li>✓ 7 hojas independientes estructuradas</li>
              <li>✓ Inventario completo de hardware y consumos</li>
              <li>✓ Factores de emisión con fuentes bibliográficas</li>
              <li>✓ Facilidad para análisis estadístico y auditoría</li>
            </ul>
          </div>

          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            disabled={generatingFormat === 'XLSX'}
            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generatingFormat === 'XLSX' ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Configuración de Parámetros del Informe */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-sm">
            Personalizar Metadatos del Informe
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Título del Informe</label>
            <input
              type="text"
              value={config.reportTitle}
              onChange={(e) => setConfig({ ...config, reportTitle: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Autor / Auditor Principal</label>
            <input
              type="text"
              value={config.reportAuthor}
              onChange={(e) => setConfig({ ...config, reportAuthor: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Organización / Centro de Investigación</label>
            <input
              type="text"
              value={config.organizationName}
              onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notas Metodológicas Adicionales</label>
            <input
              type="text"
              value={config.customNotes}
              onChange={(e) => setConfig({ ...config, customNotes: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeSensors}
              onChange={(e) => setConfig({ ...config, includeSensors: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir Sensores IoT</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeLCAStages}
              onChange={(e) => setConfig({ ...config, includeLCAStages: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir etapas del ciclo de vida</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeEdge}
              onChange={(e) => setConfig({ ...config, includeEdge: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir Nodos Edge</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeCloud}
              onChange={(e) => setConfig({ ...config, includeCloud: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir Recursos Cloud</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeDigitalTwins}
              onChange={(e) => setConfig({ ...config, includeDigitalTwins: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir Gemelos Digitales</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeAIRecommendations}
              onChange={(e) => setConfig({ ...config, includeAIRecommendations: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Incluir Recomendaciones de IA</span>
          </label>
        </div>
      </div>
    </div>
  );
};
