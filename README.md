# Carbon Twin AP-9

Aplicación de análisis del coste de carbono (ACV) de gemelos digitales agrícolas. Conserva la interfaz de la maqueta y ahora incorpora persistencia compartida, API REST y un visor interactivo de la parcela, sensores y modelo en 3D.

## Arquitectura

- **Frontend:** React 19 + Next.js 15 (`http://localhost:3000`).
- **Backend:** FastAPI (`http://localhost:8000`, documentación en `/docs`).
- **Datos:** PostgreSQL 16 para proyectos, sensores, Edge, nube, gemelos, factores, escenarios, usuarios y auditoría.
- **IA:** asesor local de carbono; al definir `OPENAI_API_KEY`, el backend consulta un modelo OpenAI compatible.

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

4. En otra terminal, crea `.env.local` desde `.env.local.example`, instala dependencias y ejecuta el frontend:

   ```powershell
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`. La primera carga inserta los datos de demostración en PostgreSQL y, a partir de ahí, cada alta, edición y eliminación se sincroniza con la API y se audita.

## Seguridad

La contraseña de PostgreSQL no está escrita en el frontend ni en la API: se inyecta por variable de entorno. Antes de desplegar, sustituye `2005` por una contraseña larga, habilita TLS, restringe `CORS_ORIGINS` y añade autenticación OIDC/JWT.
