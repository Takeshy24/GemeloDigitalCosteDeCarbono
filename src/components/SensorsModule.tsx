import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Battery,
  Wifi,
  Scale,
  Zap,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { IoTSensor, SensorType, CommunicationTech, UserRole } from '../types';

interface SensorsModuleProps {
  sensors: IoTSensor[];
  projectId: string;
  onSaveSensor: (sensor: IoTSensor) => void;
  onDeleteSensor: (id: string) => void;
  userRole: UserRole;
}

export const SensorsModule: React.FC<SensorsModuleProps> = ({
  sensors,
  projectId,
  onSaveSensor,
  onDeleteSensor,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Partial<IoTSensor> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const projectSensors = sensors.filter(s => s.projectId === projectId);

  const filteredSensors = projectSensors.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.sensorType === filterType;
    return matchesSearch && matchesType;
  });

  const sensorTypesList: SensorType[] = [
    'Humedad del Suelo',
    'Temperatura y Humedad Ambiental',
    'pH y Conductividad Eléctrica (EC)',
    'Radiación Solar / PAR',
    'Estación Meteorológica Compacta',
    'Cámara Multiespectral / NDVI',
    'Sensor de Nutrientes NPK',
    'Dendrómetro / Flujo de Savia',
    'Anemómetro y Pluviómetro'
  ];

  const commTechList: CommunicationTech[] = [
    'LoRaWAN',
    'NB-IoT',
    'ZigBee',
    'Wi-Fi 6',
    '4G/LTE-M',
    '5G NR',
    'Bluetooth BLE',
    'Cable RS485/Modbus'
  ];

  const handleOpenCreate = () => {
    setEditingSensor({
      id: `sens-${Date.now()}`,
      projectId,
      name: '',
      sensorType: 'Humedad del Suelo',
      manufacturer: '',
      model: '',
      quantity: 1,
      powerWatts: 0.3,
      dailyOperatingHours: 24,
      lifespanYears: 5,
      weightGrams: 350,
      mainMaterials: ['Plástico ABS', 'PCB Silicio', 'Batería Litio'],
      transmissionIntervalMinutes: 15,
      dataSentPerMessageKB: 0.2,
      communicationTech: 'LoRaWAN',
      acquisitionDate: new Date().toISOString().split('T')[0],
      status: 'Activo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: IoTSensor) => {
    setEditingSensor({ ...s });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSensor?.name || !editingSensor?.model) return;
    onSaveSensor(editingSensor as IoTSensor);
    setIsModalOpen(false);
    setEditingSensor(null);
  };

  const totalSensorCount = projectSensors.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <span>Módulo de Sensores IoT en Campo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de sensores de suelo, microclima, radiación y ópticos. Cálculo de huella incorporada y consumo de red.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-sensor"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Sensor IoT</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por sensor, fabricante o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-medium">Tipo de Sensor:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          >
            <option value="all">Todos los tipos ({projectSensors.length} modelos, {totalSensorCount} unidades)</option>
            {sensorTypesList.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Sensores */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Sensor / Modelo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3">Potencia (W)</th>
                <th className="px-4 py-3">Comunicaciones</th>
                <th className="px-4 py-3">Peso & Materiales</th>
                <th className="px-4 py-3">Vida Útil</th>
                <th className="px-4 py-3">Estado</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSensors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron sensores registrados para este proyecto.
                  </td>
                </tr>
              ) : (
                filteredSensors.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {s.manufacturer} · {s.model}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.sensorType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {s.quantity} uds.
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-mono">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{s.powerWatts} W</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{s.dailyOperatingHours} h/día</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-cyan-600" />
                        <span className="font-semibold text-slate-800">{s.communicationTech}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cada {s.transmissionIntervalMinutes} min ({s.dataSentPerMessageKB} KB)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        <span>{s.weightGrams} g/ud</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                        {s.mainMaterials?.join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{s.lifespanYears} años</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        {s.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Editar Sensor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSensor(s.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar Sensor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Sensor */}
      {isModalOpen && editingSensor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingSensor.id?.startsWith('sens-') && editingSensor.name ? 'Editar Sensor IoT' : 'Registrar Nuevo Sensor IoT'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre / Identificador del Sensor *</label>
                <input
                  type="text"
                  required
                  value={editingSensor.name || ''}
                  onChange={(e) => setEditingSensor({ ...editingSensor, name: e.target.value })}
                  placeholder="Ej. Sonda de Humedad de Suelo Parcela Norte"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Sensor</label>
                  <select
                    value={editingSensor.sensorType || 'Humedad del Suelo'}
                    onChange={(e) => setEditingSensor({ ...editingSensor, sensorType: e.target.value as SensorType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {sensorTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cantidad de Unidades *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSensor.quantity || 1}
                    onChange={(e) => setEditingSensor({ ...editingSensor, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={editingSensor.manufacturer || ''}
                    onChange={(e) => setEditingSensor({ ...editingSensor, manufacturer: e.target.value })}
                    placeholder="Ej. METER Group / Sentek"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Modelo Comercial *</label>
                  <input
                    type="text"
                    required
                    value={editingSensor.model || ''}
                    onChange={(e) => setEditingSensor({ ...editingSensor, model: e.target.value })}
                    placeholder="Ej. 10HS Soil Moisture"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Potencia (Watts) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editingSensor.powerWatts || 0.2}
                    onChange={(e) => setEditingSensor({ ...editingSensor, powerWatts: parseFloat(e.target.value) || 0.2 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Horas Operación/Día</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={editingSensor.dailyOperatingHours || 24}
                    onChange={(e) => setEditingSensor({ ...editingSensor, dailyOperatingHours: parseInt(e.target.value) || 24 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Peso Unitario (g)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSensor.weightGrams || 300}
                    onChange={(e) => setEditingSensor({ ...editingSensor, weightGrams: parseInt(e.target.value) || 300 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tecnología Red</label>
                  <select
                    value={editingSensor.communicationTech || 'LoRaWAN'}
                    onChange={(e) => setEditingSensor({ ...editingSensor, communicationTech: e.target.value as CommunicationTech })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {commTechList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Frecuencia (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSensor.transmissionIntervalMinutes || 15}
                    onChange={(e) => setEditingSensor({ ...editingSensor, transmissionIntervalMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Datos/Mensaje (KB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSensor.dataSentPerMessageKB || 0.2}
                    onChange={(e) => setEditingSensor({ ...editingSensor, dataSentPerMessageKB: parseFloat(e.target.value) || 0.2 })}
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
                  Guardar Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
