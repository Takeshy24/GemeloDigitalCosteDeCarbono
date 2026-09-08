import {
  Project,
  IoTSensor,
  EdgeDevice,
  CloudResource,
  DigitalTwin,
  EmissionFactor,
  ProjectCarbonAssessment,
  ComponentCarbonResult,
  LifeCycleBreakdown,
  Scenario
} from '../types';

export class CarbonCalculationEngine {
  private emissionFactors: EmissionFactor[];

  public static calculateProjectAssessment(
    project: Project,
    sensors: IoTSensor[],
    edgeDevices: EdgeDevice[],
    cloudResources: CloudResource[],
    digitalTwins: DigitalTwin[],
    emissionFactors: EmissionFactor[],
    analysisPeriodYears: number = 3
  ): ProjectCarbonAssessment {
    const engine = new CarbonCalculationEngine(emissionFactors);
    return engine.calculateProjectAssessment(project, sensors, edgeDevices, cloudResources, digitalTwins, analysisPeriodYears);
  }

  constructor(emissionFactors: EmissionFactor[]) {
    this.emissionFactors = emissionFactors;
  }

  public getFactorValue(category: string, defaultVal: number): number {
    const factor = this.emissionFactors.find(f => f.category === category && f.isDefault) 
      || this.emissionFactors.find(f => f.category === category);
    return factor ? factor.value : defaultVal;
  }

  public getFactorById(id: string, fallback: number): number {
    const factor = this.emissionFactors.find(f => f.id === id);
    return factor ? factor.value : fallback;
  }

  /**
   * Ejecuta el análisis completo del ciclo de vida (LCA) para un proyecto agrícola de precisión
   */
  public calculateProjectAssessment(
    project: Project,
    sensors: IoTSensor[],
    edgeDevices: EdgeDevice[],
    cloudResources: CloudResource[],
    digitalTwins: DigitalTwin[],
    analysisPeriodYears: number = 3
  ): ProjectCarbonAssessment {
    const gridFactor = this.getFactorById('ef-grid-es', 0.150); // kg CO2e / kWh
    const transportRoadFactor = this.getFactorById('ef-transport-road', 0.125); // kg CO2e / t*km
    const recycleCreditFactor = this.getFactorById('ef-eol-weee-recycle', -1.80); // kg CO2e / kg
    const loraDataFactor = this.getFactorById('ef-data-lorawan', 0.008); // kg CO2e / GB
    const cellularDataFactor = this.getFactorById('ef-data-cellular', 0.045); // kg CO2e / GB

    const componentsList: ComponentCarbonResult[] = [];

    // 1. CÁLCULO PARA SENSORES IOT
    let sensorsMfg = 0;
    let sensorsTrans = 0;
    let sensorsInst = 0;
    let sensorsOpAnnual = 0;
    let sensorsMaintAnnual = 0;
    let sensorsEoL = 0;
    let sensorsAnnualEnergyKWh = 0;

    sensors.forEach(sensor => {
      const isOptical = sensor.sensorType.includes('Cámara') || sensor.sensorType.includes('Radiación');
      const mfgUnitFactor = isOptical 
        ? this.getFactorById('ef-mfg-sensor-optical', 12.4)
        : this.getFactorById('ef-mfg-sensor-compact', 4.85);

      const totalDeviceWeightKg = (sensor.weightGrams * sensor.quantity) / 1000;
      
      // Fabricación
      const sensorMfg = sensor.quantity * mfgUnitFactor;
      sensorsMfg += sensorMfg;

      // Transporte (asumiendo 600 km de transporte promedio)
      const sensorTrans = (totalDeviceWeightKg / 1000) * 600 * transportRoadFactor;
      sensorsTrans += sensorTrans;

      // Instalación (estacado, calibración in-situ: 0.15 kg CO2e por punto de monitoreo)
      const sensorInst = sensor.quantity * 0.15;
      sensorsInst += sensorInst;

      // Operación eléctrica anual
      const annualHours = sensor.dailyOperatingHours * 365;
      const annualEnergyKWh = (sensor.powerWatts * annualHours * sensor.quantity) / 1000;
      sensorsAnnualEnergyKWh += annualEnergyKWh;
      const sensorOpAnnual = annualEnergyKWh * gridFactor;
      sensorsOpAnnual += sensorOpAnnual;

      // Comunicaciones / Tráfico de datos anual
      const msgsPerDay = (sensor.dailyOperatingHours * 60) / Math.max(1, sensor.transmissionIntervalMinutes);
      const dailyDataKB = msgsPerDay * sensor.dataSentPerMessageKB * sensor.quantity;
      const annualDataGB = (dailyDataKB * 365) / (1024 * 1024);
      const commFactor = sensor.communicationTech === 'LoRaWAN' || sensor.communicationTech === 'ZigBee'
        ? loraDataFactor 
        : cellularDataFactor;
      const commEmissionsAnnual = annualDataGB * commFactor;
      sensorsOpAnnual += commEmissionsAnnual;

      // Mantenimiento (reemplazo de baterías y recalibración cada 1.5 años)
      const sensorMaintAnnual = (sensorMfg * 0.12);
      sensorsMaintAnnual += sensorMaintAnnual;

      // Fin de vida (amortizado al fin del periodo con crédito WEEE)
      const sensorEoL = totalDeviceWeightKg * recycleCreditFactor;
      sensorsEoL += sensorEoL;

      const totalLifeCycle = sensorMfg + sensorTrans + sensorInst + 
        (sensorOpAnnual * analysisPeriodYears) + (sensorMaintAnnual * analysisPeriodYears) + sensorEoL;

      componentsList.push({
        componentId: sensor.id,
        componentName: `${sensor.name} (${sensor.quantity} uds.)`,
        category: 'Sensor',
        annualEnergyKWh: Math.round(annualEnergyKWh * 100) / 100,
        operationalEmissionsKgCO2e: Math.round((sensorOpAnnual + commEmissionsAnnual) * 100) / 100,
        embodiedEmissionsKgCO2e: Math.round((sensorMfg + sensorTrans + sensorInst) * 100) / 100,
        totalAnnualEmissionsKgCO2e: Math.round((sensorOpAnnual + sensorMaintAnnual) * 100) / 100,
        lifeCycleTotalKgCO2e: Math.max(0.1, Math.round(totalLifeCycle * 100) / 100),
        percentageOfTotal: 0 // Se calcula posteriormente
      });
    });

    // 2. CÁLCULO PARA DISPOSITIVOS EDGE
    let edgeMfg = 0;
    let edgeTrans = 0;
    let edgeInst = 0;
    let edgeOpAnnual = 0;
    let edgeMaintAnnual = 0;
    let edgeEoL = 0;
    let edgeAnnualEnergyKWh = 0;

    edgeDevices.forEach(edge => {
      let mfgUnitFactor = this.getFactorById('ef-mfg-edge-pi', 18.50);
      if (edge.deviceType.includes('Jetson') || edge.deviceType.includes('Acelerador')) {
        mfgUnitFactor = this.getFactorById('ef-mfg-edge-orin', 38.20);
      } else if (edge.deviceType.includes('Gateway') || edge.deviceType.includes('Rugerizado')) {
        mfgUnitFactor = this.getFactorById('ef-mfg-gateway-industrial', 29.80);
      } else if (edge.deviceType.includes('Servidor')) {
        mfgUnitFactor = 65.0; // Servidor farm edge
      }

      const totalWeightKg = edge.weightKg * edge.quantity;
      const deviceMfg = edge.quantity * mfgUnitFactor;
      edgeMfg += deviceMfg;

      const deviceTrans = (totalWeightKg / 1000) * 800 * transportRoadFactor;
      edgeTrans += deviceTrans;

      const deviceInst = edge.quantity * 0.8; // Montaje en poste o caseta
      edgeInst += deviceInst;

      // Operación
      const annualHours = edge.dailyOperatingHours * 365;
      const annualEnergyKWh = (edge.powerWatts * annualHours * edge.quantity) / 1000;
      edgeAnnualEnergyKWh += annualEnergyKWh;

      // Si es solar, el factor de emisión es mucho menor (0.025 vs 0.150)
      const edgeFactor = edge.isSolarPowered ? this.getFactorById('ef-grid-solar', 0.025) : gridFactor;
      const deviceOpAnnual = annualEnergyKWh * edgeFactor;
      edgeOpAnnual += deviceOpAnnual;

      const deviceMaintAnnual = deviceMfg * 0.10;
      edgeMaintAnnual += deviceMaintAnnual;

      const deviceEoL = totalWeightKg * recycleCreditFactor;
      edgeEoL += deviceEoL;

      const totalLifeCycle = deviceMfg + deviceTrans + deviceInst + 
        (deviceOpAnnual * analysisPeriodYears) + (deviceMaintAnnual * analysisPeriodYears) + deviceEoL;

      componentsList.push({
        componentId: edge.id,
        componentName: `${edge.name} (${edge.quantity}x ${edge.model})`,
        category: 'Edge',
        annualEnergyKWh: Math.round(annualEnergyKWh * 100) / 100,
        operationalEmissionsKgCO2e: Math.round(deviceOpAnnual * 100) / 100,
        embodiedEmissionsKgCO2e: Math.round((deviceMfg + deviceTrans + deviceInst) * 100) / 100,
        totalAnnualEmissionsKgCO2e: Math.round((deviceOpAnnual + deviceMaintAnnual) * 100) / 100,
        lifeCycleTotalKgCO2e: Math.max(0.1, Math.round(totalLifeCycle * 100) / 100),
        percentageOfTotal: 0
      });
    });

    // 3. CÁLCULO PARA RECURSOS CLOUD
    let cloudMfg = 0; // Prorrateo de servidores físicos cloud
    let cloudTrans = 0;
    let cloudInst = 0;
    let cloudOpAnnual = 0;
    let cloudMaintAnnual = 0;
    let cloudEoL = 0;
    let cloudAnnualEnergyKWh = 0;

    cloudResources.forEach(cloud => {
      const vcpuFactor = cloud.isRenewableEnergyPowered 
        ? this.getFactorById('ef-cloud-green', 0.0006) 
        : this.getFactorById('ef-cloud-vcpu-std', 0.0032);
      
      const storageFactor = this.getFactorById('ef-cloud-storage-tb', 0.85); // kg CO2e/TB-mes
      const egressFactor = this.getFactorById('ef-data-cloud-egress', 0.018); // kg CO2e/GB

      const annualUsageHours = cloud.dailyUsageHours * 365;
      const vcpuEmissions = cloud.vCPU * annualUsageHours * vcpuFactor;
      const storageTB = cloud.storageGB / 1024;
      const storageEmissions = storageTB * 12 * storageFactor;
      const egressEmissions = (cloud.monthlyDataTransferGB * 12) * egressFactor;

      // Consumo de energía equivalente estimado
      const annualEnergyKWh = cloud.estimatedPowerConsumptionKWhMonth * 12;
      cloudAnnualEnergyKWh += annualEnergyKWh;

      const resourceOpAnnual = vcpuEmissions + storageEmissions + egressEmissions;
      cloudOpAnnual += resourceOpAnnual;

      // Huella incorporada prorrateada de servidores Hyperscale
      const serverEmbodiedShare = (cloud.vCPU * 2.5); // ~2.5 kg CO2e / vCPU por año
      cloudMfg += serverEmbodiedShare;

      const totalLifeCycle = serverEmbodiedShare + (resourceOpAnnual * analysisPeriodYears);

      componentsList.push({
        componentId: cloud.id,
        componentName: `${cloud.name} (${cloud.provider})`,
        category: 'Cloud',
        annualEnergyKWh: Math.round(annualEnergyKWh * 100) / 100,
        operationalEmissionsKgCO2e: Math.round(resourceOpAnnual * 100) / 100,
        embodiedEmissionsKgCO2e: Math.round(serverEmbodiedShare * 100) / 100,
        totalAnnualEmissionsKgCO2e: Math.round(resourceOpAnnual * 100) / 100,
        lifeCycleTotalKgCO2e: Math.max(0.1, Math.round(totalLifeCycle * 100) / 100),
        percentageOfTotal: 0
      });
    });

    // 4. CÁLCULO PARA GEMELOS DIGITALES
    let twinMfg = 0;
    let twinTrans = 0;
    let twinInst = 0;
    let twinOpAnnual = 0;
    let twinMaintAnnual = 0;
    let twinEoL = 0;
    let twinAnnualEnergyKWh = 0;

    digitalTwins.forEach(twin => {
      // Un gemelo digital añade sobrecarga de cómputo, entrenamiento continuo de IA y sincronizaciones
      // Basado en la frecuencia de actualización y volumen de datos diarios procesados
      const syncsPerDay = (24 * 60) / Math.max(5, twin.updateFrequencyMinutes);
      const simulationOverheadKWh = (twin.dailyProcessedDataMB / 1000) * 0.04 * 365; // ~0.04 kWh por GB procesado en gemelos agrícolas
      const modelTrainingKWhAnnual = 45; // Cómputo anual de re-entrenamiento del modelo mecanicista/IA
      const annualTwinKWh = simulationOverheadKWh + modelTrainingKWhAnnual;
      
      twinAnnualEnergyKWh += annualTwinKWh;
      const twinEmissionsAnnual = annualTwinKWh * gridFactor;
      twinOpAnnual += twinEmissionsAnnual;

      // Software engineering / Calibración inicial LCA
      const calibrationEmissions = 15.0; // kg CO2e por calibración de gemelo digital
      twinInst += calibrationEmissions;
      
      const maintenanceSoftwareAnnual = 4.0; // kg CO2e por actualizaciones de algoritmos
      twinMaintAnnual += maintenanceSoftwareAnnual;

      const totalLifeCycle = calibrationEmissions + (twinEmissionsAnnual * analysisPeriodYears) + (maintenanceSoftwareAnnual * analysisPeriodYears);

      componentsList.push({
        componentId: twin.id,
        componentName: `${twin.name} (${twin.type})`,
        category: 'DigitalTwin',
        annualEnergyKWh: Math.round(annualTwinKWh * 100) / 100,
        operationalEmissionsKgCO2e: Math.round(twinEmissionsAnnual * 100) / 100,
        embodiedEmissionsKgCO2e: Math.round(calibrationEmissions * 100) / 100,
        totalAnnualEmissionsKgCO2e: Math.round((twinEmissionsAnnual + maintenanceSoftwareAnnual) * 100) / 100,
        lifeCycleTotalKgCO2e: Math.max(0.1, Math.round(totalLifeCycle * 100) / 100),
        percentageOfTotal: 0
      });
    });

    // 5. COMUNICACIONES & RED DEDICADA
    const networkOpAnnual = 8.5; // Gateways centrales y tráfico rural
    const networkAnnualEnergyKWh = 42.0;

    // CONSOLIDACIÓN DE FASES DEL CICLO DE VIDA (LCA)
    const stageMfg = sensorsMfg + edgeMfg + cloudMfg + twinMfg;
    const stageTrans = sensorsTrans + edgeTrans + cloudTrans + twinTrans;
    const stageInst = sensorsInst + edgeInst + cloudInst + twinInst;
    const stageOp = (sensorsOpAnnual + edgeOpAnnual + cloudOpAnnual + twinOpAnnual + networkOpAnnual) * analysisPeriodYears;
    const stageMaint = (sensorsMaintAnnual + edgeMaintAnnual + cloudMaintAnnual + twinMaintAnnual) * analysisPeriodYears;
    const stageEoL = Math.max(-50, sensorsEoL + edgeEoL + cloudEoL + twinEoL);

    const totalEmissionsKgCO2e = stageMfg + stageTrans + stageInst + stageOp + stageMaint + stageEoL;
    const totalEnergyConsumptionKWh = (sensorsAnnualEnergyKWh + edgeAnnualEnergyKWh + cloudAnnualEnergyKWh + twinAnnualEnergyKWh + networkAnnualEnergyKWh) * analysisPeriodYears;

    // Actualizar porcentajes individuales
    componentsList.forEach(comp => {
      comp.percentageOfTotal = totalEmissionsKgCO2e > 0
        ? Math.round((comp.lifeCycleTotalKgCO2e / totalEmissionsKgCO2e) * 1000) / 10
        : 0;
    });

    // Ordenar de mayor a menor impacto
    componentsList.sort((a, b) => b.lifeCycleTotalKgCO2e - a.lifeCycleTotalKgCO2e);

    const primaryDriver = componentsList.length > 0 ? componentsList[0].componentName : 'Infraestructura Cloud';

    const sensorsCategoryBreakdown: LifeCycleBreakdown = {
      manufacturingKgCO2e: Math.round(sensorsMfg * 100) / 100,
      transportKgCO2e: Math.round(sensorsTrans * 100) / 100,
      installationKgCO2e: Math.round(sensorsInst * 100) / 100,
      operationKgCO2e: Math.round((sensorsOpAnnual * analysisPeriodYears) * 100) / 100,
      maintenanceKgCO2e: Math.round((sensorsMaintAnnual * analysisPeriodYears) * 100) / 100,
      endOfLifeKgCO2e: Math.round(sensorsEoL * 100) / 100,
      totalKgCO2e: Math.round((sensorsMfg + sensorsTrans + sensorsInst + (sensorsOpAnnual + sensorsMaintAnnual) * analysisPeriodYears + sensorsEoL) * 100) / 100
    };

    const edgeCategoryBreakdown: LifeCycleBreakdown = {
      manufacturingKgCO2e: Math.round(edgeMfg * 100) / 100,
      transportKgCO2e: Math.round(edgeTrans * 100) / 100,
      installationKgCO2e: Math.round(edgeInst * 100) / 100,
      operationKgCO2e: Math.round((edgeOpAnnual * analysisPeriodYears) * 100) / 100,
      maintenanceKgCO2e: Math.round((edgeMaintAnnual * analysisPeriodYears) * 100) / 100,
      endOfLifeKgCO2e: Math.round(edgeEoL * 100) / 100,
      totalKgCO2e: Math.round((edgeMfg + edgeTrans + edgeInst + (edgeOpAnnual + edgeMaintAnnual) * analysisPeriodYears + edgeEoL) * 100) / 100
    };

    const cloudCategoryBreakdown: LifeCycleBreakdown = {
      manufacturingKgCO2e: Math.round(cloudMfg * 100) / 100,
      transportKgCO2e: 0,
      installationKgCO2e: 0,
      operationKgCO2e: Math.round((cloudOpAnnual * analysisPeriodYears) * 100) / 100,
      maintenanceKgCO2e: 0,
      endOfLifeKgCO2e: 0,
      totalKgCO2e: Math.round((cloudMfg + (cloudOpAnnual * analysisPeriodYears)) * 100) / 100
    };

    const twinCategoryBreakdown: LifeCycleBreakdown = {
      manufacturingKgCO2e: 0,
      transportKgCO2e: 0,
      installationKgCO2e: Math.round(twinInst * 100) / 100,
      operationKgCO2e: Math.round((twinOpAnnual * analysisPeriodYears) * 100) / 100,
      maintenanceKgCO2e: Math.round((twinMaintAnnual * analysisPeriodYears) * 100) / 100,
      endOfLifeKgCO2e: 0,
      totalKgCO2e: Math.round((twinInst + (twinOpAnnual + twinMaintAnnual) * analysisPeriodYears) * 100) / 100
    };

    const networkCategoryBreakdown: LifeCycleBreakdown = {
      manufacturingKgCO2e: 4.5,
      transportKgCO2e: 0.5,
      installationKgCO2e: 1.0,
      operationKgCO2e: Math.round((networkOpAnnual * analysisPeriodYears) * 100) / 100,
      maintenanceKgCO2e: 1.5,
      endOfLifeKgCO2e: -0.8,
      totalKgCO2e: Math.round((6.7 + (networkOpAnnual * analysisPeriodYears)) * 100) / 100
    };

    const byLifeCycleStage: LifeCycleBreakdown = {
      manufacturingKgCO2e: Math.round(stageMfg * 100) / 100,
      transportKgCO2e: Math.round(stageTrans * 100) / 100,
      installationKgCO2e: Math.round(stageInst * 100) / 100,
      operationKgCO2e: Math.round(stageOp * 100) / 100,
      maintenanceKgCO2e: Math.round(stageMaint * 100) / 100,
      endOfLifeKgCO2e: Math.round(stageEoL * 100) / 100,
      totalKgCO2e: Math.round(totalEmissionsKgCO2e * 100) / 100
    };

    const area = Math.max(0.1, project.agriculturalAreaHectares || 10);
    const days = analysisPeriodYears * 365;

    return {
      projectId: project.id,
      assessmentDate: new Date().toISOString().split('T')[0],
      analysisPeriodYears,
      totalEmissionsKgCO2e: Math.round(totalEmissionsKgCO2e * 100) / 100,
      totalEmissionsTonnesCO2e: Math.round((totalEmissionsKgCO2e / 1000) * 1000) / 1000,
      totalEnergyConsumptionKWh: Math.round(totalEnergyConsumptionKWh * 100) / 100,
      emissionsPerHectareKgCO2e: Math.round((totalEmissionsKgCO2e / area) * 100) / 100,
      emissionsPerDayKgCO2e: Math.round((totalEmissionsKgCO2e / days) * 100) / 100,
      byCategory: {
        sensors: sensorsCategoryBreakdown,
        edge: edgeCategoryBreakdown,
        cloud: cloudCategoryBreakdown,
        digitalTwins: twinCategoryBreakdown,
        network: networkCategoryBreakdown
      },
      byLifeCycleStage,
      componentsList,
      keyInsights: {
        primaryEmissionDriver: primaryDriver,
        manufacturingSharePercent: Math.round((stageMfg / totalEmissionsKgCO2e) * 1000) / 10,
        operationSharePercent: Math.round((stageOp / totalEmissionsKgCO2e) * 1000) / 10,
        cloudSharePercent: Math.round((cloudCategoryBreakdown.totalKgCO2e / totalEmissionsKgCO2e) * 1000) / 10,
        edgeSharePercent: Math.round((edgeCategoryBreakdown.totalKgCO2e / totalEmissionsKgCO2e) * 1000) / 10,
        sensorSharePercent: Math.round((sensorsCategoryBreakdown.totalKgCO2e / totalEmissionsKgCO2e) * 1000) / 10
      }
    };
  }

  /**
   * Genera los escenarios por defecto para comparación arquitectónica
   */
  public generateDefaultScenarios(project: Project, baseAssessment: ProjectCarbonAssessment): Scenario[] {
    const baseEmissions = baseAssessment.totalEmissionsKgCO2e;
    const baseEnergy = baseAssessment.totalEnergyConsumptionKWh;

    return [
      {
        id: `sc-cloud-${project.id}`,
        projectId: project.id,
        name: 'Escenario A: Arquitectura Cloud-Centric',
        description: 'Transmisión bruta de datos crudos desde todos los sensores directamente a la nube. Inferencia y gemelos ejecutados en centros de datos remotos.',
        architectureType: 'Cloud-Centric',
        edgeDataFilteringPercent: 0,
        cloudProcessingSharePercent: 95,
        edgeProcessingSharePercent: 5,
        renewableEnergyPercent: 35,
        transmissionFrequencyReductionPercent: 0,
        estimatedTotalKgCO2e: Math.round(baseEmissions * 1.38 * 10) / 10,
        estimatedEnergyKWh: Math.round(baseEnergy * 1.42 * 10) / 10,
        costEstimateUSD: 1850,
        latencyMs: 380,
        isBaseline: true
      },
      {
        id: `sc-edge-${project.id}`,
        projectId: project.id,
        name: 'Escenario B: Arquitectura Edge-Centric',
        description: 'Procesamiento en campo con dispositivos Jetson/SBC. Filtrado del 80% de datos en borde y cómputo local del gemelo digital.',
        architectureType: 'Edge-Centric',
        edgeDataFilteringPercent: 80,
        cloudProcessingSharePercent: 20,
        edgeProcessingSharePercent: 80,
        renewableEnergyPercent: 40,
        transmissionFrequencyReductionPercent: 60,
        estimatedTotalKgCO2e: Math.round(baseEmissions * 0.78 * 10) / 10,
        estimatedEnergyKWh: Math.round(baseEnergy * 0.85 * 10) / 10,
        costEstimateUSD: 1420,
        latencyMs: 45,
        isBaseline: false
      },
      {
        id: `sc-hybrid-${project.id}`,
        projectId: project.id,
        name: 'Escenario C: Híbrido Optimizado con IA Adaptativa',
        description: 'Preprocesamiento y compresión en Edge, agregación sinóptica hacia Cloud verde (GCP Finlandia 100% renovable) y micro-paneles solares en campo.',
        architectureType: 'Híbrida Optimizada',
        edgeDataFilteringPercent: 70,
        cloudProcessingSharePercent: 40,
        edgeProcessingSharePercent: 60,
        renewableEnergyPercent: 90,
        transmissionFrequencyReductionPercent: 50,
        estimatedTotalKgCO2e: Math.round(baseEmissions * 0.46 * 10) / 10, // ~54% de reducción de carbono
        estimatedEnergyKWh: Math.round(baseEnergy * 0.68 * 10) / 10,
        costEstimateUSD: 1100,
        latencyMs: 65,
        isBaseline: false
      },
      {
        id: `sc-solar-${project.id}`,
        projectId: project.id,
        name: 'Escenario D: Edge Autónomo Solar Off-Grid',
        description: 'Instalación 100% autosuficiente en energía con micro-paneles fotovoltaicos y baterías LiFePO4 para gateways de campo y gemelos locales.',
        architectureType: 'Solar-Offgrid',
        edgeDataFilteringPercent: 85,
        cloudProcessingSharePercent: 15,
        edgeProcessingSharePercent: 85,
        renewableEnergyPercent: 98,
        transmissionFrequencyReductionPercent: 70,
        estimatedTotalKgCO2e: Math.round(baseEmissions * 0.35 * 10) / 10, // ~65% de reducción
        estimatedEnergyKWh: Math.round(baseEnergy * 0.60 * 10) / 10,
        costEstimateUSD: 1350,
        latencyMs: 35,
        isBaseline: false
      }
    ];
  }
}
