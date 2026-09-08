import {
  Project,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  User,
  AuditLog,
  AIRecommendation,
  Scenario
} from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Dr. Carlos',
    lastName: 'Verástegui',
    email: 'cverasteguic@unitru.edu.pe',
    username: 'cverastegui',
    role: 'Administrador',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10',
    status: 'Activo',
    lastLogin: '2026-08-27 10:45',
    department: 'Cátedra de Agricultura de Precisión e IA'
  },
  {
    id: 'usr-2',
    name: 'Elena',
    lastName: 'Sánchez Morales',
    email: 'elena.sanchez@agricarbon.org',
    username: 'esanchez',
    role: 'Investigador/Analista',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2025-02-14',
    status: 'Activo',
    lastLogin: '2026-08-26 18:20',
    department: 'Departamento de Sostenibilidad y LCA'
  },
  {
    id: 'usr-3',
    name: 'Marc',
    lastName: 'Vidal Costa',
    email: 'marc.vidal@cooperativa-agro.es',
    username: 'mvidal',
    role: 'Consulta',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2025-03-01',
    status: 'Activo',
    lastLogin: '2026-08-25 14:10',
    department: 'Comunidad de Regantes y Agricultores'
  }
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Finca AgroTech Valle Verde - Maíz y Regadío Variable',
    description: 'Proyecto piloto de agricultura de precisión para optimización hídrica y nutricional en 120 hectáreas de cultivo de maíz mediante gemelo digital acoplado a red LoRaWAN y dispositivos Edge Jetson.',
    location: 'Valle Central / Finca La Vega',
    coordinates: { lat: 39.4699, lng: -0.3763 },
    cropType: 'Maíz',
    agriculturalAreaHectares: 120,
    startDate: '2025-03-01',
    endDate: '2027-10-31',
    status: 'En Operación',
    responsibleUser: 'Dr. Carlos Verástegui',
    carbonBudgetKgCO2e: 1200,
    createdAt: '2025-02-15',
    updatedAt: '2026-08-27'
  },
  {
    id: 'proj-2',
    name: 'Viñedo de Precisión SmartVineyards D.O.',
    description: 'Monitoreo microclimático de alta resolución, detección precoz de mildiu y oídio con cámaras multiespectrales Edge y gemelo fenológico en viñedos en ladera.',
    location: 'Ribera / Comarca Vinícola',
    coordinates: { lat: 41.6523, lng: -4.7245 },
    cropType: 'Vid / Viñedos',
    agriculturalAreaHectares: 45,
    startDate: '2025-01-15',
    status: 'En Operación',
    responsibleUser: 'Elena Sánchez Morales',
    carbonBudgetKgCO2e: 750,
    createdAt: '2025-01-10',
    updatedAt: '2026-08-26'
  },
  {
    id: 'proj-3',
    name: 'Invernadero Hidropónico Automatizado SmartGreens',
    description: 'Control ambiental en ciclo cerrado para hortalizas de alto valor con sensórica continua NPK, control de climatización y gemelo digital de transpiración vegetal.',
    location: 'Polo Tecnológico Agrario',
    cropType: 'Hortalizas en Invernadero',
    agriculturalAreaHectares: 8,
    startDate: '2025-06-01',
    status: 'Planificación',
    responsibleUser: 'Dr. Carlos Verástegui',
    carbonBudgetKgCO2e: 450,
    createdAt: '2025-05-20',
    updatedAt: '2026-08-20'
  }
];

export const DEMO_SENSORS: IoTSensor[] = [
  {
    id: 'sens-1',
    projectId: 'proj-1',
    name: 'Sonda Multinivel de Humedad y Temperatura de Suelo (ProfileProbe 60cm)',
    sensorType: 'Humedad del Suelo',
    manufacturer: 'Sentek Technologies',
    model: 'Drill & Drop Capacitive 60cm',
    quantity: 18,
    powerWatts: 0.25,
    dailyOperatingHours: 24,
    lifespanYears: 5,
    weightGrams: 420,
    mainMaterials: ['Fibra de vidrio', 'Resina epoxi', 'Cobre PCB', 'Batería Litio LiSOCl2'],
    transmissionIntervalMinutes: 15,
    dataSentPerMessageKB: 0.18,
    communicationTech: 'LoRaWAN',
    acquisitionDate: '2025-02-20',
    status: 'Activo',
    notes: 'Instalados en perfiles a 10, 20, 40 y 60cm de profundidad'
  },
  {
    id: 'sens-2',
    projectId: 'proj-1',
    name: 'Estación Agrometeorológica Autónoma All-in-One',
    sensorType: 'Estación Meteorológica Compacta',
    manufacturer: 'METER Group',
    model: 'ATMOS 41 Microclimate',
    quantity: 3,
    powerWatts: 1.2,
    dailyOperatingHours: 24,
    lifespanYears: 7,
    weightGrams: 850,
    mainMaterials: ['Policarbonato UV', 'Acero inoxidable 316', 'Transductor ultrasónico', 'Mini panel solar'],
    transmissionIntervalMinutes: 10,
    dataSentPerMessageKB: 0.45,
    communicationTech: 'LoRaWAN',
    acquisitionDate: '2025-02-18',
    status: 'Activo'
  },
  {
    id: 'sens-3',
    projectId: 'proj-1',
    name: 'Cámara Multiespectral NDVI de Poste Fijo',
    sensorType: 'Cámara Multiespectral / NDVI',
    manufacturer: 'MicaSense / AgTech Vision',
    model: 'RedEdge Dual Sensor Station',
    quantity: 4,
    powerWatts: 4.5,
    dailyOperatingHours: 8,
    lifespanYears: 4,
    weightGrams: 650,
    mainMaterials: ['Aluminio anodizado', 'Ópticas de cuarzo', 'Sensor CMOS multicanal'],
    transmissionIntervalMinutes: 60,
    dataSentPerMessageKB: 1500, // 1.5 MB por captura comprimida
    communicationTech: 'Wi-Fi 6',
    acquisitionDate: '2025-03-05',
    status: 'Activo'
  },
  {
    id: 'sens-4',
    projectId: 'proj-1',
    name: 'Sensor Óptico de Nutrientes NPK y Materia Orgánica',
    sensorType: 'Sensor de Nutrientes NPK',
    manufacturer: 'SoilOptix / Sentera',
    model: 'NPK-Spectro V3',
    quantity: 8,
    powerWatts: 0.8,
    dailyOperatingHours: 12,
    lifespanYears: 3,
    weightGrams: 310,
    mainMaterials: ['Plástico ABS', 'Filtro espectral', 'Diodos emisores'],
    transmissionIntervalMinutes: 30,
    dataSentPerMessageKB: 0.35,
    communicationTech: 'NB-IoT',
    acquisitionDate: '2025-02-25',
    status: 'Activo'
  },
  // Sensores proyecto 2
  {
    id: 'sens-5',
    projectId: 'proj-2',
    name: 'Sensor Foliar de Humedad de Hoja y Riesgo de Infección',
    sensorType: 'Temperatura y Humedad Ambiental',
    manufacturer: 'Decagon Devices',
    model: 'PHYTOS 31 Dielectric',
    quantity: 14,
    powerWatts: 0.15,
    dailyOperatingHours: 24,
    lifespanYears: 5,
    weightGrams: 180,
    mainMaterials: ['Fibra de vidrio FR4', 'Cable PUR'],
    transmissionIntervalMinutes: 10,
    dataSentPerMessageKB: 0.12,
    communicationTech: 'LoRaWAN',
    acquisitionDate: '2025-01-20',
    status: 'Activo'
  }
];

export const DEMO_EDGE_DEVICES: EdgeDevice[] = [
  {
    id: 'edge-1',
    projectId: 'proj-1',
    name: 'Unidad de Inferencia Edge de Campo (NVIDIA Jetson Orin)',
    deviceType: 'Acelerador IA Edge (NVIDIA Jetson Orin Nano)',
    manufacturer: 'NVIDIA / Seeed Studio',
    model: 'reComputer J4012 (Orin Nano 8GB)',
    cpu: '6-core Arm Cortex-A78AE',
    ramGB: 8,
    storageGB: 128,
    powerWatts: 15.0,
    dailyOperatingHours: 14,
    lifespanYears: 4,
    quantity: 2,
    operatingSystem: 'Ubuntu 22.04 LTS + NVIDIA JetPack 6',
    location: 'Caseta Central de Bombeo y Telecomunicaciones',
    weightKg: 0.95,
    isSolarPowered: true, // Con micro-instalación fotovoltaica
    status: 'Operativo'
  },
  {
    id: 'edge-2',
    projectId: 'proj-1',
    name: 'Gateway Concentrador LoRaWAN Industrial Rugerizado',
    deviceType: 'Gateway Industrial IoT (Advantech/Siemens)',
    manufacturer: 'Milesight IoT',
    model: 'UG67 Outdoor LoRaWAN Gateway IP67',
    cpu: 'Quad-Core 1.5 GHz 64-bit ARM',
    ramGB: 2,
    storageGB: 16,
    powerWatts: 4.8,
    dailyOperatingHours: 24,
    lifespanYears: 6,
    quantity: 2,
    operatingSystem: 'OpenWRT Embedded Linux',
    location: 'Mástil Meteorológico Parcela Norte y Parcela Sur',
    weightKg: 1.4,
    isSolarPowered: true,
    status: 'Operativo'
  },
  {
    id: 'edge-3',
    projectId: 'proj-2',
    name: 'Micro-Nodo de Preprocesamiento de Viñedo (Raspberry Pi 5)',
    deviceType: 'Microcomputador (Raspberry Pi 5/4)',
    manufacturer: 'Raspberry Pi Foundation',
    model: 'Raspberry Pi 5 (8GB) con Carcasa Disipadora de Aluminio',
    cpu: 'Broadcom BCM2712 Quad Cortex-A76 2.4GHz',
    ramGB: 8,
    storageGB: 64,
    powerWatts: 8.5,
    dailyOperatingHours: 18,
    lifespanYears: 4,
    quantity: 1,
    operatingSystem: 'Raspberry Pi OS 64-bit Lite',
    location: 'Bodega de Control',
    weightKg: 0.35,
    isSolarPowered: false,
    status: 'Operativo'
  }
];

export const DEMO_CLOUD_RESOURCES: CloudResource[] = [
  {
    id: 'cld-1',
    projectId: 'proj-1',
    name: 'Clúster de Ingesta y Gemelo Digital AgroTwin-Core',
    provider: 'Google Cloud Platform (GCP)',
    region: 'europe-west1 (Bélgica - 100% Emparejado Renovable)',
    serviceType: 'Clúster Kubernetes (GKE/EKS)',
    vCPU: 8,
    ramGB: 32,
    storageGB: 250,
    dailyUsageHours: 24,
    monthlyDataTransferGB: 85,
    estimatedPowerConsumptionKWhMonth: 120,
    isRenewableEnergyPowered: true,
    carbonNeutralCommitment: 'Google Net Zero 24/7 Carbon-Free Energy'
  },
  {
    id: 'cld-2',
    projectId: 'proj-1',
    name: 'Base de Datos de Series Temporales y Telemetría Agraria',
    provider: 'Google Cloud Platform (GCP)',
    region: 'europe-west1 (Bélgica)',
    serviceType: 'Base de Datos de Series Temporales (InfluxDB/Timescale)',
    vCPU: 4,
    ramGB: 16,
    storageGB: 500,
    dailyUsageHours: 24,
    monthlyDataTransferGB: 45,
    estimatedPowerConsumptionKWhMonth: 65,
    isRenewableEnergyPowered: true
  },
  {
    id: 'cld-3',
    projectId: 'proj-1',
    name: 'Almacenamiento de Ortofotos, Mapas NDVI y Modelos 3D',
    provider: 'Amazon Web Services (AWS)',
    region: 'eu-west-1 (Irlanda)',
    serviceType: 'Almacenamiento de Objetos (S3/Cloud Storage)',
    vCPU: 0,
    ramGB: 0,
    storageGB: 1200,
    dailyUsageHours: 24,
    monthlyDataTransferGB: 110,
    estimatedPowerConsumptionKWhMonth: 18,
    isRenewableEnergyPowered: false,
    carbonNeutralCommitment: 'AWS Climate Pledge 2040'
  }
];

export const DEMO_DIGITAL_TWINS: DigitalTwin[] = [
  {
    id: 'dt-1',
    projectId: 'proj-1',
    name: 'Gemelo Hidrológico de Riego Variable Inteligente (VRA-Twin)',
    description: 'Simulación física tridimensional del balance hídrico del suelo y dinámica radicular según la curva fenológica del maíz. Predice el estrés hídrico con 48h de antelación y modula los sectores del pivote central.',
    type: 'Gemelo Hidrológico de Riego de Precisión',
    aiModelType: 'Modelo de Richards 3D + Red Neuronal Physics-Informed (PINN)',
    updateFrequencyMinutes: 15,
    dailyProcessedDataMB: 420,
    associatedSensorIds: ['sens-1', 'sens-2'],
    associatedEdgeDeviceIds: ['edge-1', 'edge-2'],
    associatedCloudResourceIds: ['cld-1', 'cld-2'],
    simulationHorizonDays: 7,
    operationalStatus: 'Activo',
    annualRunHours: 8760
  },
  {
    id: 'dt-2',
    projectId: 'proj-1',
    name: 'Gemelo Fenológico y Nutricional de Biomasa (AgroPheno-AI)',
    description: 'Estimación continua de biomasa aérea, índice de área foliar (LAI) y absorción de nitrógeno a partir de imágenes multiespectrales procesadas en Edge y calibración de campo.',
    type: 'Gemelo Fenológico y Crecimiento de Cultivo',
    aiModelType: 'Vision Transformer (ViT) + Modelo de Cultivo WOFOST',
    updateFrequencyMinutes: 60,
    dailyProcessedDataMB: 1800,
    associatedSensorIds: ['sens-3', 'sens-4'],
    associatedEdgeDeviceIds: ['edge-1'],
    associatedCloudResourceIds: ['cld-1', 'cld-3'],
    simulationHorizonDays: 14,
    operationalStatus: 'Activo',
    annualRunHours: 2920
  },
  {
    id: 'dt-3',
    projectId: 'proj-2',
    name: 'Gemelo Microclimático de Alerta de Heladas y Plagas en Viña',
    description: 'Simulador microclimático topográfico que calcula la acumulación de horas frío, riesgo de heladas de primavera y condiciones favorables para hongos esporulantes.',
    type: 'Gemelo Microclimático y Alerta de Heladas',
    aiModelType: 'Micro-CFD Topográfico + Algoritmo Epidemiológico Goidanich',
    updateFrequencyMinutes: 30,
    dailyProcessedDataMB: 280,
    associatedSensorIds: ['sens-5'],
    associatedEdgeDeviceIds: ['edge-3'],
    associatedCloudResourceIds: [],
    simulationHorizonDays: 3,
    operationalStatus: 'Activo',
    annualRunHours: 6570
  }
];

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'sc-1',
    projectId: 'proj-1',
    name: 'Escenario A: 100% Cloud (Centralizado sin Edge)',
    description: 'Toda la telemetría en bruto de sensores IoT se transmite continuamente vía 4G/LTE a máquinas virtuales en la nube para procesamiento masivo y ejecución del gemelo digital.',
    architectureType: '100% Cloud (Centralizada)',
    sensorCount: 36,
    edgeDeviceCount: 0,
    cloudComputeHoursDaily: 24,
    cloudDataStorageGB: 450,
    transmissionIntervalMinutes: 5,
    isRenewableCloud: false,
    isSolarEdge: false,
    estimatedTotalKgCO2e: 435.6,
    estimatedEnergyKWh: 1820.0,
    costEstimateUSD: 2450,
    latencyMs: 180,
    isBaseline: true
  },
  {
    id: 'sc-2',
    projectId: 'proj-1',
    name: 'Escenario B: Edge-Dominant (Procesamiento en Campo)',
    description: 'Filtrado, agregación y ejecución de inferencia de IA directamente en gateways y microcomputadores Jetson/Raspberry en caseta de riego, enviando solo alertas a la nube.',
    architectureType: 'Edge-Dominant (Procesamiento en Campo)',
    sensorCount: 36,
    edgeDeviceCount: 3,
    cloudComputeHoursDaily: 4,
    cloudDataStorageGB: 40,
    transmissionIntervalMinutes: 15,
    isRenewableCloud: false,
    isSolarEdge: false,
    estimatedTotalKgCO2e: 298.2,
    estimatedEnergyKWh: 1240.0,
    costEstimateUSD: 1680,
    latencyMs: 35,
    isBaseline: false
  },
  {
    id: 'sc-3',
    projectId: 'proj-1',
    name: 'Escenario C: Híbrido Optimizado con IA Adaptativa',
    description: 'Filtrado inteligente en Edge, ingesta sinóptica en cloud verde (GCP Finlandia 100% renovable) y micro-paneles solares en gateways de campo.',
    architectureType: 'Híbrida Optimizada',
    sensorCount: 36,
    edgeDeviceCount: 3,
    cloudComputeHoursDaily: 8,
    cloudDataStorageGB: 95,
    transmissionIntervalMinutes: 20,
    isRenewableCloud: true,
    isSolarEdge: true,
    estimatedTotalKgCO2e: 198.4,
    estimatedEnergyKWh: 820.0,
    costEstimateUSD: 1250,
    latencyMs: 55,
    isBaseline: false
  }
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-08-27 11:15:22',
    username: 'cverastegui',
    userRole: 'Administrador',
    action: 'RUN_CALCULATION',
    entity: 'ProjectCarbonAssessment',
    entityId: 'proj-1',
    details: 'Ejecución de cálculo de ciclo de vida completo (LCA) para el Proyecto Finca AgroTech Valle Verde.'
  },
  {
    id: 'aud-2',
    timestamp: '2026-08-27 10:50:04',
    username: 'cverastegui',
    userRole: 'Administrador',
    action: 'UPDATE',
    entity: 'DigitalTwin',
    entityId: 'dt-1',
    details: 'Actualización de parámetros de inferencia en Gemelo Hidrológico VRA-Twin (reducción de frecuencia de refresco de 10 a 15 min).'
  },
  {
    id: 'aud-3',
    timestamp: '2026-08-26 16:32:10',
    username: 'esanchez',
    userRole: 'Investigador/Analista',
    action: 'EXPORT_REPORT',
    entity: 'Report',
    entityId: 'rep-2026-08-01',
    details: 'Generación y descarga de reporte ejecutivo en PDF y Excel para auditoría ambiental.'
  },
  {
    id: 'aud-4',
    timestamp: '2026-08-25 09:12:44',
    username: 'cverastegui',
    userRole: 'Administrador',
    action: 'CONFIG_CHANGE',
    entity: 'EmissionFactor',
    entityId: 'ef-grid-es',
    details: 'Actualización del factor de mix eléctrico peninsular a 0.150 kg CO2e/kWh (fuente REE 2024).'
  },
  {
    id: 'aud-5',
    timestamp: '2026-08-24 14:05:18',
    username: 'cverastegui',
    userRole: 'Administrador',
    action: 'LOGIN',
    entity: 'AuthSession',
    details: 'Inicio de sesión exitoso mediante credenciales seguras.'
  }
];

export const DEMO_AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Filtrado de Telemetría en Edge con Detección de Delta Significativo',
    category: 'Optimización Edge',
    potentialReductionKgCO2e: 84.5,
    reductionPercentage: 22.4,
    impactLevel: 'Alto',
    difficulty: 'Baja',
    description: 'Los sensores de humedad de suelo y clima transmiten mediciones cada 10-15 minutos incluso cuando los valores permanecen estacionarios. Implementar un filtro en los gateways Edge que solo transmita paquetes a la nube si la variación supera un delta de umbral (>0.5% HR o >0.2°C).',
    actionSteps: [
      'Configurar el motor de reglas en los gateways Milesight/Jetson para aplicar filtro delta.',
      'Mantener un latido (heartbeat) horario para confirmación de conectividad.',
      'Reducir el volumen de datos celular y carga de cómputo en la base de datos cloud en un 68%.'
    ],
    scientificBasis: 'Green Software Foundation Data Reduction Principles & Edge-Driven Carbon Minimization in IoT (2024).'
  },
  {
    id: 'rec-2',
    title: 'Migración de Instancias Cloud a Regiones 100% Libres de Carbono 24/7',
    category: 'Eficiencia Cloud',
    potentialReductionKgCO2e: 62.0,
    reductionPercentage: 16.5,
    impactLevel: 'Alto',
    difficulty: 'Baja',
    description: 'La base de datos y procesamiento en la nube actualmente utiliza regiones con mix eléctrico estándar. Migrar los clústeres a regiones europeas con suministro certificado 100% renovable (ej. GCP Bélgica/Finlandia o Azure Suecia Central).',
    actionSteps: [
      'Configurar réplica del clúster GKE en la región europe-north1 (Hamina, Finlandia).',
      'Aprovechar la menor intensidad de carbono de la red nórdica (<35 g CO2e/kWh).',
      'Reducir las emisiones Scope 2 del gemelo digital en más del 70%.'
    ],
    scientificBasis: 'IPCC Working Group III Carbon Intensity of Cloud Infrastructure & Datacenter PUE metrics.'
  },
  {
    id: 'rec-3',
    title: 'Amortización de Vida Útil de Sensores y Protocolo de Reutilización de Carcasas',
    category: 'Ahorro en Sensores',
    potentialReductionKgCO2e: 38.2,
    reductionPercentage: 10.1,
    impactLevel: 'Medio',
    difficulty: 'Media',
    description: 'La fabricación de sondas multinivel representa el 32% de la huella de carbono incorporada. Extender la vida útil de 3 a 5 años mediante recambio preventivo de sellos y celdas de litio en lugar de sustitución total del dispositivo.',
    actionSteps: [
      'Establecer calendario de mantenimiento invernal con cambio exclusivo de baterías LiSOCl2.',
      'Reciclar mediante gestor certificado RAEE el 100% de los componentes retirados para capturar créditos de carbono (-1.8 kg CO2e/kg).'
    ],
    scientificBasis: 'LCA Circularity in Smart Agriculture Electronics (EcoInvent v3.9 methodology).'
  },
  {
    id: 'rec-4',
    title: 'Alimentación Fotovoltaica en Isla para Gateways y Nodos Edge de Parcela',
    category: 'Mix Energético',
    potentialReductionKgCO2e: 45.0,
    reductionPercentage: 12.0,
    impactLevel: 'Medio',
    difficulty: 'Media',
    description: 'Sustituir la alimentación de red convencional en casetas agrícolas por paneles solares fotovoltaicos dedicados de 50W con baterías LiFePO4 para alimentar los microcomputadores Edge.',
    actionSteps: [
      'Instalar kit fotovoltaico autónomo de bajo impacto en las 2 casetas de parcela.',
      'Desconectar el consumo continuo de la red general durante las horas diurnas de mayor irradiación.'
    ],
    scientificBasis: 'Renewable Distributed Energy for Precision Farming (FAO & AgMIP guidelines).'
  }
];

export const INITIAL_USERS = DEMO_USERS;
export const INITIAL_PROJECTS = DEMO_PROJECTS;
export const INITIAL_SENSORS = DEMO_SENSORS;
export const INITIAL_EDGE_DEVICES = DEMO_EDGE_DEVICES;
export const INITIAL_CLOUD_RESOURCES = DEMO_CLOUD_RESOURCES;
export const INITIAL_DIGITAL_TWINS = DEMO_DIGITAL_TWINS;
export const INITIAL_SCENARIOS = DEMO_SCENARIOS;
export const INITIAL_AI_RECOMMENDATIONS = DEMO_AI_RECOMMENDATIONS;
export const INITIAL_AUDIT_LOGS = DEMO_AUDIT_LOGS;
