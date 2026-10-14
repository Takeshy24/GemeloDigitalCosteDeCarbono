# Despliegue de Carbon Twin AP-9 en Render

Preparado el 14 de octubre de 2026. Repositorio: https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono.

## Servicios definidos

`render.yaml` crea Next.js, FastAPI y PostgreSQL 16 en la misma región. El navegador llama a `/api` en el dominio de Next.js; Next.js reenvía las solicitudes a FastAPI por la red privada mediante `API_HOSTPORT`. No se fija una URL pública ni se depende del nombre final asignado por Render.

| Recurso | Configuración |
| --- | --- |
| Frontend | Node 22, `npm ci --include=dev && npm run build`, `npm start -- --hostname 0.0.0.0 --port $PORT` |
| API | Python 3.11.11, `pip install -r backend/requirements-runtime.txt`, Uvicorn en `0.0.0.0:$PORT`, un worker |
| Base de datos | PostgreSQL 16, conexión interna inyectada por Render, conexiones externas bloqueadas |
| Modelos | Disco persistente de 1 GB en `/var/data`; copia inicial de los artefactos incluidos en Git |
| Salud | Frontend `/`; API `/api/ready` comprueba PostgreSQL; `/api/health` informa del estado de IA |

Los dos servicios usan `starter` y PostgreSQL usa `basic-256mb`: **crear este Blueprint genera cargos**, incluido el disco. Comprueba el presupuesto en Render antes de crearlo. No se ha creado infraestructura como parte de esta preparación. Los recursos son apropiados para una demo con carga baja; mide memoria y latencia antes de ampliar su uso.

## Crear el despliegue

1. Revisa el PR de la rama `codex/render-deployment` y confirma que las comprobaciones de GitHub Actions estén verdes.
2. En Render, selecciona **New → Blueprint**, conecta GitHub y elige este repositorio. Para probar antes de integrar, selecciona `codex/render-deployment`; después de integrar el PR puedes usar `main`.
3. Usa el archivo `render.yaml` de la raíz. No selecciones el Dockerfile raíz: ejecuta experimentos y termina, no sirve la aplicación web.
4. Revisa región, planes y cargos, y crea los recursos. `DATABASE_URL` y `API_HOSTPORT` se conectan automáticamente. Mantén vacía o elimina `NEXT_PUBLIC_API_URL` en producción para usar el proxy del mismo dominio.
5. Espera a que API y frontend estén saludables. Abre el dominio del frontend; la primera carga inserta los datos de demostración si todavía no existen.
6. Comprueba `/api/ready`, `/api/health`, `/api/resources/projects`, `/api/ml/status` y `/api/ml/report` desde el dominio del frontend. Crea, edita y elimina un proyecto de prueba y verifica que los cambios sobreviven a una recarga.

La API crea las tablas al arrancar. Esto sirve para la estructura actual; futuros cambios de esquema requieren migraciones y respaldo de la base de datos antes de aplicarse.

## IA opcional

Añade `GEMINI_API_KEY` solo al entorno de `carbon-twin-api` para habilitar LangChain. `GEMINI_MODEL` permite seleccionar un modelo disponible en tu cuenta. Sin credenciales se utiliza el asesor local. No se ha invocado Gemini ni consumido cuota durante las pruebas.

Langflow requiere un servicio adicional accesible desde FastAPI y `LANGFLOW_URL`, `LANGFLOW_FLOW_ID`, `LANGFLOW_API_KEY`. Consulta `langflow/README.md`. Si Langflow falla, la API intenta LangChain y finalmente el asesor local. No publiques claves en GitHub, Jira ni variables `NEXT_PUBLIC_*`.

## Machine Learning y laboratorio

La configuración de Render conserva reportes y predicción con el modelo incluido. El entrenamiento queda deshabilitado mediante `ML_TRAINING_ENABLED=false` para evitar cargar TensorFlow y búsquedas de hiperparámetros en una instancia pequeña. La interfaz refleja esa disponibilidad.

El laboratorio Streamlit es opcional y no se crea en el Blueprint. Puedes ejecutarlo localmente con `pip install -r backend/requirements.txt` y `npm run ml:lab`. Para mostrar un laboratorio remoto, configura `NEXT_PUBLIC_ML_LAB_URL` en el frontend y vuelve a compilar. Sin esa variable no aparece un enlace a localhost en producción.

Si habilitas entrenamiento en la API, instala `backend/requirements.txt`, aumenta recursos tras medir el pipeline y activa `ML_TRAINING_ENABLED=true`. Mantén un solo worker: el estado del pipeline está en memoria. El disco conserva los artefactos entre despliegues; realiza un respaldo propio de modelos y reportes. Dos servicios separados no comparten este disco: un laboratorio remoto necesita una estrategia explícita de publicación de modelos.

## Alcance de seguridad

Este despliegue mantiene el funcionamiento actual de **demo compartida**. El selector de roles del frontend no autentica solicitudes: los endpoints CRUD y bootstrap carecen de autorización. Antes de almacenar datos privados o permitir uso público de producción, implementa autenticación y autorización en la API. CORS y la conexión privada a PostgreSQL no reemplazan esa protección.

La interfaz muestra algunos ejemplos de arquitectura; la referencia contractual real de FastAPI es `/docs` en el dominio de la API y `/openapi.json`. El proxy del frontend reenvía únicamente `/api/*`.

## Verificación y mantenimiento

```powershell
npm run lint
npm run build
python -m pip install -r backend/requirements-runtime.txt pytest pyyaml jsonschema
python -m pytest backend/tests -q
python scripts/validate_render.py
```

La prueba de integración con PostgreSQL usa `TEST_DATABASE_URL` y crea y elimina exclusivamente un esquema temporal. En GitHub Actions se usa una base efímera PostgreSQL 16. El esquema oficial valida la estructura YAML; no verifica permisos de Render, disponibilidad de nombres ni el despliegue real.

Para revertir código, usa un despliegue anterior desde Render. Restaurar una base de datos o modelos es una operación separada: conserva respaldos antes de cambios incompatibles.

Referencias: [Blueprints](https://render.com/docs/blueprint-spec), [red privada](https://render.com/docs/private-network), [discos persistentes](https://render.com/docs/disks), [checks de salud](https://render.com/docs/health-checks).
