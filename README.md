# Carbon Twin AP-9

Aplicación de análisis del coste de carbono (ACV) de gemelos digitales agrícolas. Conserva la interfaz de la maqueta y ahora incorpora persistencia compartida, API REST y un visor interactivo de la parcela, sensores y modelo en 3D.

## Arquitectura

- **Frontend:** React 19 + Next.js 15 (`http://localhost:3000`).
- **Backend:** FastAPI (`http://localhost:8000`, documentación en `/docs`).
- **Datos:** PostgreSQL 16 para proyectos, sensores, Edge, nube, gemelos, factores, escenarios, usuarios y auditoría.
- **IA:** Langflow como orquestador visual, LangChain + Gemini como segundo nivel y asesor local como respaldo final. Todos reciben únicamente el contexto verificado del gemelo.

## Inicio rápido local

1. Asegúrate de tener PostgreSQL 16 instalado y crea la base de datos y el usuario:

   ```powershell
   psql -U postgres -c "CREATE USER carbon_user WITH PASSWORD '2005';"
   psql -U postgres -c "CREATE DATABASE carbon_twins OWNER carbon_user;"
   ```

2. Crea `backend/.env` desde `backend/.env.example`. La conexión local predeterminada usa `carbon_user`, la contraseña `2005` y la base `carbon_twins`.

3. Levanta la API:

   ```powershell
   python -m pip install -r backend/requirements.txt
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```

   Para habilitar LangChain, define `GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` en `backend/.env`. Puedes confirmar el estado sin exponer la clave en `GET /api/health`; el campo `ai.langchain.configured` debe ser `true`.

   Para habilitar también Langflow, sigue [langflow/README.md](langflow/README.md). Cuando esté configurado, `ai.primary` será `langflow`; si el servicio no responde, la API continúa automáticamente con LangChain.

4. En otra terminal, crea `.env.local` desde `.env.local.example`, instala dependencias y ejecuta el frontend:

   ```powershell
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`. La primera carga inserta los datos de demostración en PostgreSQL y, a partir de ahí, cada alta, edición y eliminación se sincroniza con la API y se audita.

## Uso con Docker

El repositorio incluye un `Dockerfile` que permite la containerización del pipeline completo, garantizando la reproducibilidad en cualquier sistema operativo.

### Construir la imagen

```bash
docker build -t carbontwin:1.0.0 .
docker run --rm carbontwin:1.0.0
```

El Dockerfile raíz ejecuta experimentos. El servicio web de frontend y API utiliza `Dockerfile.render`, compatible con Render y Railway.

## Render

Consulta [la guía de despliegue](docs/RENDER_DEPLOYMENT.md) y el [análisis técnico](docs/DEPLOYMENT_REVIEW.md).

## Railway

La [demo pública de Carbon Twin](https://carbon-twin-web-production.up.railway.app/) se verificó el 14/10/2026. Consulta [la guía de Railway](docs/RAILWAY_DEPLOYMENT.md) para reutilizar la imagen Docker en un único servicio con SQLite temporal y conocer los límites de créditos y persistencia.

## Documentación en Jira

La documentación técnica y funcional actual está publicada en [KAN-4: Carbon twin](https://takeshydiaz05.atlassian.net/browse/KAN-4). Su [versión Markdown](docs/JIRA_DOCUMENTATION.md) incluye módulos, arquitectura/API, cálculo de carbono, ML e IA, despliegue y pruebas.

## Seguridad

La contraseña de PostgreSQL no está escrita en el frontend ni en la API: se inyecta por variable de entorno. Antes de desplegar, sustituye `2005` por una contraseña larga, habilita TLS, restringe `CORS_ORIGINS` y añade autenticación OIDC/JWT.
