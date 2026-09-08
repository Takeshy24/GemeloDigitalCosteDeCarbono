import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  Server,
  Cloud,
  Layers,
  Activity,
  Sliders,
  GitCompare,
  FileSpreadsheet,
  Bot,
  Users,
  ShieldCheck,
  Code2,
  Leaf,
  Brain,
  X,
  Shield,
  HelpCircle,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'sensors'
  | 'edge'
  | 'cloud'
  | 'digital-twins'
  | 'lifecycle'
  | 'emission-factors'
  | 'scenarios'
  | 'reports'
  | 'ai-advisor'
  | 'ml-models'
  | 'users'
  | 'audit-logs'
  | 'architecture';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  projectCount: number;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenDocs: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Gestión & Operación',
    items: [
      { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
      { id: 'projects', label: 'Proyectos Agrícolas', icon: FolderKanban, badge: true },
    ],
  },
  {
    label: 'Infraestructura',
    items: [
      { id: 'sensors', label: 'Sensores IoT en Campo', icon: Cpu },
      { id: 'edge', label: 'Infraestructura Edge', icon: Server },
      { id: 'cloud', label: 'Recursos Cloud & BD', icon: Cloud },
      { id: 'digital-twins', label: 'Gemelos Digitales (DT)', icon: Layers },
    ],
  },
  {
    label: 'Cálculo & Sostenibilidad',
    items: [
      { id: 'lifecycle', label: 'Ciclo de Vida (LCA)', icon: Activity },
      { id: 'emission-factors', label: 'Factores de Emisión', icon: Sliders },
      { id: 'scenarios', label: 'Comparar Escenarios', icon: GitCompare },
      { id: 'reports', label: 'Informes PDF/Word/Excel', icon: FileSpreadsheet },
      { id: 'ai-advisor', label: 'Asistente IA Carbono', icon: Bot, highlight: 'teal' },
      { id: 'ml-models', label: 'Pipeline ML (5 modelos)', icon: Brain, highlight: 'violet' },
    ],
  },
  {
    label: 'Sistema & Gobernanza',
    adminOnly: false,
    items: [
      { id: 'users', label: 'Usuarios & RBAC', icon: Users, adminOnly: true },
      { id: 'audit-logs', label: 'Registro de Auditoría', icon: ShieldCheck, adminOnly: true },
      { id: 'architecture', label: 'Arquitectura & FastAPI', icon: Code2 },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  projectCount,
  isOpen,
  onClose,
  currentUserRole,
  onRoleChange,
  onOpenDocs,
}) => {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleNav = (id: string) => {
    setActiveTab(id as ActiveTab);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú de navegación"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">AP-9 Carbon Twin</span>
              <span className="text-[10px] text-emerald-400 font-medium">LCA en Agricultura de Precisión</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 py-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                {section.label}
              </div>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  if ((item as any).adminOnly && userRole === 'Consulta') return null;
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const highlight = (item as any).highlight as string | undefined;

                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}`}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all text-left text-sm ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : highlight === 'teal'
                          ? 'text-teal-300 hover:bg-teal-900/40'
                          : highlight === 'violet'
                          ? 'text-violet-300 hover:bg-violet-900/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white'
                          : highlight === 'teal' ? 'text-teal-400'
                          : highlight === 'violet' ? 'text-violet-400'
                          : 'text-slate-400'
                        }`} />
                        <span>{item.label}</span>
                      </div>
                      {(item as any).badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {projectCount}
                        </span>
                      )}
                      {!isActive && highlight === 'teal' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-800/60 text-teal-300 uppercase tracking-wider">AI</span>
                      )}
                      {!isActive && highlight === 'violet' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-800/60 text-violet-300 uppercase tracking-wider">ML</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — Rol + Docs */}
        <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-950/40">
          {/* Selector de Rol */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Rol activo</div>
              <select
                id="role-selector"
                value={currentUserRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="text-xs font-bold text-slate-200 bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-full"
              >
                <option value="Administrador">Administrador</option>
                <option value="Investigador/Analista">Investigador / Analista</option>
                <option value="Consulta">Consulta (Solo Lectura)</option>
              </select>
            </div>
          </div>

          {/* Enlace al Laboratorio Streamlit */}
          <a
            id="sidebar-streamlit-lab"
            href="http://localhost:8501"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/40 hover:bg-indigo-900/50 transition-colors text-indigo-300 hover:text-white text-xs font-semibold"
          >
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              <span>Laboratorio Streamlit</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          {/* Docs */}
          <button
            id="btn-open-arch-docs"
            onClick={() => { onOpenDocs(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Arquitectura & FastAPI Docs
          </button>

          {/* Status */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Motor LCA Activo
            </span>
            <span className="font-mono text-slate-500">v1.0-FastAPI</span>
          </div>
        </div>
      </aside>
    </>
  );
};
