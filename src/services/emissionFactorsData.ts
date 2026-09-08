import { EmissionFactor } from '../types';

export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  // Grid Emission Factors
  {
    id: 'ef-grid-es',
    name: 'Mix Eléctrico España (Península)',
    category: 'Red Eléctrica (Mix Energético)',
    unit: 'kg CO2e / kWh',
    value: 0.150, // 150 g CO2/kWh REE promedio reciente
    source: 'REE / CNMC 2024 (Datos demostrativos de referencia)',
    countryOrRegion: 'España',
    year: 2024,
    description: 'Factor medio del mix de generación eléctrica peninsular español con alta penetración renovable.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-grid-eu',
    name: 'Mix Eléctrico Promedio Unión Europea',
    category: 'Red Eléctrica (Mix Energético)',
    unit: 'kg CO2e / kWh',
    value: 0.230,
    source: 'EEA / IEA 2023 (Datos demostrativos)',
    countryOrRegion: 'Europa (UE-27)',
    year: 2023,
    description: 'Promedio ponderado de emisiones de la red eléctrica en los países miembros de la UE.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-grid-latam',
    name: 'Mix Eléctrico Sudamérica / Perú',
    category: 'Red Eléctrica (Mix Energético)',
    unit: 'kg CO2e / kWh',
    value: 0.198,
    source: 'MINEM / COES (Datos demostrativos)',
    countryOrRegion: 'Perú / Latam',
    year: 2023,
    description: 'Factor del Sistema Eléctrico Interconectado Nacional con hidroelectricidad y gas natural.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-grid-solar',
    name: 'Autoconsumo Solar Fotovoltaico Agrícola',
    category: 'Red Eléctrica (Mix Energético)',
    unit: 'kg CO2e / kWh',
    value: 0.025, // Emisiones de ciclo de vida del panel solar
    source: 'IPCC LCA Solar PV (Datos demostrativos)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Emisiones de ciclo de vida asociadas a la generación solar en campo (amortización de paneles).',
    isDefault: false,
    isDemoData: true
  },

  // Fabricación y Materiales
  {
    id: 'ef-mfg-sensor-compact',
    name: 'Fabricación Sensor IoT Compacto (Placa + Batería)',
    category: 'Fabricación y Materiales',
    unit: 'kg CO2e / dispositivo',
    value: 4.85,
    source: 'EcoInvent v3.9 / Fraunhofer IZM (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Huella de carbono incorporada en la extracción de silicio, PCB multicapa, microcontrolador y carcasa.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-mfg-sensor-optical',
    name: 'Fabricación Sensor Óptico / Cámara Multiespectral',
    category: 'Fabricación y Materiales',
    unit: 'kg CO2e / dispositivo',
    value: 12.40,
    source: 'EcoInvent v3.9 (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Emisiones de manufactura de lentes de cuarzo, sensores CMOS de precisión y aleaciones de aluminio.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-mfg-edge-pi',
    name: 'Fabricación Microcomputador Edge (SBC / Raspberry Pi)',
    category: 'Fabricación y Materiales',
    unit: 'kg CO2e / dispositivo',
    value: 18.50,
    source: 'Raspberry Pi Foundation LCA / DEFRA (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Emisiones de producción de SoC ARM, DRAM, microchips de potencia y conectores.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-mfg-edge-orin',
    name: 'Fabricación Acelerador IA Edge (Jetson / GPU Edge)',
    category: 'Fabricación y Materiales',
    unit: 'kg CO2e / dispositivo',
    value: 38.20,
    source: 'Green AI Hardware LCA (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Huella de manufactura de silicio denso de 4nm/8nm, disipador de cobre y módulo regulador.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-mfg-gateway-industrial',
    name: 'Fabricación Gateway Industrial Rugerizado',
    category: 'Fabricación y Materiales',
    unit: 'kg CO2e / dispositivo',
    value: 29.80,
    source: 'Industrial IoT LCA (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Chasis de aluminio extruido IP67, protección sobretensión, módulos LoRa/4G.',
    isDefault: false,
    isDemoData: true
  },

  // Transporte y Logística
  {
    id: 'ef-transport-air',
    name: 'Transporte Aéreo de Carga',
    category: 'Transporte y Logística',
    unit: 'kg CO2e / t·km',
    value: 0.602,
    source: 'DEFRA 2023 (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Emisiones por tonelada y kilómetro recorrido en envíos urgentes de componentes electrónicos.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-transport-road',
    name: 'Transporte Terrestre por Carretera (Camión Ligero)',
    category: 'Transporte y Logística',
    unit: 'kg CO2e / t·km',
    value: 0.125,
    source: 'DEFRA / IDAE 2023 (Demostrativo)',
    countryOrRegion: 'Europa',
    year: 2023,
    description: 'Distribución regional de hardware desde almacén hasta la explotación agrícola.',
    isDefault: true,
    isDemoData: true
  },

  // Transferencia de Datos y Comunicaciones
  {
    id: 'ef-data-lorawan',
    name: 'Transmisión LoRaWAN / LPWAN en Campo',
    category: 'Transferencia de Datos',
    unit: 'kg CO2e / GB',
    value: 0.008, // Muy bajo consumo por paquete
    source: 'Green Wireless Network Studies (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2024,
    description: 'Consumo y emisiones de infraestructura gateway para telemetría agrícola sub-GHz.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-data-cellular',
    name: 'Transmisión Celular 4G / 5G Rural',
    category: 'Transferencia de Datos',
    unit: 'kg CO2e / GB',
    value: 0.045,
    source: 'Aslan et al. / Green Software Foundation (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Emisiones de red de acceso de radio (RAN) y backhaul para datos agrícolas.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-data-cloud-egress',
    name: 'Tráfico de Red Cloud (Backbone / CDN)',
    category: 'Transferencia de Datos',
    unit: 'kg CO2e / GB',
    value: 0.018,
    source: 'Cloud Carbon Footprint Methodology (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2024,
    description: 'Emisiones asociadas al tránsito entre centro de datos y usuarios finales.',
    isDefault: false,
    isDemoData: true
  },

  // Cloud & Data Centers
  {
    id: 'ef-cloud-vcpu-std',
    name: 'Cómputo Cloud vCPU Estándar (PUE 1.2)',
    category: 'Cloud & Data Centers',
    unit: 'kg CO2e / vCPU-hora',
    value: 0.0032,
    source: 'Cloud Carbon Footprint / EPA (Demostrativo)',
    countryOrRegion: 'Europa / US',
    year: 2024,
    description: 'Emisión por vCPU de servidor hyperscale considerando factor PUE e intensidad de red media.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-cloud-green',
    name: 'Cómputo Cloud Región Verde (100% Renovable PUE 1.1)',
    category: 'Cloud & Data Centers',
    unit: 'kg CO2e / vCPU-hora',
    value: 0.0006,
    source: 'GCP Finland / Sweden Eco Region (Demostrativo)',
    countryOrRegion: 'Europa Norte',
    year: 2024,
    description: 'Instalaciones con acuerdos PPA renovables y enfriamiento por aire libre.',
    isDefault: false,
    isDemoData: true
  },
  {
    id: 'ef-cloud-storage-tb',
    name: 'Almacenamiento Cloud SSD / Series Temporales',
    category: 'Cloud & Data Centers',
    unit: 'kg CO2e / TB-mes',
    value: 0.85,
    source: 'Hyperscale LCA Reports (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2024,
    description: 'Emisiones operativas y de manufactura prorrateadas por TB de almacenamiento activo.',
    isDefault: true,
    isDemoData: true
  },

  // Fin de Vida y Reciclaje
  {
    id: 'ef-eol-weee-recycle',
    name: 'Reciclaje Certificado RAEE (Crédito de Economía Circular)',
    category: 'Fin de Vida y Reciclaje',
    unit: 'kg CO2e / kg hardware',
    value: -1.80, // Crédito negativo por recuperación de metales
    source: 'WEEE Forum LCA circularity index (Demostrativo)',
    countryOrRegion: 'Europa',
    year: 2023,
    description: 'Ahorro de emisiones por recuperación de cobre, oro, aluminio y plásticos reciclables.',
    isDefault: true,
    isDemoData: true
  },
  {
    id: 'ef-eol-landfill',
    name: 'Disposición en Vertedero / Incineración sin Recuperación',
    category: 'Fin de Vida y Reciclaje',
    unit: 'kg CO2e / kg hardware',
    value: 0.45,
    source: 'IPCC Waste Management (Demostrativo)',
    countryOrRegion: 'Global',
    year: 2023,
    description: 'Impacto ambiental por tratamiento de residuos no segregados.',
    isDefault: false,
    isDemoData: true
  }
];

export const INITIAL_EMISSION_FACTORS = DEFAULT_EMISSION_FACTORS;
