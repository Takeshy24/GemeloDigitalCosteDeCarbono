import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Cpu,
  RefreshCw,
  Zap,
  Activity,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { DigitalTwin, DigitalTwinType, AIModelType, UserRole } from '../types';
import { Twin3DViewer } from './Twin3DViewer';

interface DigitalTwinsModuleProps {
  digitalTwins: DigitalTwin[];
  projectId: string;
  onSaveDigitalTwin: (twin: DigitalTwin) => void;
  onDeleteDigitalTwin: (id: string) => void;
  userRole: UserRole;
}

export const DigitalTwinsModule: React.FC<DigitalTwinsModuleProps> = ({
  digitalTwins,
  projectId,
  onSaveDigitalTwin,
  onDeleteDigitalTwin,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTwin, setEditingTwin] = useState<Partial<DigitalTwin> | null>(null);
  const [viewerTwinId, setViewerTwinId] = useState<string | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const projectTwins = digitalTwins.filter(t => t.projectId === projectId);

  const filteredTwins = projectTwins.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.aiModelType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const viewerTwin = projectTwins.find(t => t.id === viewerTwinId) || projectTwins[0];

  const twinTypesList: DigitalTwinType[] = [
    'Dinámica del Suelo y Riego (Balance Hídrico)',
    'Crecimiento del Cultivo y Rendimiento (Crop Growth)',
    'Microclima y Predicción de Heladas/Plagas',
    'Fertirrigación de Precisión y Nutrientes',
    'Gemelo Holístico de Parcela / Explotación'
  ];

  const modelTypesList: AIModelType[] = [
    'Mecanicista / Físico (AquaCrop/DSSAT)',
    'Machine Learning Clásico (Random Forest / XGBoost)',
    'Deep Learning (LSTM / Redes Convolucionales)',
    'Híbrido Físico-Estadístico (PINN)',
    'Reglas Expertas y Balance de Masas'
  ];

  const handleOpenCreate = () => {
    setEditingTwin({
      id: `dt-${Date.now()}`,
      projectId,
      name: '',
      type: 'Dinámica del Suelo y Riego (Balance Hídrico)',
      description: '',
      aiModelType: 'Híbrido Físico-Estadístico (PINN)',
      updateFrequencyMinutes: 30,
      dailyProcessedDataMB: 450,
      annualRunHours: 8760,
      associatedSensorIds: [],
      associatedEdgeDeviceIds: [],
      associatedCloudResourceIds: [],
      carbonComputeOverheadKgCO2e: 18.5,
      operationalStatus: 'En Ejecución'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: DigitalTwin) => {
    setEditingTwin({ ...t });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTwin?.name || !editingTwin?.type) return;
    onSaveDigitalTwin(editingTwin as DigitalTwin);
    setIsModalOpen(false);
    setEditingTwin(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Gemelos Digitales (Digital Twins) del Cultivo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modelos de simulación física, redes neuronales (PINN) y balance hídrico que representan digitalmente la explotación agrícola.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-twin"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Gemelo Digital</span>
          </button>
        )}
      </div>

      {viewerTwin && <Twin3DViewer twin={viewerTwin} />}

      {/* Grid de Gemelos Digitales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTwins.map(twin => (
          <div
            key={twin.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {twin.type}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {twin.operationalStatus}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {twin.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {twin.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Modelo / IA:</span>
                  <strong className="text-slate-800 text-xs">{twin.aiModelType}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Refresco de Simulación:</span>
                  <strong className="text-slate-800 text-xs">Cada {twin.updateFrequencyMinutes} minutos</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Telemetría Procesada:</span>
                  <strong className="text-slate-800 text-xs">{twin.dailyProcessedDataMB} MB / día</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Huella de Cómputo DT:</span>
                  <strong className="text-emerald-700 text-xs">{twin.carbonComputeOverheadKgCO2e} kg CO₂e/año</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Operación continua ({twin.annualRunHours} h/año)</span>
              </span>

              <div className="flex items-center gap-1">
                  <button onClick={() => setViewerTwinId(twin.id)} className="px-2 py-1 rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold" title="Abrir vista 3D">Ver 3D</button>
              {canEdit && (
                <>
                  <button
                    onClick={() => handleOpenEdit(twin)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Editar Gemelo Digital"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDigitalTwin(twin.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar Gemelo Digital"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Gemelo Digital */}
      {isModalOpen && editingTwin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingTwin.id?.startsWith('dt-') && editingTwin.name ? 'Editar Gemelo Digital' : 'Crear Nuevo Gemelo Digital'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Gemelo Digital *</label>
                <input
                  type="text"
                  required
                  value={editingTwin.name || ''}
                  onChange={(e) => setEditingTwin({ ...editingTwin, name: e.target.value })}
                  placeholder="Ej. DT-AquaBalance: Modelo Hídrico de Suelo-Planta"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descripción del Modelo</label>
                <textarea
                  rows={2}
                  value={editingTwin.description || ''}
                  onChange={(e) => setEditingTwin({ ...editingTwin, description: e.target.value })}
                  placeholder="Explica qué variables simula (humedad profunda, evapotranspiración, estrés hídrico)..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Gemelo Digital</label>
                  <select
                    value={editingTwin.type || 'Dinámica del Suelo y Riego (Balance Hídrico)'}
                    onChange={(e) => setEditingTwin({ ...editingTwin, type: e.target.value as DigitalTwinType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {twinTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Algoritmo / Modelo IA</label>
                  <select
                    value={editingTwin.aiModelType || 'Híbrido Físico-Estadístico (PINN)'}
                    onChange={(e) => setEditingTwin({ ...editingTwin, aiModelType: e.target.value as AIModelType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {modelTypesList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Frecuencia Refresco (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTwin.updateFrequencyMinutes || 30}
                    onChange={(e) => setEditingTwin({ ...editingTwin, updateFrequencyMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Datos/Día (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTwin.dailyProcessedDataMB || 300}
                    onChange={(e) => setEditingTwin({ ...editingTwin, dailyProcessedDataMB: parseFloat(e.target.value) || 300 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Huella Cómputo (kg CO2e/año)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingTwin.carbonComputeOverheadKgCO2e || 15}
                    onChange={(e) => setEditingTwin({ ...editingTwin, carbonComputeOverheadKgCO2e: parseFloat(e.target.value) || 15 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
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
                  Guardar Gemelo Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
