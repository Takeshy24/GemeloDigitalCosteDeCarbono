# Despliegue de la demo en Railway

Primer despliegue verificado el 14/10/2026 a las 21:04 UTC (16:04, Lima): [abrir Carbon Twin](https://carbon-twin-web-production.up.railway.app/). Railway marcó como `SUCCESS` el despliegue `50961956-9de5-4602-a23b-a179ab6f113c`, del commit `9110d249cd9f2e24cebeba1dceab8b4f25b132aa`. Esta es evidencia del estado observado en esa fecha, no una garantía de disponibilidad permanente.

## Servicio único desde GitHub

Usar el repositorio `Takeshy24/GemeloDigitalCosteDeCarbono`, rama `main`, con la raíz del repositorio como directorio de trabajo. Crear un solo servicio para frontend estático, API FastAPI y predicción ML.

Antes del primer despliegue, configurar estas variables del servicio:

```dotenv
RAILWAY_DOCKERFILE_PATH=Dockerfile.render
DATABASE_URL=sqlite:////tmp/carbon-twin-demo.db
ML_TRAINING_ENABLED=false
PORT=10000
```

Aunque su nombre contiene Render, `Dockerfile.render` construye una imagen Docker portable. Incluye la exportación estática de Next.js y la sirve desde FastAPI junto con `/api`. El `Dockerfile` raíz ejecuta experimentos ML y no debe usarse para el servicio web. Conservar también `Dockerfile.render.dockerignore`, que incluye el frontend y excluye credenciales locales.

En los ajustes del servicio:

- Usar Docker y el archivo indicado; no agregar comandos de compilación ni de inicio: la imagen ya los define.
- Configurar el healthcheck HTTP en `/api/ready`, con timeout de 300 segundos.
- Mantener una réplica y política de reinicio `On Failure`, hasta tres reintentos.
- Generar el dominio público con puerto de destino `10000` cuando el despliegue esté saludable.
- No crear PostgreSQL, Redis, volúmenes ni otros servicios para esta demo.
- Para evitar reconstrucciones por cambios de documentación, los watch paths del servicio son `**`, `!/docs/**` y `!/README.md` (una regla por línea).

## Créditos y datos

La prueba de Railway ofrece US$5 de crédito que vencen a los 30 días. Puede agotarse antes según el consumo. Después, el plan Free incluye US$1 mensual; no se garantiza que alcance para mantener esta aplicación disponible continuamente. Revisar los créditos y las restricciones reales de la cuenta antes de desplegar. No activar Hobby, Pro ni una suscripción de pago para seguir esta guía.

SQLite se guarda en almacenamiento temporal: los cambios pueden perderse al reemplazar el contenedor o volver a desplegar. Es una demo, sin persistencia garantizada. La predicción utiliza los modelos incluidos; el entrenamiento permanece deshabilitado. Gemini y Langflow son opcionales y, sin sus credenciales, se utiliza el asesor local.

## Verificación pública

La verificación inicial confirmó la interfaz y sus recursos estáticos, HTTP 200 en `/api/health`, `/api/ready` y `/docs`, y tres proyectos de demostración consultables en la API después de abrir la interfaz. `/api/ml/predict` respondió HTTP 200 con `total_co2e_kg=270.6074` para 10 sensores, 2 nodos Edge, intensidad 0.3, 5 GB/día, frecuencia 0.1 Hz, resolución 0.5, cultivo wheat, 180 días y sin energía solar. Se utilizó el modelo archivado, sin entrenamiento. El resultado se registró en [Jira KAN-4](https://takeshydiaz05.atlassian.net/browse/KAN-4).

En futuros despliegues, confirmar que el servicio llegó a estado saludable y comprobar:

1. `/` carga la interfaz y sus recursos estáticos.
2. `/api/health` responde sin revelar claves y `/api/ready` devuelve HTTP 200.
3. `/docs` muestra los endpoints de FastAPI.
4. La interfaz lee datos de la API y una predicción ML responde correctamente.

Registrar el dominio, el commit desplegado y el resultado real de las comprobaciones en Jira KAN-4. Una compilación correcta por sí sola no demuestra que el sistema esté publicado.

## Referencias

- [Dockerfiles y RAILWAY_DOCKERFILE_PATH](https://docs.railway.com/builds/dockerfiles)
- [Healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Políticas de reinicio](https://docs.railway.com/deployments/restart-policy)
- [Créditos de la prueba y del plan Free](https://docs.railway.com/pricing/free-trial)
