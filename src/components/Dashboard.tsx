import React from 'react';
import {
  Cloud,
  Cpu,
  Server,
  Layers,
  Zap,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Info,
  Globe,
  Award
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Project,
  ProjectCarbonAssessment,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  Scenario
} from '../types';

interface DashboardProps {
  project: Project;
  assessment: ProjectCarbonAssessment;
  sensors: IoTSensor[];
  edgeDevices: EdgeDevice[];
  cloudResources: CloudResource[];
  digitalTwins: DigitalTwin[];
  scenarios: Scenario[];
  onNavigateToTab: (tabName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  project,
  assessment,
  sensors,
  edgeDevices,
  cloudResources,
  digitalTwins,
  scenarios,
  onNavigateToTab
}) => {
  // Datos para Gráfico Circular: Emisiones por Categoría
  const categoryData = [
    { name: 'Sensores IoT', value: assessment.byCategory.sensors.totalKgCO2e, color: '#10b981' },
    { name: 'Dispositivos Edge', value: assessment.byCategory.edge.totalKgCO2e, color: '#06b6d4' },
    { name: 'Infraestructura Cloud', value: assessment.byCategory.cloud.totalKgCO2e, color: '#3b82f6' },
    { name: 'Gemelos Digitales (DT)', value: assessment.byCategory.digitalTwins.totalKgCO2e, color: '#8b5cf6' },
    { name: 'Red & Comunicaciones', value: assessment.byCategory.network.totalKgCO2e, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Datos para Gráfico de Barras: Etapas del Ciclo de Vida (LCA)
  const lcaStagesData = [
    { etapa: 'Fabricación', kgCO2e: assessment.byLifeCycleStage.manufacturingKgCO2e, fill: '#3b82f6' },
    { etapa: 'Transporte', kgCO2e: assessment.byLifeCycleStage.transportKgCO2e, fill: '#06b6d4' },
    { etapa: 'Instalación', kgCO2e: assessment.byLifeCycleStage.installationKgCO2e, fill: '#8b5cf6' },
    { etapa: 'Operación', kgCO2e: assessment.byLifeCycleStage.operationKgCO2e, fill: '#ef4444' },
    { etapa: 'Mantenimiento', kgCO2e: assessment.byLifeCycleStage.maintenanceKgCO2e, fill: '#f59e0b' },
    { etapa: 'Fin de Vida (WEEE)', kgCO2e: assessment.byLifeCycleStage.endOfLifeKgCO2e, fill: '#10b981' }
  ];

  // Datos para Evolución Temporal (Proyección a 36 meses)
  const timelineData = [
    { mes: 'M0 (Fab)', acumuladoKg: assessment.byLifeCycleStage.manufacturingKgCO2e + assessment.byLifeCycleStage.installationKgCO2e, operativoKg: 0 },
    { mes: 'M6', acumuladoKg: (assessment.byLifeCycleStage.manufacturingKgCO2e) + (assessment.byLifeCycleStage.operationKgCO2e * 0.16), operativoKg: assessment.byLifeCycleStage.operationKgCO2e * 0.16 },
    { mes: 'M12', acumuladoKg: (assessment.byLifeCycleStage.manufacturingKgCO2e) + (assessment.byLifeCycleStage.operationKgCO2e * 0.33), operativoKg: assessment.byLifeCycleStage.operationKgCO2e * 0.33 },
    { mes: 'M18', acumuladoKg: (assessment.byLifeCycleStage.manufacturingKgCO2e) + (assessment.byLifeCycleStage.operationKgCO2e * 0.50), operativoKg: assessment.byLifeCycleStage.operationKgCO2e * 0.50 },
    { mes: 'M24', acumuladoKg: (assessment.byLifeCycleStage.manufacturingKgCO2e) + (assessment.byLifeCycleStage.operationKgCO2e * 0.66), operativoKg: assessment.byLifeCycleStage.operationKgCO2e * 0.66 },
    { mes: 'M30', acumuladoKg: (assessment.byLifeCycleStage.manufacturingKgCO2e) + (assessment.byLifeCycleStage.operationKgCO2e * 0.83), operativoKg: assessment.byLifeCycleStage.operationKgCO2e * 0.83 },
    { mes: 'M36 (EoL)', acumuladoKg: assessment.totalEmissionsKgCO2e, operativoKg: assessment.byLifeCycleStage.operationKgCO2e }
  ];

  // Datos para Comparación de Escenarios
  const scenarioChartData = scenarios.map(s => ({
    nombre: s.name.split(':')[0],
    carbono: s.estimatedTotalKgCO2e,
    energia: s.estimatedEnergyKWh,
    coste: s.costEstimateUSD
  }));

  const totalSensorUnits = sensors.reduce((acc, s) => acc + s.quantity, 0);
  const totalEdgeUnits = edgeDevices.reduce((acc, e) => acc + e.quantity, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner de Bienvenida y Proyecto */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-xl p-6 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluación de Ciclo de Vida Conforme a ISO 14040/44</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {project.name}
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('reports')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Generar Informe Oficial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Huella Total */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Huella Total de Carbono
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {assessment.totalEmissionsKgCO2e.toLocaleString('es-ES')}
              </span>
              <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Equivalente a <strong className="text-slate-700">{assessment.totalEmissionsTonnesCO2e.toFixed(3)} t CO₂e</strong> en {assessment.analysisPeriodYears} años
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Por hectárea:</span>
            <span className="font-bold text-emerald-700">{assessment.emissionsPerHectareKgCO2e.toFixed(2)} kg CO₂e/ha</span>
          </div>
        </div>

        {/* KPI 2: Consumo Energético */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Consumo Energético Total
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {assessment.totalEnergyConsumptionKWh.toLocaleString('es-ES')}
              </span>
              <span className="text-xs font-bold text-slate-500">kWh</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Consumo medio: <strong className="text-slate-700">{(assessment.totalEnergyConsumptionKWh / (assessment.analysisPeriodYears * 365)).toFixed(1)} kWh/día</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Fase Operación:</span>
            <span className="font-bold text-amber-700">{assessment.keyInsights.operationSharePercent}% del impacto</span>
          </div>
        </div>

        {/* KPI 3: Activos IoT y Edge */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Infraestructura Física
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {totalSensorUnits + totalEdgeUnits}
              </span>
              <span className="text-xs font-bold text-slate-500">Dispositivos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-slate-700">{totalSensorUnits}</strong> sensores IoT + <strong className="text-slate-700">{totalEdgeUnits}</strong> nodos Edge
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Huella Fabricación:</span>
            <span className="font-bold text-cyan-700">{assessment.byLifeCycleStage.manufacturingKgCO2e.toFixed(1)} kg CO₂e</span>
          </div>
        </div>

        {/* KPI 4: Gemelos Digitales & Cloud */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gemelos Digitales (DT)
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {digitalTwins.length}
              </span>
              <span className="text-xs font-bold text-slate-500">Modelos Activos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Recursos Cloud asociados: <strong className="text-slate-700">{cloudResources.length} instancias</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sobrecarga Cómputo DT:</span>
            <span className="font-bold text-indigo-700">{assessment.byCategory.digitalTwins.totalKgCO2e.toFixed(1)} kg CO₂e</span>
          </div>
        </div>
      </div>

      {/* Fila 2: Gráficos Principales (Distribución y Ciclo de Vida) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Emisiones por Categoría Tecnológica */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Emisiones por Categoría Tecnológica</span>
              </h3>
              <span className="text-[11px] text-slate-400">Total: {assessment.totalEmissionsKgCO2e.toFixed(1)} kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Distribución de la huella entre sensores, borde, nube y gemelos digitales.
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(1)} kg CO₂e`, 'Emisión']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-slate-700 text-xs font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-md">
              <span className="text-slate-500 block">Cuello de botella principal:</span>
              <strong className="text-slate-800">{assessment.keyInsights.primaryEmissionDriver}</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-md">
              <span className="text-slate-500 block">Aporte Cloud/DT:</span>
              <strong className="text-slate-800">
                {(assessment.keyInsights.cloudSharePercent + (assessment.byCategory.digitalTwins.totalKgCO2e / assessment.totalEmissionsKgCO2e * 100)).toFixed(1)}% del total
              </strong>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Desglose por Etapas del Ciclo de Vida (LCA) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>Análisis por Etapa del Ciclo de Vida (LCA ISO 14040)</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                6 Etapas Analizadas
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparación cuantitativa de emisiones de fabricación, transporte, instalación, operación, mantenimiento y reciclaje.
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lcaStagesData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="etapa"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(2)} kg CO₂e`, 'Emisiones']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="kgCO2e" radius={[4, 4, 0, 0]}>
                  {lcaStagesData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>* Los valores negativos en Fin de Vida reflejan créditos de economía circular (RAEE).</span>
            <button
              onClick={() => onNavigateToTab('lifecycle')}
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver detalle de fases</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fila 3: Evolución Temporal y Comparativa de Escenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Proyección Temporal Acumulada */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Evolución Acumulada de Emisiones en el Tiempo</span>
            </h3>
            <span className="text-[11px] text-slate-400">Horizonte: 3 Años</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Curva de emisiones acumuladas a medida que transcurren los meses de operación agrícola.
          </p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(1)} kg CO₂e`, 'Acumulado']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="acumuladoKg"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAcum)"
                  name="Huella Acumulada"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumen Comparativo de Escenarios */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Comparación de Arquitecturas Tecnológicas</span>
              </h3>
              <button
                onClick={() => onNavigateToTab('scenarios')}
                className="text-xs font-bold text-indigo-700 hover:underline"
              >
                Configurar Escenarios
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Impacto ambiental según el grado de procesamiento en borde vs nube.
            </p>
          </div>

          <div className="space-y-2.5">
            {scenarios.map(sc => {
              const reduction = ((1 - (sc.estimatedTotalKgCO2e / (scenarios[0].estimatedTotalKgCO2e || 1))) * 100);
              return (
                <div
                  key={sc.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    sc.architectureType === 'Híbrida Optimizada'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="max-w-[60%]">
                    <div className="font-bold flex items-center gap-2">
                      <span>{sc.name}</span>
                      {sc.isBaseline && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 text-slate-700">
                          Línea Base
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {sc.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900">
                      {sc.estimatedTotalKgCO2e.toFixed(1)} kg CO₂e
                    </div>
                    <div className="text-[10px] font-semibold">
                      {reduction > 0 ? (
                        <span className="text-emerald-700">↓ {reduction.toFixed(1)}% reducción</span>
                      ) : (
                        <span className="text-slate-500">Referencia</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
            <span>Recomendación: Arquitectura Híbrida Optimizada reduce costes y carbono en &gt;50%.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
