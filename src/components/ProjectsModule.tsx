import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  Calendar,
  Layers,
  Leaf,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  ExternalLink
} from 'lucide-react';
import { Project, CropType, UserRole } from '../types';

interface ProjectsModuleProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onSaveProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  userRole: UserRole;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = filterCrop === 'all' || p.cropType === filterCrop;
    return matchesSearch && matchesCrop;
  });

  const handleOpenCreate = () => {
    setEditingProject({
      id: `proj-${Date.now()}`,
      name: '',
      description: '',
      location: '',
      cropType: 'Maíz',
      agriculturalAreaHectares: 50,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Planificación',
      responsibleUser: 'Investigador Principal',
      carbonBudgetKgCO2e: 1000,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject({ ...p });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.name || !editingProject?.location) return;
    onSaveProject(editingProject as Project);
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const cropOptions: CropType[] = [
    'Maíz',
    'Trigo',
    'Vid / Viñedos',
    'Olivo',
    'Hortalizas en Invernadero',
    'Frutales (Cítricos/Aguacate)',
    'Cereales Extensivos',
    'Soja / Leguminosas'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            <span>Gestión de Proyectos de Agricultura de Precisión</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra explotaciones agrícolas, parcelas monitoreadas, tipos de cultivo y presupuestos de carbono.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-create-project"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto Agrícola</span>
          </button>
        )}
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o cultivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-medium">Filtrar por Cultivo:</label>
          <select
            value={filterCrop}
            onChange={(e) => setFilterCrop(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los cultivos ({projects.length})</option>
            {cropOptions.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Proyectos en Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map(p => {
          const isSelected = selectedProject?.id === p.id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {p.cropType}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    p.status === 'En Operación' ? 'bg-green-50 text-green-700 border border-green-200' :
                    p.status === 'Planificación' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Área: <strong>{p.agriculturalAreaHectares} hectáreas</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Resp: {p.responsibleUser}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Inicio: {p.startDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectProject(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Proyecto Activo' : 'Seleccionar'}
                </button>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar Proyecto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Creación / Edición */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProject.id?.startsWith('proj-') && editingProject.name ? 'Editar Proyecto Agrícola' : 'Crear Nuevo Proyecto'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={editingProject.name || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="Ej. Finca Experimental Los Naranjos - Riego IoT"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descripción del Sistema</label>
                <textarea
                  rows={2}
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Detalles sobre el cultivo, tecnología desplegada y gemelo digital..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Cultivo</label>
                  <select
                    value={editingProject.cropType || 'Maíz'}
                    onChange={(e) => setEditingProject({ ...editingProject, cropType: e.target.value as CropType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Superficie Agrícola (ha) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={editingProject.agriculturalAreaHectares || 10}
                    onChange={(e) => setEditingProject({ ...editingProject, agriculturalAreaHectares: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ubicación / Comarca *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.location || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    placeholder="Ej. Ribera Alta / Parcela 14"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsable del Proyecto</label>
                  <input
                    type="text"
                    value={editingProject.responsibleUser || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, responsibleUser: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={editingProject.startDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={editingProject.status || 'Planificación'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Planificación">Planificación</option>
                    <option value="En Operación">En Operación</option>
                    <option value="En Pausa">En Pausa</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
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
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
