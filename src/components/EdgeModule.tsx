import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  Zap,
  Sun,
  HardDrive,
  Cpu,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { EdgeDevice, EdgeDeviceType, UserRole } from '../types';

interface EdgeModuleProps {
  edgeDevices: EdgeDevice[];
  projectId: string;
  onSaveEdgeDevice: (device: EdgeDevice) => void;
  onDeleteEdgeDevice: (id: string) => void;
  userRole: UserRole;
}

export const EdgeModule: React.FC<EdgeModuleProps> = ({
  edgeDevices,
  projectId,
  onSaveEdgeDevice,
  onDeleteEdgeDevice,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<EdgeDevice> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const projectDevices = edgeDevices.filter(d => d.projectId === projectId);

  const filteredDevices = projectDevices.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.deviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const edgeTypesList: EdgeDeviceType[] = [
    'Microcomputador (Raspberry Pi 5/4)',
    'Acelerador IA Edge (NVIDIA Jetson Orin Nano)',
    'Gateway Industrial IoT (Advantech/Siemens)',
    'Servidor de Granja Edge (Intel Xeon/NUC)',
    'Microcontrolador Inteligente (ESP32/STM32)',
    'Dispositivo Edge Rugerizado Solar'
  ];

  const handleOpenCreate = () => {
    setEditingDevice({
      id: `edge-${Date.now()}`,
      projectId,
      name: '',
      deviceType: 'Microcomputador (Raspberry Pi 5/4)',
      manufacturer: '',
      model: '',
      cpu: 'Quad-Core 64-bit ARM',
      ramGB: 8,
      storageGB: 64,
      powerWatts: 10,
      dailyOperatingHours: 24,
      lifespanYears: 5,
      quantity: 1,
      operatingSystem: 'Ubuntu Linux 22.04 LTS',
      location: 'Caseta Central de Bombeo',
      weightKg: 0.8,
      isSolarPowered: false,
      status: 'Operativo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: EdgeDevice) => {
    setEditingDevice({ ...d });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice?.name || !editingDevice?.model) return;
    onSaveEdgeDevice(editingDevice as EdgeDevice);
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-600" />
            <span>Infraestructura Edge y Nodos de Borde</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Microcomputadores, aceleradores IA de campo (Jetson) y gateways que ejecutan el gemelo digital en proximidad física.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-edge"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Dispositivo Edge</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Dispositivos Edge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map(device => {
          const annualEnergyKWh = (device.powerWatts * device.dailyOperatingHours * 365 * device.quantity) / 1000;
          return (
            <div
              key={device.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {device.deviceType.split('(')[0]}
                  </span>
                  {device.isSolarPowered && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Sun className="w-3 h-3 text-amber-600" />
                      <span>Solar Off-Grid</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {device.name}
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  {device.manufacturer} · {device.model} ({device.quantity} uds.)
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" /> CPU / RAM:
                    </span>
                    <strong className="text-slate-800">{device.ramGB} GB RAM ({device.cpu})</strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Potencia & Consumo:
                    </span>
                    <strong className="text-slate-800">{device.powerWatts} W · {annualEnergyKWh.toFixed(1)} kWh/año</strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Almacenamiento:
                    </span>
                    <strong className="text-slate-800">{device.storageGB} GB ({device.operatingSystem})</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] truncate max-w-[160px]">
                  📍 {device.location}
                </span>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(device)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar Dispositivo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEdgeDevice(device.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar Dispositivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Edge */}
      {isModalOpen && editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingDevice.id?.startsWith('edge-') && editingDevice.name ? 'Editar Dispositivo Edge' : 'Registrar Dispositivo Edge'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Nodo Edge *</label>
                <input
                  type="text"
                  required
                  value={editingDevice.name || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                  placeholder="Ej. Servidor de Inferencia Jetson Orin Parcela 1"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Dispositivo</label>
                  <select
                    value={editingDevice.deviceType || 'Microcomputador (Raspberry Pi 5/4)'}
                    onChange={(e) => setEditingDevice({ ...editingDevice, deviceType: e.target.value as EdgeDeviceType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {edgeTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cantidad de Equipos</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingDevice.quantity || 1}
                    onChange={(e) => setEditingDevice({ ...editingDevice, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={editingDevice.manufacturer || ''}
                    onChange={(e) => setEditingDevice({ ...editingDevice, manufacturer: e.target.value })}
                    placeholder="Ej. NVIDIA / Advantech"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={editingDevice.model || ''}
                    onChange={(e) => setEditingDevice({ ...editingDevice, model: e.target.value })}
                    placeholder="Ej. Jetson Orin Nano 8GB"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Potencia (Watts) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingDevice.powerWatts || 12}
                    onChange={(e) => setEditingDevice({ ...editingDevice, powerWatts: parseFloat(e.target.value) || 12 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingDevice.ramGB || 8}
                    onChange={(e) => setEditingDevice({ ...editingDevice, ramGB: parseInt(e.target.value) || 8 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Almacenamiento (GB)</label>
                  <input
                    type="number"
                    min="8"
                    value={editingDevice.storageGB || 128}
                    onChange={(e) => setEditingDevice({ ...editingDevice, storageGB: parseInt(e.target.value) || 128 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ubicación Física</label>
                  <input
                    type="text"
                    value={editingDevice.location || ''}
                    onChange={(e) => setEditingDevice({ ...editingDevice, location: e.target.value })}
                    placeholder="Ej. Caseta de Riego Cabezal 1"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="solar-power-check"
                    checked={editingDevice.isSolarPowered || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, isSolarPowered: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <label htmlFor="solar-power-check" className="font-semibold text-slate-700 cursor-pointer">
                    Alimentado por Panel Solar Fotovoltaico
                  </label>
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
                  Guardar Dispositivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
