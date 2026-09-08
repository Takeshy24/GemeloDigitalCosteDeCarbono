import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CLOUD_RESOURCES,
  INITIAL_DIGITAL_TWINS,
  INITIAL_EDGE_DEVICES,
  INITIAL_PROJECTS,
  INITIAL_SCENARIOS,
  INITIAL_SENSORS,
  INITIAL_USERS,
} from '../src/services/demoData';
import { INITIAL_EMISSION_FACTORS } from '../src/services/emissionFactorsData';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const resources = {
  projects: INITIAL_PROJECTS,
  sensors: INITIAL_SENSORS,
  edge: INITIAL_EDGE_DEVICES,
  cloud: INITIAL_CLOUD_RESOURCES,
  twins: INITIAL_DIGITAL_TWINS,
  'emission-factors': INITIAL_EMISSION_FACTORS,
  scenarios: INITIAL_SCENARIOS,
  users: INITIAL_USERS,
  'audit-logs': INITIAL_AUDIT_LOGS,
};

const response = await fetch(`${apiUrl}/api/bootstrap`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resources }),
});

if (!response.ok) {
  throw new Error(`No se pudo inicializar PostgreSQL: ${response.status} ${await response.text()}`);
}

const result = await response.json() as { created: number };
console.log(`Base de datos verificada. Registros añadidos: ${result.created}`);
