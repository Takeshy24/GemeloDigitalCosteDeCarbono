import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Search,
  BookOpen,
  Globe2,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EmissionFactor, EmissionFactorCategory, UserRole } from '../types';

interface EmissionFactorsModuleProps {
  emissionFactors: EmissionFactor[];
  onSaveEmissionFactor: (ef: EmissionFactor) => void;
  onDeleteEmissionFactor: (id: string) => void;
  userRole: UserRole;
}

export const EmissionFactorsModule: React.FC<EmissionFactorsModuleProps> = ({
  emissionFactors,
  onSaveEmissionFactor,
  onDeleteEmissionFactor,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<Partial<EmissionFactor> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const filteredFactors = emissionFactors.filter(ef => {
    const matchesSearch = ef.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ef.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ef.countryOrRegion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCat === 'all' || ef.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const categoriesList: EmissionFactorCategory[] = [
    'Mix Eléctrico / Red',
    'Fabricación Hardware & Materiales',
    'Transporte y Logística',
    'Cómputo en la Nube y Almacenamiento',
    'Redes y Transmisión de Datos',
    'Fin de Vida y Reciclaje WEEE'
  ];

  const handleOpenCreate = () => {
    setEditingFactor({
      id: `ef-${Date.now()}`,
      name: '',
      category: 'Mix Eléctrico / Red',
      value: 0.25,
      unit: 'kg CO2e / kWh',
      source: 'MITECO / Red Eléctrica de España',
      countryOrRegion: 'España / Península',
      year: 2024,
      isDemoData: false,
      notes: 'Factor oficial de emisión del mix de generación eléctrica'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ef: EmissionFactor) => {
    setEditingFactor({ ...ef });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFactor?.name || !editingFactor?.unit) return;
    onSaveEmissionFactor(editingFactor as EmissionFactor);
    setIsModalOpen(false);
    setEditingFactor(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>Catálogo Científico de Factores de Emisión</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Parámetros de conversión normalizados de acuerdo con bases de datos reconocidas (Ecoinvent, IPCC, DEFRA, MITECO, IEA).
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-emission-factor"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Factor de Emisión</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por factor, fuente o país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-medium">Categoría:</label>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          >
            <option value="all">Todas las categorías ({emissionFactors.length})</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Factores */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Factor de Emisión</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Valor / Coeficiente</th>
                <th className="px-4 py-3">Unidad de Medida</th>
                <th className="px-4 py-3">Fuente Bibliográfica</th>
                <th className="px-4 py-3">Región / Año</th>
                <th className="px-4 py-3">Tipo Dato</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFactors.map(ef => (
                <tr key={ef.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{ef.name}</div>
                    {ef.notes && <div className="text-[10px] text-slate-400 font-normal">{ef.notes}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {ef.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                    {ef.value}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {ef.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{ef.source}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {ef.countryOrRegion} ({ef.year})
                  </td>
                  <td className="px-4 py-3">
                    {ef.isDemoData ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Demo / Simulado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                        Oficial Científico
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(ef)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Editar Factor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmissionFactor(ef.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar Factor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Factor */}
      {isModalOpen && editingFactor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingFactor.id?.startsWith('ef-') && editingFactor.name ? 'Editar Factor de Emisión' : 'Registrar Nuevo Factor de Emisión'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Factor *</label>
                <input
                  type="text"
                  required
                  value={editingFactor.name || ''}
                  onChange={(e) => setEditingFactor({ ...editingFactor, name: e.target.value })}
                  placeholder="Ej. Mix Eléctrico España (REE 2024)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingFactor.category || 'Mix Eléctrico / Red'}
                    onChange={(e) => setEditingFactor({ ...editingFactor, category: e.target.value as EmissionFactorCategory })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor Numérico *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={editingFactor.value || 0}
                    onChange={(e) => setEditingFactor({ ...editingFactor, value: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unidad de Medida *</label>
                  <input
                    type="text"
                    required
                    value={editingFactor.unit || ''}
                    onChange={(e) => setEditingFactor({ ...editingFactor, unit: e.target.value })}
                    placeholder="Ej. kg CO2e / kWh o kg CO2e / kg PCB"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fuente Científica / Referencia</label>
                  <input
                    type="text"
                    value={editingFactor.source || ''}
                    onChange={(e) => setEditingFactor({ ...editingFactor, source: e.target.value })}
                    placeholder="Ej. Ecoinvent v3.9 / IPCC AR6"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">País / Región</label>
                  <input
                    type="text"
                    value={editingFactor.countryOrRegion || ''}
                    onChange={(e) => setEditingFactor({ ...editingFactor, countryOrRegion: e.target.value })}
                    placeholder="Ej. España / Europa / Global"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Año de Referencia</label>
                  <input
                    type="number"
                    min="2000"
                    max="2030"
                    value={editingFactor.year || 2024}
                    onChange={(e) => setEditingFactor({ ...editingFactor, year: parseInt(e.target.value) || 2024 })}
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
                  Guardar Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
