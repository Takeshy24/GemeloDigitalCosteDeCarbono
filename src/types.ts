/**
 * Tipos de datos para AP-9: Análisis del Coste de Carbono de Gemelos Digitales
 */

export type UserRole = 'Administrador' | 'Investigador/Analista' | 'Consulta';

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  username?: string;
  role: UserRole;
  avatarUrl?: string;
  organization?: string;
  department?: string;
  isActive?: boolean;
  registeredAt?: string;
  lastLogin?: string;
  status?: 'Activo' | 'Inactivo';
}

export type CropType = 
  | 'Maíz'
  | 'Trigo'
  | 'Vid / Viñedos'
  | 'Olivo'
  | 'Hortalizas en Invernadero'
  | 'Frutales (Cítricos/Aguacate)'
  | 'Cereales Extensivos'
  | 'Soja / Leguminosas';

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  cropType: CropType;
  agriculturalAreaHectares: number;
  startDate: string;
  endDate?: string;
  status: 'Planificación' | 'En Operación' | 'Finalizado' | 'En Pausa';
  responsibleUser: string;
  carbonBudgetKgCO2e?: number;
  createdAt: string;
  updatedAt: string;
}

export type SensorType =
  | 'Humedad del Suelo'
  | 'Temperatura y Humedad Ambiental'
  | 'pH y Conductividad Eléctrica (EC)'
  | 'Radiación Solar / PAR'
  | 'Estación Meteorológica Compacta'
  | 'Cámara Multiespectral / NDVI'
  | 'Sensor de Nutrientes NPK'
  | 'Dendrómetro / Flujo de Savia'
  | 'Anemómetro y Pluviómetro';

export type CommunicationTech = 
  | 'LoRaWAN'
  | 'NB-IoT'
  | 'ZigBee'
  | 'Wi-Fi 6'
  | '4G/LTE-M'
  | '5G NR'
  | 'Bluetooth BLE'
  | 'Cable RS485/Modbus';

export interface IoTSensor {
  id: string;
  projectId: string;
  name: string;
  sensorType: SensorType;
  manufacturer: string;
  model: string;
  quantity: number;
  powerWatts: number;
  dailyOperatingHours: number;
  lifespanYears: number;
  weightGrams: number;
  mainMaterials: string[];
  transmissionIntervalMinutes: number;
  dataSentPerMessageKB: number;
  communicationTech: CommunicationTech;
  acquisitionDate: string;
  status: 'Activo' | 'Mantenimiento' | 'Retirado';
  notes?: string;
}

export type EdgeDeviceType =
  | 'Microcomputador (Raspberry Pi 5/4)'
  | 'Acelerador IA Edge (NVIDIA Jetson Orin Nano)'
  | 'Gateway Industrial IoT (Advantech/Siemens)'
  | 'Servidor de Granja Edge (Intel Xeon/NUC)'
  | 'Microcontrolador Inteligente (ESP32/STM32)'
  | 'Dispositivo Edge Rugerizado Solar';

export interface EdgeDevice {
  id: string;
  projectId: string;
  name: string;
  deviceType: EdgeDeviceType;
  manufacturer: string;
  model: string;
  cpu: string;
  ramGB: number;
  storageGB: number;
  powerWatts: number;
  dailyOperatingHours: number;
  lifespanYears: number;
  quantity: number;
  operatingSystem: string;
  location: string;
  weightKg: number;
  isSolarPowered?: boolean;
  status: 'Operativo' | 'En Espera' | 'Mantenimiento' | 'Desmantelado';
}

export type CloudProvider = 
  | 'Google Cloud Platform (GCP)'
  | 'Amazon Web Services (AWS)'
  | 'AWS (Amazon Web Services)'
  | 'Microsoft Azure'
  | 'Data Center Privado / On-Premise'
  | 'OVHcloud / Hetzner (Europa Eco)'
  | 'Servidor Local On-Premise'
  | 'OpenStack Privado'
  | 'Proveedor Verde Neutral en Carbono';

export type CloudServiceType =
  | 'Instancia Virtual (VM/EC2)'
  | 'Máquina Virtual / Compute Engine'
  | 'Clúster Kubernetes (EKS/GKE/AKS)'
  | 'Clúster Kubernetes (GKE/EKS)'
  | 'Base de Datos Gestionada (PostgreSQL/Timescale)'
  | 'Base de Datos de Series Temporales (InfluxDB/Timescale)'
  | 'Almacenamiento de Objetos (S3/Cloud Storage)'
  | 'Serverless Functions / Lambdas'
  | 'Plataforma Serverless / Cloud Functions'
  | 'Broker MQTT / Ingesta IoT Hub'
  | 'API Gateway & Load Balancer'
  | 'Servicio de IA / Inferencia LLM/ML';

export interface CloudResource {
  id: string;
  projectId: string;
  name: string;
  provider: CloudProvider;
  region: string;
  serviceType: CloudServiceType;
  vCPU: number;
  ramGB: number;
  storageGB: number;
  dailyUsageHours: number;
  monthlyDataTransferGB: number;
  estimatedPowerConsumptionKWhMonth?: number;
  isRenewableEnergyPowered: boolean;
  pueEfficiency?: number;
  carbonNeutralCommitment?: string;
  status?: string;
}

export type DigitalTwinType =
  | 'Dinámica del Suelo y Riego (Balance Hídrico)'
  | 'Gemelo Hidrológico de Riego de Precisión'
  | 'Crecimiento del Cultivo y Rendimiento (Crop Growth)'
  | 'Gemelo Fenológico y Crecimiento de Cultivo'
  | 'Microclima y Predicción de Heladas/Plagas'
  | 'Gemelo Microclimático y Alerta de Heladas'
  | 'Fertirrigación de Precisión y Nutrientes'
  | 'Gemelo Fitosanitario y Detección de Plagas'
  | 'Gemelo de Balance de Nutrientes y Fertilización'
  | 'Gemelo Holístico de Parcela / Explotación'
  | 'Gemelo Integral de Rendimiento Agrícola';

export type AIModelType =
  | 'Mecanicista / Físico (AquaCrop/DSSAT)'
  | 'Machine Learning Clásico (Random Forest / XGBoost)'
  | 'Deep Learning (LSTM / Redes Convolucionales)'
  | 'Híbrido Físico-Estadístico (PINN)'
  | 'Reglas Expertas y Balance de Masas';

export interface DigitalTwin {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: DigitalTwinType;
  aiModelType: AIModelType | string;
  updateFrequencyMinutes: number;
  dailyProcessedDataMB: number;
  associatedSensorIds: string[];
  associatedEdgeDeviceIds: string[];
  associatedCloudResourceIds: string[];
  simulationHorizonDays?: number;
  carbonComputeOverheadKgCO2e?: number;
  operationalStatus: 'Activo' | 'Calibración' | 'Inactivo' | 'En Ejecución';
  annualRunHours: number;
}

export type EmissionFactorCategory =
  | 'Red Eléctrica (Mix Energético)'
  | 'Mix Eléctrico / Red'
  | 'Fabricación y Materiales'
  | 'Fabricación Hardware & Materiales'
  | 'Transporte y Logística'
  | 'Transferencia de Datos'
  | 'Redes y Transmisión de Datos'
  | 'Cloud & Data Centers'
  | 'Cómputo en la Nube y Almacenamiento'
  | 'Fin de Vida y Reciclaje'
  | 'Fin de Vida y Reciclaje WEEE';

export interface EmissionFactor {
  id: string;
  name: string;
  category: EmissionFactorCategory;
  unit: string;
  value: number;
  source: string;
  countryOrRegion: string;
  year: number;
  description?: string;
  notes?: string;
  isDefault?: boolean;
  isDemoData: boolean;
}

export interface LifeCycleBreakdown {
  manufacturingKgCO2e: number;
  transportKgCO2e: number;
  installationKgCO2e: number;
  operationKgCO2e: number;
  maintenanceKgCO2e: number;
  endOfLifeKgCO2e: number;
  totalKgCO2e: number;
}

export interface ComponentCarbonResult {
  componentId: string;
  componentName: string;
  category: 'Sensor' | 'Edge' | 'Cloud' | 'DigitalTwin' | 'Comunicaciones';
  annualEnergyKWh: number;
  operationalEmissionsKgCO2e: number;
  embodiedEmissionsKgCO2e: number;
  totalAnnualEmissionsKgCO2e: number;
  lifeCycleTotalKgCO2e: number;
  percentageOfTotal: number;
}

export interface ProjectCarbonAssessment {
  projectId: string;
  assessmentDate: string;
  analysisPeriodYears: number;
  totalEmissionsKgCO2e: number;
  totalEmissionsTonnesCO2e: number;
  totalEnergyConsumptionKWh: number;
  emissionsPerHectareKgCO2e: number;
  emissionsPerDayKgCO2e: number;
  
  byCategory: {
    sensors: LifeCycleBreakdown;
    edge: LifeCycleBreakdown;
    cloud: LifeCycleBreakdown;
    digitalTwins: LifeCycleBreakdown;
    network: LifeCycleBreakdown;
  };
  
  byLifeCycleStage: LifeCycleBreakdown;
  
  componentsList: ComponentCarbonResult[];
  
  keyInsights: {
    primaryEmissionDriver: string;
    manufacturingSharePercent: number;
    operationSharePercent: number;
    cloudSharePercent: number;
    edgeSharePercent: number;
    sensorSharePercent: number;
  };
}

export type ArchitectureType = 
  | 'Cloud-Centric'
  | 'Edge-Centric'
  | 'Híbrida Optimizada'
  | 'Solar-Offgrid'
  | '100% Cloud (Centralizada)'
  | 'Edge-Dominant (Procesamiento en Campo)'
  | 'Ultra-Low-Power Agrícola';

export interface Scenario {
  id: string;
  projectId?: string;
  name: string;
  description: string;
  architectureType: ArchitectureType;
  edgeDataFilteringPercent?: number;
  cloudProcessingSharePercent?: number;
  edgeProcessingSharePercent?: number;
  renewableEnergyPercent?: number;
  transmissionFrequencyReductionPercent?: number;
  sensorCount?: number;
  edgeDeviceCount?: number;
  cloudComputeHoursDaily?: number;
  cloudDataStorageGB?: number;
  transmissionIntervalMinutes?: number;
  isRenewableCloud?: boolean;
  isSolarEdge?: boolean;
  estimatedTotalKgCO2e: number;
  estimatedEnergyKWh: number;
  costEstimateUSD: number;
  latencyMs: number;
  isBaseline: boolean;
}

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT_REPORT'
  | 'RUN_CALCULATION'
  | 'LOGIN'
  | 'CONFIG_CHANGE'
  | 'Creación'
  | 'Modificación'
  | 'Eliminación'
  | 'Exportación'
  | 'Cálculo LCA';

export interface AuditLog {
  id: string;
  timestamp: string;
  username?: string;
  userEmail?: string;
  userId?: string;
  userRole?: UserRole;
  action: AuditAction;
  entity?: string;
  entityType?: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  category: 'Optimización Edge' | 'Eficiencia Cloud' | 'Ahorro en Sensores' | 'Arquitectura Gemelo Digital' | 'Mix Energético' | string;
  potentialReductionKgCO2e: number;
  reductionPercentage: number;
  impactLevel?: 'Alto' | 'Medio' | 'Moderado';
  difficulty?: 'Baja' | 'Media' | 'Alta';
  implementationEffort?: 'Bajo' | 'Medio' | 'Alto' | string;
  description: string;
  actionSteps?: string[];
  scientificBasis: string;
}

export interface ReportConfig {
  title?: string;
  reportTitle?: string;
  projectId?: string;
  scenarioId?: string;
  includeLCA?: boolean;
  includeLCAStages?: boolean;
  includeSensors?: boolean;
  includeEdge?: boolean;
  includeCloud?: boolean;
  includeDigitalTwins?: boolean;
  includeAIRecommendations?: boolean;
  includeComparison?: boolean;
  includeScenarios?: boolean;
  reportAuthor?: string;
  organizationName?: string;
  customNotes?: string;
  notes?: string;
}
