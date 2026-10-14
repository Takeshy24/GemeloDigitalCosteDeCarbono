# Despliegue gratuito de Carbon Twin AP-9 en Render

Actualizado el 14 de octubre de 2026. Repositorio: https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono, rama `main`.

## Arquitectura Free

`render.yaml` define un único servicio web Docker `carbon-twin-ap9` en plan `free`. La demo utiliza SQLite temporal en `/tmp/carbon-twin-demo.db`; no crea PostgreSQL ni usa la base de otra aplicación. `Dockerfile.render` compila Next.js como exportación estática y FastAPI publica la interfaz y `/api/*` en el mismo dominio. No se necesitan un servidor Node en producción, `API_HOSTPORT`, URLs API públicas ni un disco de pago.

El Dockerfile raíz sigue ejecutando experimentos; el archivo correcto para desplegar la aplicación es `Dockerfile.render`. Su archivo `.dockerignore` específico conserva los fuentes del frontend y excluye credenciales, cachés y documentación.

## Límites de gratuidad

Render suspende un servicio Free tras 15 minutos sin tráfico y lo reactiva con la siguiente visita, con una espera inicial. El workspace dispone de 750 horas gratuitas al mes. El cupo PostgreSQL Free del workspace ya está ocupado por otra app; esta demo no depende de él. Los archivos locales modificados no persisten tras suspensión, reinicio o redeploy, y Free no admite discos persistentes.

Los modelos y reportes incluidos en Git se distribuyen dentro de la imagen. La predicción permanece disponible y `ML_TRAINING_ENABLED=false` evita entrenamientos que perderían sus resultados o excederían los recursos pequeños. Streamlit y Langflow no se despliegan con este Blueprint. Gemini es opcional y depende de la cuota de su proveedor.

Selecciona solamente recursos Free. No añadas un método de pago para esta demo: si se agotan los límites incluidos, Render puede suspender servicios o compilaciones en vez de generar cargos. No cambies a planes de pago para resolver un límite sin autorización del usuario.

## Desplegar

1. En Render, New → Blueprint, conecta el repositorio y selecciona `main`.
2. Usa `render.yaml` y confirma que el único servicio indique Free, sin bases externas, discos ni cargos.
3. SQLite se configura mediante `DATABASE_URL=sqlite:////tmp/carbon-twin-demo.db` y la API crea las tablas al arrancar.
4. Espera a que la imagen termine de construirse y `/api/ready` marque el servicio saludable.
5. Abre la URL `onrender.com`. La primera carga inserta datos de demostración ausentes.
6. Comprueba `/api/health`, `/api/ready`, `/api/ml/report`, recursos y predicción. Crea y elimina un proyecto de prueba y verifica persistencia al recargar.

Si el workspace ya tiene una base PostgreSQL Free, reutiliza la conexión de la base correcta o solicita al usuario elegirla; no elimines una base existente para liberar el cupo. No cambies la base de datos de otro proyecto.

## Configuración

| Variable | Uso |
| --- | --- |
| DATABASE_URL | `sqlite:////tmp/carbon-twin-demo.db`, almacenamiento temporal de demo |
| FRONTEND_DIST_DIR | `/app/frontend`, definida en la imagen Docker |
| ML_TRAINING_ENABLED | `false` para esta demo |
| GEMINI_API_KEY, GEMINI_MODEL | IA generativa opcional; solo en backend |
| LANGFLOW_URL, LANGFLOW_FLOW_ID, LANGFLOW_API_KEY | Orquestador opcional si existe un servicio adicional |

No definas `NEXT_PUBLIC_API_URL` al construir esta imagen: el navegador llama a la API del mismo dominio. No publiques claves en GitHub, Jira ni variables `NEXT_PUBLIC_*`. Para desarrollo local, los comandos Next.js normales conservan el comportamiento anterior; `NEXT_STATIC_EXPORT=1` activa la exportación utilizada en Docker.

## Pruebas y operación

La API publica primero sus rutas y después los archivos estáticos: `/docs` y `/openapi.json` también funcionan. Las pruebas verifican que el frontend no oculte rutas API, que sirva assets y que rechace rutas inexistentes. GitHub Actions compila Next.js, ejecuta las pruebas PostgreSQL y construye la imagen Docker de Render.

La demo mantiene las limitaciones del proyecto: no hay autenticación ni autorización API, el selector de roles solo controla la interfaz y no existen migraciones de esquema. Usa datos de demostración. Para datos privados hace falta resolver esos puntos. Las predicciones y el motor de carbono son estimaciones, no mediciones certificadas.

**Los datos SQLite se pierden al reiniciar, suspender o reconstruir el servicio.** La interfaz conserva además una copia local en el navegador, que tampoco sustituye una base compartida persistente. Usa las exportaciones de informes/datos antes de reinicios. Para persistencia duradera se puede configurar una base PostgreSQL externa posteriormente; el código conserva compatibilidad con PostgreSQL y JSONB.

Referencias: [plan gratuito](https://render.com/docs/free), [Docker](https://render.com/docs/docker), [Blueprints](https://render.com/docs/blueprint-spec).
