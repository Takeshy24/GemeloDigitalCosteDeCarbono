import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProjectsModule } from './components/ProjectsModule';
import { SensorsModule } from './components/SensorsModule';
import { EdgeModule } from './components/EdgeModule';
import { CloudModule } from './components/CloudModule';
import { DigitalTwinsModule } from './components/DigitalTwinsModule';
import { LifeCycleModule } from './components/LifeCycleModule';
import { EmissionFactorsModule } from './components/EmissionFactorsModule';
import { ScenariosModule } from './components/ScenariosModule';
import { ReportsModule } from './components/ReportsModule';
import { AIModule } from './components/AIModule';
import { UsersModule } from './components/UsersModule';
import { AuditModule } from './components/AuditModule';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { MLDashboard } from './components/MLDashboard';

import {
  Project,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  EmissionFactor,
  Scenario,
  AIRecommendation,
  User,
  UserRole,
  AuditLog
} from './types';

import {
  INITIAL_PROJECTS,
  INITIAL_SENSORS,
  INITIAL_EDGE_DEVICES,
  INITIAL_CLOUD_RESOURCES,
  INITIAL_DIGITAL_TWINS,
  INITIAL_SCENARIOS,
  INITIAL_AI_RECOMMENDATIONS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS
} from './services/demoData';

import { INITIAL_EMISSION_FACTORS } from './services/emissionFactorsData';
import { CarbonCalculationEngine } from './services/carbonEngine';
import { carbonApi } from './services/api';

function readBrowserStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function mergeResources<T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] {
  const merged = new Map(localItems.map(item => [item.id, item]));
  remoteItems.forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

export default function App() {
  // --- ESTADO PRINCIPAL DE LA APLICACIÓN ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Proyectos
  const [projects, setProjects] = useState<Project[]>(() => {
    return readBrowserStorage('ap9_projects', INITIAL_PROJECTS);
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return projects[0]?.id || 'proj-001';
  });

  // Inventario de Hardware y Software
  const [sensors, setSensors] = useState<IoTSensor[]>(() => {
    return readBrowserStorage('ap9_sensors', INITIAL_SENSORS);
  });

  const [edgeDevices, setEdgeDevices] = useState<EdgeDevice[]>(() => {
    return readBrowserStorage('ap9_edge', INITIAL_EDGE_DEVICES);
  });

  const [cloudResources, setCloudResources] = useState<CloudResource[]>(() => {
    return readBrowserStorage('ap9_cloud', INITIAL_CLOUD_RESOURCES);
  });

  const [digitalTwins, setDigitalTwins] = useState<DigitalTwin[]>(() => {
    return readBrowserStorage('ap9_twins', INITIAL_DIGITAL_TWINS);
  });

  // Factores y Escenarios
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>(() => {
    return readBrowserStorage('ap9_emission_factors', INITIAL_EMISSION_FACTORS);
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    return readBrowserStorage('ap9_scenarios', INITIAL_SCENARIOS);
  });

  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(() => {
    return INITIAL_AI_RECOMMENDATIONS;
  });

  // Usuarios y Auditoría
  const [users, setUsers] = useState<User[]>(() => {
    return readBrowserStorage('ap9_users', INITIAL_USERS);
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || INITIAL_USERS[0]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return readBrowserStorage('ap9_audit_logs', INITIAL_AUDIT_LOGS);
  });
  const hasLoadedRemoteData = useRef(false);

  // PostgreSQL es la fuente compartida. localStorage solo conserva una copia de
  // trabajo para que la interfaz siga disponible si la API está temporalmente caída.
  useEffect(() => {
    if (hasLoadedRemoteData.current) return;
    hasLoadedRemoteData.current = true;
    const loadRemoteData = async () => {
      try {
        const [remoteProjects, remoteSensors, remoteEdge, remoteCloud, remoteTwins, remoteFactors, remoteScenarios, remoteUsers, remoteAudit] = await Promise.all([
          carbonApi.list<Project>('projects'), carbonApi.list<IoTSensor>('sensors'), carbonApi.list<EdgeDevice>('edge'),
          carbonApi.list<CloudResource>('cloud'), carbonApi.list<DigitalTwin>('twins'), carbonApi.list<EmissionFactor>('emission-factors'),
          carbonApi.list<Scenario>('scenarios'), carbonApi.list<User>('users'), carbonApi.list<AuditLog>('audit-logs')
        ]);
        const mergedProjects = mergeResources(projects, remoteProjects);
        const mergedSensors = mergeResources(sensors, remoteSensors);
        const mergedEdge = mergeResources(edgeDevices, remoteEdge);
        const mergedCloud = mergeResources(cloudResources, remoteCloud);
        const mergedTwins = mergeResources(digitalTwins, remoteTwins);
        const mergedFactors = mergeResources(emissionFactors, remoteFactors);
        const mergedScenarios = mergeResources(scenarios, remoteScenarios);
        const mergedUsers = mergeResources(users, remoteUsers);
        const mergedAudit = mergeResources(auditLogs, remoteAudit);

        // La API puede contener una carga parcial (por ejemplo, tras una primera
        // ejecución interrumpida). Se completan los identificadores ausentes sin
        // eliminar ni sobrescribir registros que ya existan en PostgreSQL.
        await carbonApi.bootstrap({
          projects: mergedProjects, sensors: mergedSensors, edge: mergedEdge,
          cloud: mergedCloud, twins: mergedTwins, 'emission-factors': mergedFactors,
          scenarios: mergedScenarios, users: mergedUsers, 'audit-logs': mergedAudit
        });

        setProjects(mergedProjects); setSensors(mergedSensors); setEdgeDevices(mergedEdge); setCloudResources(mergedCloud);
        setDigitalTwins(mergedTwins); setEmissionFactors(mergedFactors); setScenarios(mergedScenarios); setUsers(mergedUsers);
        setAuditLogs(mergedAudit);
        if (mergedUsers[0]) setCurrentUser(mergedUsers[0]);
        if (mergedProjects[0]) setSelectedProjectId(mergedProjects[0].id);
      } catch (error) {
        console.warn('API no disponible; se utiliza la copia local.', error);
      }
    };
    void loadRemoteData();
  // Cargar una sola vez evita sobrescribir cambios mientras el usuario edita.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- PERSISTENCIA LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('ap9_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('ap9_sensors', JSON.stringify(sensors));
  }, [sensors]);

  useEffect(() => {
    localStorage.setItem('ap9_edge', JSON.stringify(edgeDevices));
  }, [edgeDevices]);

  useEffect(() => {
    localStorage.setItem('ap9_cloud', JSON.stringify(cloudResources));
  }, [cloudResources]);

  useEffect(() => {
    localStorage.setItem('ap9_twins', JSON.stringify(digitalTwins));
  }, [digitalTwins]);

  useEffect(() => {
    localStorage.setItem('ap9_emission_factors', JSON.stringify(emissionFactors));
  }, [emissionFactors]);

  useEffect(() => {
    localStorage.setItem('ap9_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    localStorage.setItem('ap9_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Proyecto Actualmente Seleccionado
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // --- MOTOR DE CÁLCULO DE HUELLA DE CARBONO (LCA ISO 14040/14044) ---
  const currentAssessment = useMemo(() => {
    if (!selectedProject) {
      return CarbonCalculationEngine.calculateProjectAssessment(
        INITIAL_PROJECTS[0],
        sensors,
        edgeDevices,
        cloudResources,
        digitalTwins,
        emissionFactors
      );
    }
    return CarbonCalculationEngine.calculateProjectAssessment(
      selectedProject,
      sensors,
      edgeDevices,
      cloudResources,
      digitalTwins,
      emissionFactors
    );
  }, [selectedProject, sensors, edgeDevices, cloudResources, digitalTwins, emissionFactors]);

  // Helper para Registrar Auditoría
  const logAudit = (action: AuditLog['action'], entityType: string, details: string, entityId?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: '192.168.1.45'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    void carbonApi.save('audit-logs', newLog).catch(() => undefined);
  };

  // --- CONTROLADORES DE PROYECTOS ---
  const handleSaveProject = (p: Project) => {
    void carbonApi.save('projects', p).catch(() => undefined);
    setProjects(prev => {
      const exists = prev.some(item => item.id === p.id);
      if (exists) {
        logAudit('Modificación', 'Proyecto Agrícola', `Actualizados datos del proyecto ${p.name}`, p.id);
        return prev.map(item => item.id === p.id ? p : item);
      } else {
        logAudit('Creación', 'Proyecto Agrícola', `Creado nuevo proyecto ${p.name}`, p.id);
        return [...prev, p];
      }
    });
    setSelectedProjectId(p.id);
  };

  const handleDeleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    void carbonApi.remove('projects', id).catch(() => undefined);
    logAudit('Eliminación', 'Proyecto Agrícola', `Eliminado proyecto ${proj.name}`, id);
    if (selectedProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedProjectId(remaining[0].id);
    }
  };

  // --- CONTROLADORES DE SENSORES ---
  const handleSaveSensor = (sensor: IoTSensor) => {
    void carbonApi.save('sensors', sensor).catch(() => undefined);
    setSensors(prev => {
      const exists = prev.some(s => s.id === sensor.id);
      if (exists) {
        logAudit('Modificación', 'Sensor IoT', `Actualizado sensor ${sensor.name} (${sensor.model})`, sensor.id);
        return prev.map(s => s.id === sensor.id ? sensor : s);
      } else {
        logAudit('Creación', 'Sensor IoT', `Registrado nuevo sensor ${sensor.name} (${sensor.quantity} uds.)`, sensor.id);
        return [...prev, sensor];
      }
    });
  };

  const handleDeleteSensor = (id: string) => {
    setSensors(prev => prev.filter(s => s.id !== id));
    void carbonApi.remove('sensors', id).catch(() => undefined);
    logAudit('Eliminación', 'Sensor IoT', `Eliminado sensor de inventario`, id);
  };

  // --- CONTROLADORES DE EDGE ---
  const handleSaveEdge = (device: EdgeDevice) => {
    void carbonApi.save('edge', device).catch(() => undefined);
    setEdgeDevices(prev => {
      const exists = prev.some(d => d.id === device.id);
      if (exists) {
        logAudit('Modificación', 'Dispositivo Edge', `Actualizado nodo ${device.name}`, device.id);
        return prev.map(d => d.id === device.id ? device : d);
      } else {
        logAudit('Creación', 'Dispositivo Edge', `Registrado nuevo nodo de borde ${device.name}`, device.id);
        return [...prev, device];
      }
    });
  };

  const handleDeleteEdge = (id: string) => {
    setEdgeDevices(prev => prev.filter(d => d.id !== id));
    void carbonApi.remove('edge', id).catch(() => undefined);
    logAudit('Eliminación', 'Dispositivo Edge', `Eliminado nodo Edge`, id);
  };

  // --- CONTROLADORES DE CLOUD ---
  const handleSaveCloud = (resource: CloudResource) => {
    void carbonApi.save('cloud', resource).catch(() => undefined);
    setCloudResources(prev => {
      const exists = prev.some(r => r.id === resource.id);
      if (exists) {
        logAudit('Modificación', 'Recurso Cloud', `Actualizado recurso cloud ${resource.name}`, resource.id);
        return prev.map(r => r.id === resource.id ? resource : r);
      } else {
        logAudit('Creación', 'Recurso Cloud', `Añadido recurso cloud ${resource.name}`, resource.id);
        return [...prev, resource];
      }
    });
  };

  const handleDeleteCloud = (id: string) => {
    setCloudResources(prev => prev.filter(r => r.id !== id));
    void carbonApi.remove('cloud', id).catch(() => undefined);
    logAudit('Eliminación', 'Recurso Cloud', `Eliminado recurso cloud`, id);
  };

  // --- CONTROLADORES DE GEMELOS DIGITALES ---
  const handleSaveTwin = (twin: DigitalTwin) => {
    void carbonApi.save('twins', twin).catch(() => undefined);
    setDigitalTwins(prev => {
      const exists = prev.some(t => t.id === twin.id);
      if (exists) {
        logAudit('Modificación', 'Gemelo Digital', `Actualizado gemelo digital ${twin.name}`, twin.id);
        return prev.map(t => t.id === twin.id ? twin : t);
      } else {
        logAudit('Creación', 'Gemelo Digital', `Desplegado nuevo gemelo digital ${twin.name}`, twin.id);
        return [...prev, twin];
      }
    });
  };

  const handleDeleteTwin = (id: string) => {
    setDigitalTwins(prev => prev.filter(t => t.id !== id));
    void carbonApi.remove('twins', id).catch(() => undefined);
    logAudit('Eliminación', 'Gemelo Digital', `Eliminado gemelo digital`, id);
  };

  // --- CONTROLADORES DE FACTORES DE EMISIÓN ---
  const handleSaveEmissionFactor = (ef: EmissionFactor) => {
    void carbonApi.save('emission-factors', ef).catch(() => undefined);
    setEmissionFactors(prev => {
      const exists = prev.some(f => f.id === ef.id);
      if (exists) {
        logAudit('Modificación', 'Factor de Emisión', `Modificado factor ${ef.name}: ${ef.value} ${ef.unit}`, ef.id);
        return prev.map(f => f.id === ef.id ? ef : f);
      } else {
        logAudit('Creación', 'Factor de Emisión', `Añadido nuevo factor ${ef.name}: ${ef.value} ${ef.unit}`, ef.id);
        return [...prev, ef];
      }
    });
  };

  const handleDeleteEmissionFactor = (id: string) => {
    setEmissionFactors(prev => prev.filter(f => f.id !== id));
    void carbonApi.remove('emission-factors', id).catch(() => undefined);
    logAudit('Eliminación', 'Factor de Emisión', `Eliminado factor de emisión`, id);
  };

  // --- CONTROLADORES DE ESCENARIOS ---
  const handleSaveScenario = (sc: Scenario) => {
    void carbonApi.save('scenarios', sc).catch(() => undefined);
    setScenarios(prev => {
      const exists = prev.some(s => s.id === sc.id);
      if (exists) {
        logAudit('Modificación', 'Escenario Arquitectónico', `Actualizado escenario ${sc.name}`, sc.id);
        return prev.map(s => s.id === sc.id ? sc : s);
      } else {
        logAudit('Creación', 'Escenario Arquitectónico', `Creado nuevo escenario de simulación ${sc.name}`, sc.id);
        return [...prev, sc];
      }
    });
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    void carbonApi.remove('scenarios', id).catch(() => undefined);
    logAudit('Eliminación', 'Escenario Arquitectónico', `Eliminado escenario`, id);
  };

  // --- CONTROLADORES DE USUARIOS ---
  const handleSaveUser = (u: User) => {
    void carbonApi.save('users', u).catch(() => undefined);
    setUsers(prev => {
      const exists = prev.some(item => item.id === u.id);
      if (exists) {
        logAudit('Modificación', 'Usuario RBAC', `Actualizados datos de usuario ${u.email}`, u.id);
        return prev.map(item => item.id === u.id ? u : item);
      } else {
        logAudit('Creación', 'Usuario RBAC', `Registrado nuevo usuario ${u.email} con rol ${u.role}`, u.id);
        return [...prev, u];
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    void carbonApi.remove('users', id).catch(() => undefined);
    logAudit('Eliminación', 'Usuario RBAC', `Eliminado usuario`, id);
  };

  const handleRoleChange = (newRole: UserRole) => {
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    void carbonApi.save('users', updated).catch(() => undefined);
    logAudit('Modificación', 'Rol de Sesión', `Cambiado rol de sesión a ${newRole}`, currentUser.id);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans antialiased text-slate-800">
      {/* Sidebar hamburguesa (drawer overlay) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentUser.role}
        projectCount={projects.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUserRole={currentUser.role}
        onRoleChange={handleRoleChange}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Área Principal de Trabajo */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Encabezado Superior con Selector de Proyecto y RBAC */}
        <Header
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={(proj) => {
            setSelectedProjectId(proj.id);
            logAudit('Cálculo LCA', 'Proyecto Seleccionado', `Cambiado contexto de análisis a ${proj.name}`, proj.id);
          }}
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onOpenDocs={() => setIsDocsOpen(true)}
          totalEmissionsKg={currentAssessment.totalEmissionsKgCO2e}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Contenedor de Vistas */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70">
          {activeTab === 'dashboard' && (
            <Dashboard
              project={selectedProject}
              assessment={currentAssessment}
              sensors={sensors.filter(s => s.projectId === selectedProject.id)}
              edgeDevices={edgeDevices.filter(e => e.projectId === selectedProject.id)}
              cloudResources={cloudResources.filter(c => c.projectId === selectedProject.id)}
              digitalTwins={digitalTwins.filter(d => d.projectId === selectedProject.id)}
              scenarios={scenarios}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsModule
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={(proj) => setSelectedProjectId(proj.id)}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'sensors' && (
            <SensorsModule
              sensors={sensors}
              projectId={selectedProject.id}
              onSaveSensor={handleSaveSensor}
              onDeleteSensor={handleDeleteSensor}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'edge' && (
            <EdgeModule
              edgeDevices={edgeDevices}
              projectId={selectedProject.id}
              onSaveEdgeDevice={handleSaveEdge}
              onDeleteEdgeDevice={handleDeleteEdge}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'cloud' && (
            <CloudModule
              cloudResources={cloudResources}
              projectId={selectedProject.id}
              onSaveCloudResource={handleSaveCloud}
              onDeleteCloudResource={handleDeleteCloud}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'digital-twins' && (
            <DigitalTwinsModule
              digitalTwins={digitalTwins}
              projectId={selectedProject.id}
              onSaveDigitalTwin={handleSaveTwin}
              onDeleteDigitalTwin={handleDeleteTwin}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'lifecycle' && (
            <LifeCycleModule
              assessment={currentAssessment}
              project={selectedProject}
            />
          )}

          {activeTab === 'emission-factors' && (
            <EmissionFactorsModule
              emissionFactors={emissionFactors}
              onSaveEmissionFactor={handleSaveEmissionFactor}
              onDeleteEmissionFactor={handleDeleteEmissionFactor}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenariosModule
              scenarios={scenarios}
              onSaveScenario={handleSaveScenario}
              onDeleteScenario={handleDeleteScenario}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              project={selectedProject}
              assessment={currentAssessment}
              sensors={sensors.filter(s => s.projectId === selectedProject.id)}
              edgeDevices={edgeDevices.filter(e => e.projectId === selectedProject.id)}
              cloudResources={cloudResources.filter(c => c.projectId === selectedProject.id)}
              digitalTwins={digitalTwins.filter(d => d.projectId === selectedProject.id)}
              emissionFactors={emissionFactors}
              scenarios={scenarios}
              aiRecommendations={aiRecommendations}
              currentUser={`${currentUser.name} ${currentUser.lastName}`}
              onExport={(format) => logAudit('Exportación', 'Informe de sostenibilidad', `Descargado informe ${format} para ${selectedProject.name}`, selectedProject.id)}
            />
          )}

          {activeTab === 'ai-advisor' && (
            <AIModule
              project={selectedProject}
              assessment={currentAssessment}
              recommendations={aiRecommendations}
            />
          )}

          {activeTab === 'users' && (
            <UsersModule
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              currentUserRole={currentUser.role}
            />
          )}

          {activeTab === 'audit-logs' && (
            <AuditModule
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'architecture' && (
            <div className="p-6">
              <ArchitectureDocsModal
                isOpen={true}
                onClose={() => setActiveTab('dashboard')}
              />
            </div>
          )}
          {activeTab === 'ml-models' && (
            <MLDashboard />
          )}

        </main>
      </div>

      {/* Modal de Arquitectura y Código FastAPI */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
