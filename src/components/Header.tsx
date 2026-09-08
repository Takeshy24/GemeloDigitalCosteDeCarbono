import React from 'react';
import {
  FolderTree,
  Menu,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { Project, User, UserRole } from '../types';

interface HeaderProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (proj: Project) => void;
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenDocs: () => void;
  totalEmissionsKg: number;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  currentUser,
  onToggleSidebar,
  totalEmissionsKg,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 shadow-sm">

      {/* Hamburger */}
      <button
        id="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0 border-r border-slate-200 pr-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-xs font-bold text-slate-800">AP-9 Carbon Twin</div>
          <div className="text-[9px] text-emerald-600 font-semibold">LCA Agricultura</div>
        </div>
      </div>

      {/* Project selector — ocupa todo el espacio restante */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 shrink-0">
          <FolderTree className="w-3.5 h-3.5 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-0.5">
            Proyecto activo
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <select
              id="project-selector"
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              aria-label="Seleccionar proyecto agrícola"
              className="text-sm font-semibold text-slate-800 bg-transparent border-none p-0 pr-5 focus:ring-0 cursor-pointer truncate max-w-full"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.cropType} · {p.agriculturalAreaHectares} ha
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 -ml-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI pill */}
      <div className="hidden md:flex flex-col items-end shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 leading-tight">
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Huella LCA</span>
        <span className="text-sm font-extrabold text-slate-900">
          {totalEmissionsKg.toFixed(1)}
          <span className="text-[10px] font-medium text-slate-500 ml-1">kg CO₂e</span>
        </span>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 shrink-0 pl-1 border-l border-slate-200">
        <img
          src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
          alt={currentUser.name}
          className="w-9 h-9 rounded-full border-2 border-slate-200 object-cover"
        />
        <div className="hidden lg:block leading-tight">
          <div className="text-xs font-bold text-slate-800">{currentUser.name} {currentUser.lastName}</div>
          <div className="text-[9px] text-emerald-600 font-semibold">{currentUser.role}</div>
        </div>
      </div>
    </header>
  );
};
