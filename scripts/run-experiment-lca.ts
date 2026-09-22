import fs from 'node:fs';
import path from 'node:path';
import { CarbonCalculationEngine } from '../src/services/carbonEngine';
import { DEFAULT_EMISSION_FACTORS } from '../src/services/emissionFactorsData';
import type { CloudResource, DigitalTwin, EdgeDevice, IoTSensor, Project } from '../src/types';

const outputDir = path.resolve(process.argv[2] || 'resultados_experimento');
fs.mkdirSync(outputDir, { recursive: true });
const years = 3;
const project: Project = { id: 'EXP-AP9-42', name: 'EXP-AP9-42 Maiz 10 ha', description: 'Proyecto experimental aislado', location: 'Experimental', cropType: 'Maíz', agriculturalAreaHectares: 10, startDate: '2026-09-15', status: 'En Operación', responsibleUser: 'experimental', createdAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-15T00:00:00Z' };

function sensors(quantity=30, interval=15): IoTSensor[] { return [{ id:'sensor-exp', projectId:project.id, name:'Sensor de humedad experimental', sensorType:'Humedad del Suelo', manufacturer:'Experimental', model:'S-1', quantity, powerWatts:0.15, dailyOperatingHours:24, lifespanYears:3, weightGrams:120, mainMaterials:['PCB','plástico'], transmissionIntervalMinutes:interval, dataSentPerMessageKB:1, communicationTech:'LoRaWAN', acquisitionDate:'2026-09-15', status:'Activo' }]; }
function edge(quantity=1, solar=false): EdgeDevice[] { return quantity ? [{ id:'edge-exp', projectId:project.id, name:'Gateway Edge experimental', deviceType:'Gateway Industrial IoT (Advantech/Siemens)', manufacturer:'Experimental', model:'E-1', cpu:'ARM', ramGB:8, storageGB:128, powerWatts:12, dailyOperatingHours:24, lifespanYears:3, quantity, operatingSystem:'Linux', location:'Parcela', weightKg:1.2, isSolarPowered:solar, status:'Operativo' }] : []; }
function cloud(vcpu=4, daily=24, storage=200, transfer=300, renewable=false): CloudResource[] { return vcpu ? [{ id:'cloud-exp', projectId:project.id, name:'Cloud experimental', provider:'Google Cloud Platform (GCP)', region:'Europa', serviceType:'Máquina Virtual / Compute Engine', vCPU:vcpu, ramGB:16, storageGB:storage, dailyUsageHours:daily, monthlyDataTransferGB:transfer, estimatedPowerConsumptionKWhMonth:30, isRenewableEnergyPowered:renewable }] : []; }
function twin(dataMB=500): DigitalTwin[] { return [{ id:'twin-exp', projectId:project.id, name:'Gemelo maíz experimental', description:'resolución 0.70 documentada', type:'Gemelo Holístico de Parcela / Explotación', aiModelType:'Machine Learning Clásico (Random Forest / XGBoost)', updateFrequencyMinutes:15, dailyProcessedDataMB:dataMB, associatedSensorIds:['sensor-exp'], associatedEdgeDeviceIds:['edge-exp'], associatedCloudResourceIds:['cloud-exp'], simulationHorizonDays:1095, operationalStatus:'Activo', annualRunHours:8760 }]; }
function calc(label:string, s:IoTSensor[], e:EdgeDevice[], c:CloudResource[], t:DigitalTwin[], factors=DEFAULT_EMISSION_FACTORS) {
  return { label, inputs:{sensors:s,e,c,t}, result: CarbonCalculationEngine.calculateProjectAssessment(project,s,e,c,t,factors,years) };
}
function manualSensor(q=30) {
  const mfg=q*4.85, trans=((120*q/1000)/1000)*600*0.125, inst=q*.15, energy=.15*24*365*q/1000, op=(energy*.15)+(((24*60/15)*1*q*365)/(1024*1024)*.008), maint=mfg*.12, eol=(120*q/1000)*-1.8;
  return mfg+trans+inst+(op+maint)*years+eol;
}
function manualEdge(q=1, solar=false) { const mfg=q*29.8, trans=((1.2*q)/1000)*800*.125, inst=q*.8, energy=12*24*365*q/1000, op=energy*(solar?.025:.150), maint=mfg*.1, eol=1.2*q*-1.8; return mfg+trans+inst+(op+maint)*years+eol; }
function manualCloud() { const v=4*24*365*.0032, storage=(200/1024)*12*.85, egress=300*12*.018, mfg=4*2.5; return mfg+(v+storage+egress)*years; }

const validations = [
  { name:'V1_sensores', system:calc('V1',sensors(),[],[],[]).result, manual:manualSensor() },
  { name:'V2_sensores_edge', system:calc('V2',sensors(),edge(),[],[]).result, manual:manualSensor()+manualEdge() },
  { name:'V3_sensores_edge_cloud', system:calc('V3',sensors(),edge(),cloud(),[]).result, manual:manualSensor()+manualEdge()+manualCloud() },
].map(v=>({name:v.name, manualKgCO2e:v.manual, systemKgCO2e:v.system.totalEmissionsKgCO2e, absoluteErrorKgCO2e:Math.abs(v.system.totalEmissionsKgCO2e-v.manual), relativeErrorPct:Math.abs(v.system.totalEmissionsKgCO2e-v.manual)/v.manual*100, note:'El motor siempre añade la red dedicada fija (6.7 + 8.5×años kg CO2e); la diferencia procede de ese componente no incluido en los tres cálculos manuales de componentes.'}));

const scenarios = [
  calc('Cloud-heavy',sensors(),edge(1,false),cloud(8,24,500,900,false),twin(500)),
  calc('Híbrida',sensors(),edge(1,false),cloud(4,12,250,450,false),twin(500)),
  calc('Edge-heavy sin solar',sensors(),edge(2,false),cloud(2,6,100,180,false),twin(500)),
  calc('Edge-heavy con solar',sensors(),edge(2,true),cloud(2,6,100,180,false),twin(500)),
];

const sensitivitySpecs = [
  ['sensor_count',15,30,60], ['edge_count',0,1,2], ['cloud_vcpu',2,4,8], ['cloud_daily_usage_h',6,12,24], ['cloud_storage_gb',50,250,500], ['sensor_transmission_interval_min',5,15,30], ['twin_daily_processed_mb',250,500,1000]
] as const;
const sensitivity:any[]=[];
for (const [variable,min,base,max] of sensitivitySpecs) for (const [level,value] of [['min',min],['base',base],['max',max]] as const) {
  let s=sensors(),e=edge(),c=cloud(4,12,250,450),t=twin();
  if(variable==='sensor_count') s=sensors(value as number); if(variable==='edge_count') e=edge(value as number); if(variable==='cloud_vcpu') c=cloud(value as number,12,250,450); if(variable==='cloud_daily_usage_h') c=cloud(4,value as number,250,450); if(variable==='cloud_storage_gb') c=cloud(4,12,value as number,450); if(variable==='sensor_transmission_interval_min') s=sensors(30,value as number); if(variable==='twin_daily_processed_mb') t=twin(value as number);
  const r=calc(`${variable}_${level}`,s,e,c,t).result; sensitivity.push({variable,level,value,unit:variable.includes('mb')?'MB/día':variable.includes('usage')?'h/día':variable.includes('interval')?'min':variable.includes('storage')?'GB':variable.includes('vcpu')?'vCPU':'unidades',totalKgCO2e:r.totalEmissionsKgCO2e});
}
const data={project, years, factors:DEFAULT_EMISSION_FACTORS, validations, scenarios, sensitivity, limitations:['El motor LCA no expone una intensidad regional Cloud configurable: usa ef-cloud-vcpu-std/ef-cloud-green.', 'No existe un campo independiente de resolución del gemelo; el motor usa dailyProcessedDataMB y updateFrequencyMinutes.', 'No existe un modelo Monte Carlo ni distribuciones o rangos de incertidumbre para los factores demostrativos.']};
fs.writeFileSync(path.join(outputDir,'raw_lca_results.json'),JSON.stringify(data,null,2));
console.log(path.join(outputDir,'raw_lca_results.json'));
