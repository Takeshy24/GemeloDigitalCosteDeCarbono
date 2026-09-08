import React, { useState } from 'react';
import {
  GitCompare,
  Plus,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Calculator
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Scenario, ArchitectureType, UserRole } from '../types';

interface ScenariosModuleProps {
  scenarios: Scenario[];
  onSaveScenario: (sc: Scenario) => void;
  onDeleteScenario: (id: string) => void;
  userRole: UserRole;
}

export const ScenariosModule: React.FC<ScenariosModuleProps> = ({
  scenarios,
  onSaveScenario,
  onDeleteScenario,
  userRole
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Partial<Scenario> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const baseline = scenarios.find(s => s.isBaseline) || scenarios[0];

  const comparisonData = scenarios.map(s => ({
    name: s.name.split(':')[0],
    carbonoKg: s.estimatedTotalKgCO2e,
    energiaKWh: s.estimatedEnergyKWh,
    costeUSD: s.costEstimateUSD,
    latenciaMs: s.latencyMs
  }));

  const handleOpenCreate = () => {
    setEditingScenario({
      id: `sc-${Date.now()}`,
      name: '',
      description: '',
      architectureType: 'Híbrida Optimizada',
      isBaseline: false,
      sensorCount: 30,
      edgeDeviceCount: 3,
      cloudComputeHoursDaily: 12,
      cloudDataStorageGB: 150,
      transmissionIntervalMinutes: 20,
      isRenewableCloud: true,
      isSolarEdge: true,
      estimatedTotalKgCO2e: 210,
      estimatedEnergyKWh: 750,
      costEstimateUSD: 1600,
      latencyMs: 70
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScenario?.name) return;
    onSaveScenario(editingScenario as Scenario);
    setIsModalOpen(false);
    setEditingScenario(null);
  };

  const recalculateScenario = () => {
    if (!editingScenario) return;
    const sensors = Math.max(0, editingScenario.sensorCount ?? 0);
    const edge = Math.max(0, editingScenario.edgeDeviceCount ?? 0);
    const cloudHours = Math.max(0, editingScenario.cloudComputeHoursDaily ?? 0);
    const storage = Math.max(0, editingScenario.cloudDataStorageGB ?? 0);
    const interval = Math.max(1, editingScenario.transmissionIntervalMinutes ?? 15);
    const sensorEnergy = sensors * 0.18 * 24 * 365 / 1000;
    const edgeEnergy = edge * 12 * 24 * 365 / 1000;
    const cloudEnergy = cloudHours * 1.45 * 365 + storage * .09 * 12;
    const energy = sensorEnergy + edgeEnergy + cloudEnergy;
    const gridFactor = editingScenario.isRenewableCloud ? .045 : .22;
    const edgeFactor = editingScenario.isSolarEdge ? .03 : gridFactor;
    const communication = sensors * (15 / interval) * 3.2;
    const carbon = sensors * 1.8 + edge * 9.5 + sensorEnergy * gridFactor + edgeEnergy * edgeFactor + cloudEnergy * gridFactor + communication;
    const architectureLatency: Record<string, number> = {
      '100% Cloud (Centralizada)': 260,
      'Edge-Dominant (Procesamiento en Campo)': 45,
      'Híbrida Optimizada': 75,
      'Ultra-Low-Power Agrícola': 125
    };
    setEditingScenario({
      ...editingScenario,
      estimatedEnergyKWh: Number(energy.toFixed(1)),
      estimatedTotalKgCO2e: Number(carbon.toFixed(1)),
      costEstimateUSD: Math.round(sensors * 22 + edge * 310 + cloudHours * 2.2 + storage * .18),
      latencyMs: architectureLatency[editingScenario.architectureType || 'Híbrida Optimizada'] || 90
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <span>Simulación y Comparativa de Escenarios Arquitectónicos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analiza el trade-off entre huella de carbono, consumo de energía, latencia de respuesta y coste económico.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-scenario"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Escenario de Simulación</span>
          </button>
        )}
      </div>

      {/* Gráfico Comparativo Principal de Escenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-sm">
              Comparativa de Huella de Carbono (kg CO₂e) por Escenario
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Línea Base: {baseline?.name.split(':')[0]}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(1)} kg CO₂e`, 'Huella de Carbono']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="carbonoKg" fill="#10b981" radius={[4, 4, 0, 0]} name="Emisiones (kg CO2e)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Indicador Multicriterio (Carbono vs Coste vs Latencia)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Equilibrio entre rendimiento agronómico en tiempo real y sostenibilidad.
            </p>
          </div>

          <div className="space-y-3">
            {scenarios.map(sc => {
              const carbonReduction = ((1 - (sc.estimatedTotalKgCO2e / baseline.estimatedTotalKgCO2e)) * 100);
              return (
                <div
                  key={sc.id}
                  className={`p-3 rounded-lg border text-xs ${
                    sc.isBaseline
                      ? 'bg-slate-50 border-slate-200'
                      : carbonReduction > 0
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>{sc.name}</span>
                    <span className="text-xs">{sc.estimatedTotalKgCO2e.toFixed(1)} kg CO₂e</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 mt-2">
                    <div>⚡ {sc.estimatedEnergyKWh} kWh</div>
                    <div>💰 ${sc.costEstimateUSD}/año</div>
                    <div>⏱️ {sc.latencyMs} ms latencia</div>
                  </div>
                  {!sc.isBaseline && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{carbonReduction > 0 ? `Reducción del ${carbonReduction.toFixed(1)}% respecto a la base` : 'Sin ahorro'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas Detalladas de Escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scenarios.map(sc => (
          <div
            key={sc.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {sc.architectureType}
                </span>
                {sc.isBaseline && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Línea Base
                  </span>
                )}
              </div>

              <h4 className="font-bold text-slate-900 text-sm">
                {sc.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {sc.description}
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                  <span className="text-slate-500">Sensores IoT:</span>
                  <strong className="text-slate-800">{sc.sensorCount} uds. ({sc.transmissionIntervalMinutes} min)</strong>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                  <span className="text-slate-500">Nodos Edge:</span>
                  <strong className="text-slate-800">{sc.edgeDeviceCount} {sc.isSolarEdge ? '(100% Solar)' : '(Red)'}</strong>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                  <span className="text-slate-500">Cómputo Nube:</span>
                  <strong className="text-slate-800">{sc.cloudComputeHoursDaily} h/día {sc.isRenewableCloud ? '(Renovable)' : '(Fósil)'}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Coste Total Anual:</span>
                <span className="font-black text-slate-900 text-sm">${sc.costEstimateUSD}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">Emisión Estimada:</span>
                <span className="font-black text-emerald-700 text-sm">{sc.estimatedTotalKgCO2e.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Escenario */}
      {isModalOpen && editingScenario && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Nuevo Escenario de Simulación
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Escenario *</label>
                <input
                  type="text"
                  required
                  value={editingScenario.name || ''}
                  onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
                  placeholder="Ej. Escenario D: LoRaWAN Solar + Edge TinyML"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descripción de la Arquitectura</label>
                <textarea
                  rows={2}
                  value={editingScenario.description || ''}
                  onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                  placeholder="Explica qué estrategias de optimización aplica este escenario..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Arquitectura</label>
                  <select
                    value={editingScenario.architectureType || 'Híbrida Optimizada'}
                    onChange={(e) => setEditingScenario({ ...editingScenario, architectureType: e.target.value as ArchitectureType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="100% Cloud (Centralizada)">100% Cloud (Centralizada)</option>
                    <option value="Edge-Dominant (Procesamiento en Campo)">Edge-Dominant (Procesamiento en Campo)</option>
                    <option value="Híbrida Optimizada">Híbrida Optimizada</option>
                    <option value="Ultra-Low-Power Agrícola">Ultra-Low-Power Agrícola</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Huella Estimada (kg CO2e) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingScenario.estimatedTotalKgCO2e || 200}
                    onChange={(e) => setEditingScenario({ ...editingScenario, estimatedTotalKgCO2e: parseFloat(e.target.value) || 200 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Consumo Energía (kWh)</label>
                  <input
                    type="number"
                    value={editingScenario.estimatedEnergyKWh || 600}
                    onChange={(e) => setEditingScenario({ ...editingScenario, estimatedEnergyKWh: parseFloat(e.target.value) || 600 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Coste Anual (USD)</label>
                  <input
                    type="number"
                    value={editingScenario.costEstimateUSD || 1500}
                    onChange={(e) => setEditingScenario({ ...editingScenario, costEstimateUSD: parseFloat(e.target.value) || 1500 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latencia (ms)</label>
                  <input
                    type="number"
                    value={editingScenario.latencyMs || 50}
                    onChange={(e) => setEditingScenario({ ...editingScenario, latencyMs: parseInt(e.target.value) || 50 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div><span className="font-bold text-indigo-950">Parámetros de simulación</span><p className="text-[10px] text-indigo-700">Recalcula carbono, energía, coste y latencia desde la arquitectura.</p></div>
                  <button type="button" onClick={recalculateScenario} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-500"><Calculator className="w-3.5 h-3.5" />Recalcular</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumberField label="Sensores" value={editingScenario.sensorCount ?? 0} onChange={sensorCount => setEditingScenario({ ...editingScenario, sensorCount })} />
                  <NumberField label="Nodos Edge" value={editingScenario.edgeDeviceCount ?? 0} onChange={edgeDeviceCount => setEditingScenario({ ...editingScenario, edgeDeviceCount })} />
                  <NumberField label="Cloud h/día" value={editingScenario.cloudComputeHoursDaily ?? 0} onChange={cloudComputeHoursDaily => setEditingScenario({ ...editingScenario, cloudComputeHoursDaily })} />
                  <NumberField label="Telemetría min" value={editingScenario.transmissionIntervalMinutes ?? 15} onChange={transmissionIntervalMinutes => setEditingScenario({ ...editingScenario, transmissionIntervalMinutes })} />
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(editingScenario.isRenewableCloud)} onChange={e => setEditingScenario({ ...editingScenario, isRenewableCloud: e.target.checked })} />Cloud renovable</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(editingScenario.isSolarEdge)} onChange={e => setEditingScenario({ ...editingScenario, isSolarEdge: e.target.checked })} />Edge solar</label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Guardar Escenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-600">{label}</span><input type="number" min="0" value={value} onChange={e => onChange(Number(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800" /></label>;
}
