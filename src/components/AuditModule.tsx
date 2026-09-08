import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Calendar,
  User,
  Activity,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditModuleProps {
  auditLogs: AuditLog[];
}

export const AuditModule: React.FC<AuditModuleProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Registro de Auditoría y Trazabilidad del Sistema (Audit Log)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial inmutable de modificaciones de inventario, recalculos de LCA y exportaciones para cumplimiento normativo.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-800">
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Trazabilidad Conforme a ISO 14044</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-medium">Filtrar Acción:</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          >
            <option value="all">Todas las acciones ({auditLogs.length})</option>
            <option value="Creación">Creación</option>
            <option value="Modificación">Modificación</option>
            <option value="Cálculo LCA">Cálculo LCA</option>
            <option value="Exportación">Exportación</option>
            <option value="Eliminación">Eliminación</option>
          </select>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp / Fecha</th>
                <th className="px-4 py-3">Usuario Responsable</th>
                <th className="px-4 py-3">Tipo de Acción</th>
                <th className="px-4 py-3">Entidad Afectada</th>
                <th className="px-4 py-3">Detalles de la Operación</th>
                <th className="px-4 py-3">IP Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.userEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.action === 'Cálculo LCA' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'Creación' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'Exportación' ? 'bg-purple-100 text-purple-800' :
                      log.action === 'Eliminación' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {log.ipAddress}
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
