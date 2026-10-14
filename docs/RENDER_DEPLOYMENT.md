# Despliegue gratuito de Carbon Twin AP-9 en Render

Actualizado el 14 de octubre de 2026. Repositorio: https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono, rama `main`.

## Arquitectura Free

`render.yaml` define un único servicio web Docker `carbon-twin-ap9` y una base PostgreSQL 16 `carbon-twin-db`, ambos en plan `free`. `Dockerfile.render` compila Next.js como exportación estática y FastAPI publica la interfaz y `/api/*` en el mismo dominio. No se necesitan un servidor Node en producción, `API_HOSTPORT`, URLs API públicas ni un disco de pago.

El Dockerfile raíz sigue ejecutando experimentos; el archivo correcto para desplegar la aplicación es `Dockerfile.render`. Su archivo `.dockerignore` específico conserva los fuentes del frontend y excluye credenciales, cachés y documentación.

## Límites de gratuidad

Render suspende un servicio Free tras 15 minutos sin tráfico y lo reactiva con la siguiente visita, con una espera inicial. El workspace dispone de 750 horas gratuitas al mes. PostgreSQL Free tiene 1 GB, admite una sola base Free por workspace y **vence a los 30 días**; exporta los datos antes de su vencimiento. Los archivos locales modificados no persisten tras suspensión, reinicio o redeploy, y Free no admite discos persistentes.

Los modelos y reportes incluidos en Git se distribuyen dentro de la imagen. La predicción permanece disponible y `ML_TRAINING_ENABLED=false` evita entrenamientos que perderían sus resultados o excederían los recursos pequeños. Streamlit y Langflow no se despliegan con este Blueprint. Gemini es opcional y depende de la cuota de su proveedor.

Selecciona solamente recursos Free. No añadas un método de pago para esta demo: si se agotan los límites incluidos, Render puede suspender servicios o compilaciones en vez de generar cargos. No cambies a planes de pago para resolver un límite sin autorización del usuario.

## Desplegar

1. En Render, New → Blueprint, conecta el repositorio y selecciona `main`.
2. Usa `render.yaml` y confirma que el servicio y PostgreSQL indiquen Free, sin discos ni cargos.
3. Render inyecta `DATABASE_URL` desde la base. La API normaliza la URL al driver psycopg 3 y crea las tablas al arrancar.
4. Espera a que la imagen termine de construirse y `/api/ready` marque el servicio saludable.
5. Abre la URL `onrender.com`. La primera carga inserta datos de demostración ausentes.
6. Comprueba `/api/health`, `/api/ready`, `/api/ml/report`, recursos y predicción. Crea y elimina un proyecto de prueba y verifica persistencia al recargar.

Si el workspace ya tiene una base PostgreSQL Free, reutiliza la conexión de la base correcta o solicita al usuario elegirla; no elimines una base existente para liberar el cupo. No cambies la base de datos de otro proyecto.

## Configuración

| Variable | Uso |
| --- | --- |
| DATABASE_URL | Conexión interna PostgreSQL, inyectada por Render |
| FRONTEND_DIST_DIR | `/app/frontend`, definida en la imagen Docker |
| ML_TRAINING_ENABLED | `false` para esta demo |
| GEMINI_API_KEY, GEMINI_MODEL | IA generativa opcional; solo en backend |
| LANGFLOW_URL, LANGFLOW_FLOW_ID, LANGFLOW_API_KEY | Orquestador opcional si existe un servicio adicional |

No definas `NEXT_PUBLIC_API_URL` al construir esta imagen: el navegador llama a la API del mismo dominio. No publiques claves en GitHub, Jira ni variables `NEXT_PUBLIC_*`. Para desarrollo local, los comandos Next.js normales conservan el comportamiento anterior; `NEXT_STATIC_EXPORT=1` activa la exportación utilizada en Docker.

## Pruebas y operación

La API publica primero sus rutas y después los archivos estáticos: `/docs` y `/openapi.json` también funcionan. Las pruebas verifican que el frontend no oculte rutas API, que sirva assets y que rechace rutas inexistentes. GitHub Actions compila Next.js, ejecuta las pruebas PostgreSQL y construye la imagen Docker de Render.

La demo mantiene las limitaciones del proyecto: no hay autenticación ni autorización API, el selector de roles solo controla la interfaz y no existen migraciones de esquema. Usa datos de demostración. Para datos privados hace falta resolver esos puntos. Las predicciones y el motor de carbono son estimaciones, no mediciones certificadas.

Antes de vencer PostgreSQL, exporta los datos mediante las herramientas de respaldo apropiadas. La continuidad de los datos después de 30 días requiere una estrategia distinta; no hay persistencia gratuita indefinida garantizada por esta configuración.

Referencias: [plan gratuito](https://render.com/docs/free), [Docker](https://render.com/docs/docker), [Blueprints](https://render.com/docs/blueprint-spec).
