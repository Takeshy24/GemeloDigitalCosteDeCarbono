import React from 'react';
import {
  Activity,
  Factory,
  Truck,
  Wrench,
  Zap,
  RotateCcw,
  ShieldAlert,
  Info,
  CheckCircle2,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ProjectCarbonAssessment, Project } from '../types';

interface LifeCycleModuleProps {
  assessment: ProjectCarbonAssessment;
  project: Project;
}

export const LifeCycleModule: React.FC<LifeCycleModuleProps> = ({
  assessment,
  project
}) => {
  const lca = assessment.byLifeCycleStage;
  const total = assessment.totalEmissionsKgCO2e || 1;

  const stages = [
    {
      id: 'manufacturing',
      title: '1. Fabricación y Extracción de Materiales (Embodied Carbon)',
      description: 'Extracción de silicio, fabricación de obleas semiconductoras, placas de circuito impreso (PCB), microcontroladores y carcasas plásticas/metálicas.',
      kgCO2e: lca.manufacturingKgCO2e,
      percent: ((lca.manufacturingKgCO2e / total) * 100).toFixed(1),
      icon: Factory,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      barColor: '#3b82f6',
      isoRef: 'ISO 14044 Fase A1-A3 (Cradle-to-Gate)'
    },
    {
      id: 'transport',
      title: '2. Transporte, Flete y Distribución',
      description: 'Transporte aéreo/marítimo/terrestre desde los centros de fabricación (Asia/Europa) hasta el punto de entrega en la explotación agrícola.',
      kgCO2e: lca.transportKgCO2e,
      percent: ((lca.transportKgCO2e / total) * 100).toFixed(1),
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-200',
      barColor: '#06b6d4',
      isoRef: 'ISO 14044 Fase A4 (Transport to site)'
    },
    {
      id: 'installation',
      title: '3. Instalación, Despliegue y Puesta en Marcha',
      description: 'Instalación de postes, calibración de sondas de humedad, antenas LoRaWAN, configuración de routers y despliegue del software inicial.',
      kgCO2e: lca.installationKgCO2e,
      percent: ((lca.installationKgCO2e / total) * 100).toFixed(1),
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      barColor: '#8b5cf6',
      isoRef: 'ISO 14044 Fase A5 (Installation phase)'
    },
    {
      id: 'operation',
      title: '4. Operación, Ingesta de Datos y Cómputo del Gemelo',
      description: 'Consumo eléctrico continuo de sensores, gateways, centros de datos en la nube (PUE), inferencia de IA y tráfico de telecomunicaciones.',
      kgCO2e: lca.operationKgCO2e,
      percent: ((lca.operationKgCO2e / total) * 100).toFixed(1),
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      barColor: '#ef4444',
      isoRef: 'ISO 14044 Fase B1-B6 (Use Stage & Operational)'
    },
    {
      id: 'maintenance',
      title: '5. Mantenimiento y Sustitución de Baterías',
      description: 'Reemplazo de baterías de litio/alcalinas cada 18-24 meses, visitas de calibración agronómica y repuesto de nodos dañados por intemperie.',
      kgCO2e: lca.maintenanceKgCO2e,
      percent: ((lca.maintenanceKgCO2e / total) * 100).toFixed(1),
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
      barColor: '#f59e0b',
      isoRef: 'ISO 14044 Fase B7-B8 (Maintenance & Replacement)'
    },
    {
      id: 'endOfLife',
      title: '6. Fin de Vida, Reciclaje y Disposición (Crédito WEEE)',
      description: 'Recolección y reciclaje de chatarra electrónica (WEEE). El desensamblaje y recuperación de cobre/aluminio genera un crédito de carbono negativo.',
      kgCO2e: lca.endOfLifeKgCO2e,
      percent: ((lca.endOfLifeKgCO2e / total) * 100).toFixed(1),
      icon: RotateCcw,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      barColor: '#10b981',
      isoRef: 'ISO 14044 Fase C1-D (End-of-Life & Circular Credits)'
    }
  ];

  const chartData = stages.map(s => ({
    etapa: s.title.split('.')[1].split('(')[0].trim(),
    emisionesKg: s.kgCO2e,
    porcentaje: parseFloat(s.percent)
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Análisis del Ciclo de Vida Completo (LCA) - Metodología ISO 14040/14044</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación integral de la cuna a la tumba (Cradle-to-Grave) de la infraestructura de sensores, borde y gemelos digitales.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <span>Periodo de Análisis: {assessment.analysisPeriodYears} Años</span>
        </div>
      </div>

      {/* Gráfico Comparativo de Etapas */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 text-sm">
            Contribución por Fase del Ciclo de Vida (kg CO₂e)
          </h3>
          <span className="text-xs font-bold text-slate-700">
            Huella Total: {assessment.totalEmissionsKgCO2e.toFixed(1)} kg CO₂e
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="etapa" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toFixed(2)} kg CO₂e`, 'Emisión']}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="emisionesKg" radius={[4, 4, 0, 0]}>
                {stages.map((s, idx) => (
                  <Cell key={`cell-${idx}`} fill={s.barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjetas Detalladas por Etapa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stages.map(stage => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className={`p-5 rounded-xl border ${stage.bgColor} shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-lg bg-white shadow-xs ${stage.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                    {stage.percent}%
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {stage.title}
                </h4>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {stage.isoRef}
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Emisión Calculada:</span>
                <span className="text-base font-black text-slate-900">
                  {stage.kgCO2e.toFixed(2)} <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla Desglose de Componentes Físicos vs Virtuales */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Matriz Detallada de Componentes del Sistema y Desglose LCA
          </h4>
          <span className="text-xs text-slate-500">
            {assessment.componentsList.length} Activos Evaluados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Componente / Activo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Energía Anual (kWh)</th>
                <th className="px-4 py-3">Emisión Operativa (kg)</th>
                <th className="px-4 py-3">Emisión Incorporada (kg)</th>
                <th className="px-4 py-3">Total LCA (kg CO₂e)</th>
                <th className="px-4 py-3 text-right">% Huella Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assessment.componentsList.map(comp => (
                <tr key={comp.componentId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {comp.componentName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {comp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {comp.annualEnergyKWh.toFixed(1)} kWh
                  </td>
                  <td className="px-4 py-3 font-mono text-red-700 font-semibold">
                    {comp.operationalEmissionsKgCO2e.toFixed(1)} kg
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-700 font-semibold">
                    {comp.embodiedEmissionsKgCO2e.toFixed(1)} kg
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {comp.lifeCycleTotalKgCO2e.toFixed(1)} kg CO₂e
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {comp.percentageOfTotal.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
