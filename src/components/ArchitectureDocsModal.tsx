import React, { useState } from 'react';
import {
  Code2,
  Database,
  Server,
  Layers,
  Terminal,
  FileCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
  X
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fastapi' | 'postgres' | 'tests'>('overview');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fastApiCode = `# backend/main.py
"""
AP-9: El coste de carbono de los gemelos digitales:
Un análisis del ciclo de vida de la infraestructura de borde, nube y sensores en la agricultura de precisión.
FastAPI Backend Core Engine con endpoints de cálculo LCA, gestión de proyectos y auditoría.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
from datetime import datetime

app = FastAPI(
    title="AP-9 Carbon Footprint & Digital Twins API",
    description="Motor de cálculo de Ciclo de Vida (LCA) e impacto ambiental para infraestructura IoT/Edge/Cloud agrícola.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESQUEMAS PYDANTIC ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: str
    crop_type: str
    agricultural_area_hectares: float
    carbon_budget_kg_co2e: Optional[float] = 1000.0

class CarbonCalculationRequest(BaseModel):
    project_id: str
    analysis_period_years: int = 3
    include_manufacturing: bool = True
    include_transport: bool = True
    include_installation: bool = True
    include_operation: bool = True
    include_maintenance: bool = True
    include_end_of_life: bool = True

class LCABreakdownResponse(BaseModel):
    project_id: str
    total_emissions_kg_co2e: float
    total_energy_kwh: float
    emissions_per_hectare: float
    manufacturing_kg: float
    transport_kg: float
    installation_kg: float
    operation_kg: float
    maintenance_kg: float
    end_of_life_kg: float

# --- ENDPOINTS REST ---
@app.get("/api/health", tags=["Salud"])
async def health_check():
    return {
        "status": "online",
        "service": "AP-9 Carbon Engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/projects", tags=["Proyectos"], status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    # Lógica de inserción en base de datos PostgreSQL
    return {"id": f"proj-{int(datetime.utcnow().timestamp())}", **project.dict(), "status": "Planificación"}

@app.post("/api/calculate-lca", tags=["Cálculo LCA"], response_model=LCABreakdownResponse)
async def calculate_lca(req: CarbonCalculationRequest):
    """
    Ejecuta el algoritmo de Evaluación de Ciclo de Vida (ISO 14040/14044).
    Calcula: Total = Σ (Fabricación + Transporte + Instalación + Operación + Mantenimiento - Crédito Reciclaje)
    """
    # Ejemplo de cálculo normalizado
    mfg = 95.4
    trans = 14.2
    inst = 8.5
    op = 245.8
    maint = 22.1
    eol = -7.5
    total = mfg + trans + inst + op + maint + eol
    
    return LCABreakdownResponse(
        project_id=req.project_id,
        total_emissions_kg_co2e=total,
        total_energy_kwh=1150.0,
        emissions_per_hectare=total / 120.0,
        manufacturing_kg=mfg,
        transport_kg=trans,
        installation_kg=inst,
        operation_kg=op,
        maintenance_kg=maint,
        end_of_life_kg=eol
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`;

  const postgresDDL = `-- database/schema.sql
-- AP-9: Esquema Relacional de Base de Datos PostgreSQL 18
-- Modelo entidad-relación para cálculo de huella de carbono y gemelos digitales en agricultura.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Investigador/Analista', 'Consulta')),
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Proyectos Agrícolas
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    agricultural_area_hectares NUMERIC(10,2) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Planificación',
    carbon_budget_kg_co2e NUMERIC(12,2) DEFAULT 1000.0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Sensores IoT
CREATE TABLE iot_sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    power_watts NUMERIC(8,4) NOT NULL,
    daily_operating_hours NUMERIC(4,2) DEFAULT 24.0,
    lifespan_years INT DEFAULT 5,
    weight_grams NUMERIC(8,2) DEFAULT 300.0,
    communication_tech VARCHAR(50) DEFAULT 'LoRaWAN',
    transmission_interval_minutes INT DEFAULT 15,
    data_sent_per_message_kb NUMERIC(8,4) DEFAULT 0.2,
    status VARCHAR(50) DEFAULT 'Activo'
);

-- 4. Tabla de Dispositivos Edge
CREATE TABLE edge_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100) NOT NULL,
    cpu VARCHAR(100),
    ram_gb INT NOT NULL,
    storage_gb INT NOT NULL,
    power_watts NUMERIC(8,2) NOT NULL,
    daily_operating_hours NUMERIC(4,2) DEFAULT 24.0,
    quantity INT DEFAULT 1,
    is_solar_powered BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Operativo'
);

-- 5. Tabla de Recursos Cloud
CREATE TABLE cloud_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    vcpu INT NOT NULL,
    ram_gb INT NOT NULL,
    storage_gb INT NOT NULL,
    monthly_data_transfer_gb NUMERIC(10,2) DEFAULT 50.0,
    is_renewable_energy BOOLEAN DEFAULT TRUE,
    pue_efficiency NUMERIC(4,2) DEFAULT 1.15,
    status VARCHAR(50) DEFAULT 'Activo'
);

-- 6. Tabla de Gemelos Digitales
CREATE TABLE digital_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    twin_type VARCHAR(100) NOT NULL,
    ai_model_type VARCHAR(100) NOT NULL,
    update_frequency_minutes INT DEFAULT 30,
    daily_processed_data_mb NUMERIC(10,2) DEFAULT 300.0,
    annual_run_hours INT DEFAULT 8760,
    carbon_compute_overhead_kg NUMERIC(10,2) DEFAULT 15.0,
    operational_status VARCHAR(50) DEFAULT 'En Ejecución'
);

-- 7. Tabla de Factores de Emisión
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    value NUMERIC(12,6) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL,
    country_or_region VARCHAR(100),
    year INT DEFAULT 2024,
    is_demo_data BOOLEAN DEFAULT FALSE
);

-- 8. Tabla de Auditoría Inmutable
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const unitTestsCode = `# backend/tests/test_carbon_engine.py
"""
Suite de Pruebas Unitarias Automatizadas (Pytest)
Validación del motor de cálculo de Huella de Carbono y Ciclo de Vida (LCA)
"""

import pytest
from services.carbon_engine import CarbonEngine, HardwareSpecs, LifeCycleStages

def test_sensor_energy_consumption():
    specs = HardwareSpecs(
        power_watts=0.3,
        daily_hours=24,
        quantity=10,
        lifespan_years=3
    )
    # 0.3W * 24h * 365d * 10uds / 1000 = 26.28 kWh/año
    annual_kwh = CarbonEngine.calculate_annual_energy_kwh(specs)
    assert round(annual_kwh, 2) == 26.28

def test_lca_lifecycle_stages_balance():
    # Comprobar que Total LCA = Mfg + Trans + Inst + Op + Maint + EoL
    mfg = 100.0
    trans = 10.0
    inst = 5.0
    op = 200.0
    maint = 15.0
    eol = -8.0  # Crédito reciclaje
    
    total = CarbonEngine.compute_total_lca(mfg, trans, inst, op, maint, eol)
    assert total == 322.0
    assert total > 0

def test_solar_powered_edge_reduces_grid_emissions():
    specs_grid = HardwareSpecs(power_watts=15, daily_hours=24, is_solar=False)
    specs_solar = HardwareSpecs(power_watts=15, daily_hours=24, is_solar=True)
    
    emissions_grid = CarbonEngine.calculate_operational_emissions(specs_grid, grid_factor=0.25)
    emissions_solar = CarbonEngine.calculate_operational_emissions(specs_solar, grid_factor=0.25)
    
    assert emissions_grid > 0
    assert emissions_solar == 0.0`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full h-[85vh] border border-slate-700 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Arquitectura Técnica, Backend FastAPI y Base de Datos PostgreSQL
              </h3>
              <p className="text-[11px] text-slate-400">
                Diseño 3 capas: Next.js 15/React 19 + Python FastAPI + PostgreSQL 18 local
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Vista General & Arquitectura
          </button>
          <button
            onClick={() => setActiveTab('fastapi')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'fastapi' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            FastAPI Backend (Python)
          </button>
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'postgres' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Esquema PostgreSQL (DDL)
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'tests' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pruebas Unitarias (Pytest)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4 font-sans text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <Server className="w-4 h-4" />
                    <span>Capa de Presentación</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Next.js 15 + React 19 + Tailwind CSS + Recharts + Three.js. Tableros interactivos, visor de gemelos 3D, simulación de escenarios y exportación PDF/Word/Excel.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
                    <Code2 className="w-4 h-4" />
                    <span>Capa de Servicios & API</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Python FastAPI con SQLAlchemy. Motor desacoplado de cálculo de ciclo de vida (ISO 14040/14044), persistencia CRUD, pipeline ML y asesor IA con respuesta local cuando no hay proveedor externo configurado.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
                    <Database className="w-4 h-4" />
                    <span>Capa de Persistencia</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    PostgreSQL 18 local con almacenamiento JSONB flexible por recurso, índices por tipo/proyecto y registros persistentes de auditoría.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Metodología de Cálculo de Huella de Carbono</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El cálculo total implementa la ecuación estandarizada:
                </p>
                <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs border border-slate-800">
                  Total LCA = Embodied (Fabricación) + Transporte + Instalación + Operacional (Σ [Potencia × Horas × Factor Red × PUE]) + Mantenimiento - Crédito Fin de Vida
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fastapi' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-sans">backend/main.py</span>
                <button
                  onClick={() => copyToClipboard(fastApiCode, 'fastapi')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSection === 'fastapi' ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-emerald-300 text-[11px] leading-relaxed border border-slate-800">
                {fastApiCode}
              </pre>
            </div>
          )}

          {activeTab === 'postgres' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-sans">database/schema.sql</span>
                <button
                  onClick={() => copyToClipboard(postgresDDL, 'postgres')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSection === 'postgres' ? '¡Copiado!' : 'Copiar DDL'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-cyan-300 text-[11px] leading-relaxed border border-slate-800">
                {postgresDDL}
              </pre>
            </div>
          )}

          {activeTab === 'tests' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-sans">backend/tests/test_carbon_engine.py</span>
                <button
                  onClick={() => copyToClipboard(unitTestsCode, 'tests')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSection === 'tests' ? '¡Copiado!' : 'Copiar Tests'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-purple-300 text-[11px] leading-relaxed border border-slate-800">
                {unitTestsCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
