import React, { useState } from 'react';
import {
  Cloud,
  Plus,
  Search,
  Server,
  Database,
  Globe,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CloudResource, CloudProvider, CloudServiceType, UserRole } from '../types';

interface CloudModuleProps {
  cloudResources: CloudResource[];
  projectId: string;
  onSaveCloudResource: (resource: CloudResource) => void;
  onDeleteCloudResource: (id: string) => void;
  userRole: UserRole;
}

export const CloudModule: React.FC<CloudModuleProps> = ({
  cloudResources,
  projectId,
  onSaveCloudResource,
  onDeleteCloudResource,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<CloudResource> | null>(null);

  const canEdit = userRole === 'Administrador' || userRole === 'Investigador/Analista';

  const projectResources = cloudResources.filter(c => c.projectId === projectId);

  const filteredResources = projectResources.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const providersList: CloudProvider[] = [
    'AWS (Amazon Web Services)',
    'Google Cloud Platform (GCP)',
    'Microsoft Azure',
    'OVHcloud / Hetzner (Europa Eco)',
    'Servidor Local On-Premise',
    'OpenStack Privado'
  ];

  const serviceTypesList: CloudServiceType[] = [
    'Instancia Virtual (VM/EC2)',
    'Clúster Kubernetes (EKS/GKE/AKS)',
    'Base de Datos Gestionada (PostgreSQL/Timescale)',
    'Almacenamiento de Objetos (S3/Cloud Storage)',
    'Serverless Functions / Lambdas',
    'Broker MQTT / Ingesta IoT Hub',
    'API Gateway & Load Balancer'
  ];

  const handleOpenCreate = () => {
    setEditingResource({
      id: `cloud-${Date.now()}`,
      projectId,
      name: '',
      provider: 'Google Cloud Platform (GCP)',
      region: 'europe-west1 (Bélgica - Low Carbon)',
      serviceType: 'Instancia Virtual (VM/EC2)',
      vCPU: 4,
      ramGB: 16,
      storageGB: 100,
      dailyUsageHours: 24,
      monthlyDataTransferGB: 50,
      isRenewableEnergyPowered: true,
      pueEfficiency: 1.15,
      status: 'Activo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: CloudResource) => {
    setEditingResource({ ...r });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource?.name || !editingResource?.region) return;
    onSaveCloudResource(editingResource as CloudResource);
    setIsModalOpen(false);
    setEditingResource(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <span>Infraestructura Cloud, Bases de Datos y Almacenamiento</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cómputo en la nube, PostgreSQL TimescaleDB, clústeres Kubernetes e ingesta MQTT para el gemelo digital.
          </p>
        </div>

        {canEdit && (
          <button
            id="btn-add-cloud"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Recurso Cloud</span>
          </button>
        )}
      </div>

      {/* Grid de Recursos Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map(resource => (
          <div
            key={resource.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {resource.serviceType.split('(')[0]}
                </span>
                {resource.isRenewableEnergyPowered && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>100% Renovable</span>
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {resource.name}
              </h3>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {resource.provider} · <span className="text-slate-700">{resource.region}</span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-400" /> Capacidad Cómputo:
                  </span>
                  <strong className="text-slate-800">{resource.vCPU} vCPU · {resource.ramGB} GB RAM</strong>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" /> Almacenamiento & Red:
                  </span>
                  <strong className="text-slate-800">{resource.storageGB} GB · {resource.monthlyDataTransferGB} GB/mes</strong>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Eficiencia Centro Datos:
                  </span>
                  <strong className="text-slate-800">PUE: {resource.pueEfficiency} ({resource.dailyUsageHours} h/día)</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{resource.status}</span>
              </span>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(resource)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Editar Recurso"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCloudResource(resource.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar Recurso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cloud */}
      {isModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingResource.id?.startsWith('cloud-') && editingResource.name ? 'Editar Recurso Cloud' : 'Añadir Recurso Cloud'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Recurso Cloud *</label>
                <input
                  type="text"
                  required
                  value={editingResource.name || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                  placeholder="Ej. Clúster Kubernetes Gemelo Digital Agro"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proveedor Cloud</label>
                  <select
                    value={editingResource.provider || 'Google Cloud Platform (GCP)'}
                    onChange={(e) => setEditingResource({ ...editingResource, provider: e.target.value as CloudProvider })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {providersList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Servicio</label>
                  <select
                    value={editingResource.serviceType || 'Instancia Virtual (VM/EC2)'}
                    onChange={(e) => setEditingResource({ ...editingResource, serviceType: e.target.value as CloudServiceType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {serviceTypesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Región / Datacenter *</label>
                  <input
                    type="text"
                    required
                    value={editingResource.region || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, region: e.target.value })}
                    placeholder="Ej. europe-west1 (Bélgica) o eu-south-2 (España)"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PUE (Eficiencia Datacenter)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="2.5"
                    value={editingResource.pueEfficiency || 1.15}
                    onChange={(e) => setEditingResource({ ...editingResource, pueEfficiency: parseFloat(e.target.value) || 1.15 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">vCPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    value={editingResource.vCPU || 4}
                    onChange={(e) => setEditingResource({ ...editingResource, vCPU: parseInt(e.target.value) || 4 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingResource.ramGB || 16}
                    onChange={(e) => setEditingResource({ ...editingResource, ramGB: parseInt(e.target.value) || 16 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Almacenamiento (GB)</label>
                  <input
                    type="number"
                    min="10"
                    value={editingResource.storageGB || 100}
                    onChange={(e) => setEditingResource({ ...editingResource, storageGB: parseInt(e.target.value) || 100 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tráfico Mensual Red (GB)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingResource.monthlyDataTransferGB || 50}
                    onChange={(e) => setEditingResource({ ...editingResource, monthlyDataTransferGB: parseFloat(e.target.value) || 50 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="renewable-cloud-check"
                    checked={editingResource.isRenewableEnergyPowered || false}
                    onChange={(e) => setEditingResource({ ...editingResource, isRenewableEnergyPowered: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <label htmlFor="renewable-cloud-check" className="font-semibold text-slate-700 cursor-pointer">
                    Región con Cobertura 100% Renovable (PPA)
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
                  Guardar Recurso Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
