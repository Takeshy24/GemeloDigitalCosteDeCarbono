# Carbon Twin AP-9: documentación técnica y funcional

Fecha de revisión: 14 de octubre de 2026. Publicada en [KAN-4: Carbon twin](https://takeshydiaz05.atlassian.net/browse/KAN-4), proyecto KAN. Se verificó que la descripción conserva sus seis secciones, tablas y referencias después de recargar Jira.

Código documentado: [main, commit 173a349](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/tree/173a34942129b2b5b8e1a353a67452eb730463c0). Preparación para Render integrada mediante [PR #1](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/pull/1). Esta documentación describe la implementación revisada; no acredita un despliegue ya ejecutado en Render.

## 1. Propósito, alcance y módulos funcionales

Carbon Twin AP-9 permite inventariar infraestructura agrícola IoT, Edge y Cloud, representar gemelos digitales, estimar su coste de carbono durante el ciclo de vida y comparar alternativas. Ofrece un asistente para interpretar los resultados y un módulo de predicción mediante Machine Learning.

El flujo principal consiste en seleccionar o crear un proyecto, registrar su infraestructura, revisar la evaluación de carbono, comparar escenarios y exportar informes. Los datos iniciales son de demostración. Los resultados calculados y las predicciones deben interpretarse según sus entradas y supuestos.

| Módulo | Función en la aplicación |
| --- | --- |
| Dashboard Principal | Indicadores y resúmenes del proyecto seleccionado |
| Proyectos Agrícolas | Datos de parcela, cultivo, superficie, estado y presupuesto de carbono |
| Sensores IoT en Campo | Inventario, potencia, horarios, cantidad y comunicaciones de sensores |
| Infraestructura Edge | Inventario y configuración de gateways y dispositivos de procesamiento local |
| Recursos Cloud y BD | Recursos de cómputo, almacenamiento y configuración energética |
| Gemelos Digitales | Modelos y parámetros de sincronización; visor 3D implementado con Three.js |
| Ciclo de Vida | Evaluación de emisiones por etapa, capa y componente |
| Factores de Emisión | Catálogo editable de factores utilizados por el motor |
| Comparar Escenarios | Comparación de alternativas de configuración e infraestructura |
| Informes | Exportaciones PDF, Word y Excel |
| Asistente IA Carbono | Interpretación del contexto calculado y preguntas del usuario |
| Pipeline ML | Consulta de reportes, estado y disponibilidad del entrenamiento |
| Usuarios | Gestión de registros de usuario y selector de rol en la interfaz |
| Registro de Auditoría | Registros de acciones enviados por el frontend |
| Arquitectura y FastAPI | Material explicativo dentro de la interfaz |

Los roles visibles son Administrador, Investigador/Analista y Consulta. Controlan opciones de interfaz; no existe autenticación JWT/OIDC ni autorización de solicitudes en la API actual. El registro de auditoría se genera desde el cliente y no constituye una bitácora inmutable del servidor.

Fuentes: [Sidebar.tsx](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/src/components/Sidebar.tsx), [App.tsx](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/src/App.tsx), [tipos de dominio](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/src/types.ts).

## 2. Arquitectura, persistencia y contrato API

El frontend activo utiliza React 19, Next.js 15, TypeScript y Tailwind CSS. FastAPI y SQLAlchemy gestionan la API y persistencia PostgreSQL. El motor determinista de carbono se ejecuta en el frontend. Streamlit constituye un laboratorio opcional independiente. Los archivos antiguos de Vite y Express no son los procesos seleccionados por los comandos actuales de despliegue.

En Render, el navegador solicita `/api/*` al mismo dominio del frontend. Next.js utiliza `API_HOSTPORT` para reenviar estas solicitudes a FastAPI por la red privada. Render inyecta `DATABASE_URL`; la aplicación normaliza `postgresql://` y `postgres://` al driver `postgresql+psycopg` sin perder credenciales escapadas ni parámetros TLS.

La tabla `resources` almacena los campos `id`, `kind`, `external_id`, `project_id`, `payload` JSONB, `created_at` y `updated_at`. La pareja `kind, external_id` es única. Los tipos admitidos son `projects`, `sensors`, `edge`, `cloud`, `twins`, `emission-factors`, `scenarios`, `users` y `audit-logs`. Esta es una persistencia genérica de recursos, sin tablas específicas por cada entidad funcional.

| Método y ruta | Contrato |
| --- | --- |
| GET `/api/health` | Estado del servicio y configuración de IA sin exponer claves |
| GET `/api/ready` | Consulta `SELECT 1` a PostgreSQL; HTTP 503 si no está disponible |
| GET `/api/resources/{kind}` | Lista recursos; filtro opcional `project_id` |
| PUT `/api/resources/{kind}/{external_id}` | Crea o actualiza; recibe `id`, `projectId` opcional y `data` |
| DELETE `/api/resources/{kind}/{external_id}` | Elimina un recurso y devuelve HTTP 204; HTTP 404 si no existe |
| POST `/api/bootstrap` | Inserta recursos iniciales que no existen; devuelve el número creado |
| POST `/api/ai/analyze` | Recibe proyecto, evaluación, pregunta e historial; devuelve análisis y fuente |
| GET `/api/ml/status` | Estado del pipeline y disponibilidad del entrenamiento |
| GET `/api/ml/report` | Último reporte JSON; HTTP 404 si no está disponible |
| POST `/api/ml/predict` | Predice `total_co2e_kg`; HTTP 503 si faltan modelo o preprocesador |
| POST `/api/ml/train` | HTTP 202 al iniciar; HTTP 403 si está deshabilitado; HTTP 409 si ya está corriendo |

Un tipo de recurso no admitido devuelve HTTP 404. Si el identificador de ruta difiere del `id` enviado en un PUT, devuelve HTTP 400. Los esquemas Pydantic validan las entradas y FastAPI publica el contrato OpenAPI en `/openapi.json`, con interfaz `/docs` en el dominio de la API. El proxy del frontend solo cubre `/api/*`.

El frontend mantiene además datos en `localStorage` y aplica cambios de interfaz de manera optimista. Algunos errores de guardado se silencian: una actualización visible no garantiza por sí sola que PostgreSQL haya recibido el cambio. Para verificar persistencia, consulta la API y recarga la aplicación.

Fuentes: [main.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/main.py), [models.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/models.py), [database.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/database.py), [next.config.ts](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/next.config.ts).

## 3. Motor de carbono, entradas y supuestos

`CarbonCalculationEngine` genera una evaluación de proyecto a partir de sensores, dispositivos Edge, recursos Cloud, gemelos y factores de emisión. El período de análisis predeterminado es de tres años. Las salidas incluyen emisiones totales en kg CO2e, energía, desglose del ciclo de vida, aportaciones por capa y por componente, indicadores y recomendaciones.

Las etapas consideradas son fabricación, transporte, instalación, operación, mantenimiento y fin de vida. Su tratamiento depende de la capa: no todas las etapas tienen aportaciones en todos los componentes.

Ejemplo de cálculo implementado para sensores:

```text
energía anual (kWh) = potencia (W) × horas diarias × 365 × cantidad / 1000
emisiones eléctricas anuales (kg CO2e) = energía anual × factor eléctrico
fabricación = cantidad × factor de fabricación del tipo de sensor
ciclo de vida = fabricación + transporte + instalación
                + operación anual × años + mantenimiento anual × años + fin de vida
```

El motor incluye también comunicaciones, cómputo Cloud y sobrecarga asociada al gemelo. Utiliza factores configurados y valores de respaldo si no encuentra el identificador requerido. Hay supuestos fijos en el código, por ejemplo 600 km de transporte para sensores y 800 km para Edge, y créditos de fin de vida que pueden ser negativos.

Para comparar escenarios, conserva la misma unidad, período y límites del sistema. Registra qué entrada o factor cambió. Los resultados son estimaciones del modelo; no equivalen automáticamente a mediciones físicas, una certificación ISO ni una auditoría independiente de emisiones. El origen y vigencia de cada factor deben revisarse antes de utilizar el cálculo en una decisión real.

Fuente: [carbonEngine.ts](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/src/services/carbonEngine.ts), [catálogo de factores](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/src/services/emissionFactorsData.ts).

## 4. Machine Learning, datos y asistente IA

El pipeline compara Random Forest, XGBoost, SVR, Stacking y Blending. Realiza carga de datos, EDA, preprocesamiento, entrenamiento, evaluación, pruebas estadísticas y exportación de artefactos. El entrenamiento aplica un split 80/20 y ajusta el preprocesador con el conjunto de entrenamiento. Incluye búsqueda aleatoria de hiperparámetros y validación cruzada; los parámetros predeterminados del pipeline son 20 iteraciones de búsqueda, cinco folds durante búsqueda y diez folds en evaluación final.

El código estadístico incluye Friedman, Wilcoxon, t-test corregido Nadeau-Bengio, intervalos bootstrap del RMSE y Shapiro-Wilk sobre residuos. Las métricas deben leerse junto con el dataset, semilla, particiones y configuración del experimento correspondiente.

La selección de datos intenta primero un CSV indicado que exista, después `real_dataset.csv`, después `dataset.csv` y finalmente genera datos sintéticos. El script que construye `real_dataset.csv` combina muestras de fuentes abiertas con parámetros simulados y calcula la variable objetivo mediante un modelo energético y ruido. Por tanto, ese nombre de archivo no demuestra que la huella objetivo haya sido medida físicamente en campo.

El artefacto utilizado por `/api/ml/predict` es `best_model_sklearn.pkl` junto con `preprocessor.pkl`. El reporte incluido, generado el 29 de septiembre de 2026, identifica **SVR** como ganador sobre 2.500 registros y nueve variables predictoras: RMSE 25,7887 kg CO2e, MAE 14,3434 kg CO2e, R² 0,987388 y MAPE 8,6252 %. Estos son resultados archivados del experimento, no resultados de un nuevo entrenamiento realizado durante esta preparación. El archivo Keras `.h5` corresponde a una exportación por destilación y no es el modelo utilizado por ese endpoint.

| Entrada de predicción | Validación API |
| --- | --- |
| `sensor_count` | Entero entre 1 y 200 |
| `edge_count` | Entero entre 1 y 50 |
| `cloud_region_intensity` | Entre 0,01 y 1,0 |
| `data_volume_gb_day` | Entre 0,01 y 500 |
| `transmission_freq_hz` | Entre 0,0001 y 20 |
| `model_resolution` | Entre 0,05 y 1,0 |
| `crop_type` | Cadena; predeterminado `wheat` |
| `operation_days` | Entero entre 1 y 365 |
| `solar_powered` | Booleano; predeterminado `false` |

Que una entrada cumpla los límites de la API no garantiza que pertenezca a la distribución de entrenamiento. Debe revisarse esa correspondencia antes de interpretar una predicción.

El asistente recibe únicamente el contexto suministrado por el motor y un historial acotado. Intenta Langflow si URL, flujo y clave están configurados; después LangChain con Gemini y finalmente el asesor local. Su propósito es explicar y recomendar; no sustituye el cálculo determinista. Las claves permanecen en el backend. La disponibilidad real de un modelo Gemini se comprueba en la cuenta del proveedor.

Fuentes: [pipeline.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/ml/pipeline.py), [training.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/ml/training.py), [statistical_tests.py](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/ml/statistical_tests.py), [construcción de datos](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/scripts/build_real_dataset.py), [reporte ML](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/ml_artifacts/ml_report.json), [asistente LangChain](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/backend/app/ai/langchain_assistant.py).

## 5. Instalación y despliegue en Render

Para desarrollo local, crea PostgreSQL y sus credenciales, copia `backend/.env.example` a `backend/.env`, instala las dependencias completas con `python -m pip install -r backend/requirements.txt` y arranca `python -m uvicorn backend.app.main:app --reload --port 8000`. Copia `.env.local.example` a `.env.local`, ejecuta `npm ci` y `npm run dev`. El frontend está en el puerto 3000 y el laboratorio opcional se inicia mediante `npm run ml:lab` en el puerto 8501.

`render.yaml` define dos servicios web y PostgreSQL 16 en Oregon. Next.js usa Node 22 y FastAPI Python 3.11.11. Los servicios `starter`, la base `basic-256mb` y el disco persistente generan cargos cuando se crean; no se han creado recursos en Render durante esta preparación.

| Configuración | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión interna inyectada desde PostgreSQL de Render |
| `API_HOSTPORT` | Destino privado de la API, inyectado en Next.js |
| `ML_ARTIFACTS_DIR=/var/data/ml_artifacts` | Directorio de modelos en disco persistente de 1 GB |
| `ML_TRAINING_ENABLED=false` | Conserva predicción/reportes y evita entrenamiento en la instancia pequeña |
| `GEMINI_API_KEY` y `GEMINI_MODEL` | Configuración opcional de Gemini, únicamente en el backend |
| `LANGFLOW_URL`, `LANGFLOW_FLOW_ID`, `LANGFLOW_API_KEY` | Configuración opcional de Langflow |
| `NEXT_PUBLIC_ML_LAB_URL` | Enlace opcional a un laboratorio remoto; requiere recompilar frontend |

Pasos de despliegue:

1. En Render, abre New → Blueprint, conecta GitHub y selecciona `Takeshy24/GemeloDigitalCosteDeCarbono`, rama `main`.
2. Selecciona `render.yaml` en la raíz y revisa los planes y cargos.
3. Crea los recursos; Render conecta automáticamente base de datos y API. No uses el Dockerfile raíz: ejecuta experimentos, no la aplicación web.
4. Mantén vacía o elimina `NEXT_PUBLIC_API_URL` en producción para utilizar el proxy del mismo dominio.
5. Comprueba frontend `/`, API `/api/ready`, reportes e inferencia. Confirma persistencia después de recargar y reiniciar el servicio.

La API crea tablas al arrancar. La inicialización del disco copia los modelos del repositorio sin reemplazar archivos existentes. Exporta respaldos de PostgreSQL y modelos antes de cambios incompatibles. Un laboratorio remoto y la API no comparten automáticamente el disco. El pipeline utiliza estado en memoria, por lo que el servicio se configura con un worker.

Fuente y guía ampliada: [render.yaml](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/render.yaml), [guía Render](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/docs/RENDER_DEPLOYMENT.md), [Langflow](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/langflow/README.md).

## 6. Calidad, operación y trabajo pendiente

El último commit del PR antes de la integración (`fb8cc04`) superó el workflow [Validate Render deployment](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/actions/runs/38619279347). Las comprobaciones incluyen instalación de dependencias, tipos y compilación del frontend, 17 pruebas backend sobre PostgreSQL 16 y validación del Blueprint contra el esquema oficial. También se verificó localmente Next.js en modo producción con el proxy hacia FastAPI.

Las pruebas cubren, entre otros casos, CRUD en un esquema temporal, identificadores inconsistentes, inferencia con el modelo incluido, normalización de la URL de PostgreSQL, conservación de artefactos persistentes, salud de la base de datos, entrenamiento deshabilitado y respaldos del asistente. No ejecutan un entrenamiento completo ni consumen cuota de IA.

Comandos de validación:

```text
npm ci --include=dev
npm run lint
npm run build
python -m pip install -r backend/requirements-runtime.txt pytest pyyaml jsonschema
python -m pytest backend/tests -q
python scripts/validate_render.py
```

La prueba PostgreSQL requiere `TEST_DATABASE_URL`; sin esa variable se omite esa prueba de integración. Utiliza exclusivamente un esquema efímero propio. La validación YAML comprueba estructura, no permisos, nombres disponibles ni comportamiento del despliegue real.

Prioridades pendientes:

- Implementar autenticación y autorización en la API antes de manejar datos privados.
- Incorporar migraciones de esquema y estrategia de respaldos/restauración.
- Mejorar notificación de fallos de guardado para evitar divergencias entre UI y base de datos.
- Trasladar entrenamiento prolongado a un worker o laboratorio con recursos medidos.
- Revisar trazabilidad de factores y validar predicciones con mediciones independientes.
- Medir memoria, latencia y carga antes de aumentar usuarios; optimizar la carga inicial del frontend.

La aplicación preparada es una demo compartida. CORS, los roles de interfaz y los metadatos de auditoría del cliente no reemplazan una barrera de autenticación. No se debe describir el proyecto como multitenant aislado, certificado ISO o validado en campo sin evidencia adicional.

Fuentes: [workflow CI](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/.github/workflows/ci.yml), [pruebas backend](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/tree/main/backend/tests), [revisión de despliegue](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/blob/main/docs/DEPLOYMENT_REVIEW.md).
