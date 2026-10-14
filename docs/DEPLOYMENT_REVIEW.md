# Revisión de preparación para Render

Fecha: 14 de octubre de 2026.

## Arquitectura verificada

La aplicación activa utiliza React 19 y Next.js 15; `package.json` compila y arranca Next.js. Vite y Express permanecen como código anterior y no son los procesos de despliegue. FastAPI persiste recursos JSONB en PostgreSQL. El motor de ACV corre en el frontend; la API proporciona CRUD, bootstrap, asesor IA, reportes y predicción ML. Streamlit es un laboratorio opcional separado.

## GitHub

Se verificó el repositorio remoto `Takeshy24/GemeloDigitalCosteDeCarbono` y se leyó `package.json` mediante la integración GitHub. Al iniciar, `main` remoto estaba en `3d1bb61` y la copia local en `6705d19`; además existían modificaciones locales de Langflow y del asistente. Se conservaron en un commit de la rama `codex/render-deployment` y se integraron los cambios del remoto sin conflictos. El usuario autorizó integrar el [PR #1](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/pull/1) en `main`; el merge se confirmó con el commit `173a34942129b2b5b8e1a353a67452eb730463c0`.

## Problemas corregidos

| Hallazgo | Corrección |
| --- | --- |
| No había un Blueprint para la aplicación web | `render.yaml` define frontend, API y PostgreSQL, puertos, dependencias y salud |
| Render entrega URLs `postgresql://`, pero se instala psycopg 3 | Normalización del driver preservando credenciales escapadas y parámetros TLS |
| API y enlaces ML dependían de localhost | Proxy Next.js por red privada, URL de API común y enlace de laboratorio opcional |
| Rutas ML dependían del directorio de ejecución | Ruta absoluta configurable compartida entre API, pipeline y laboratorio |
| Modelos generados se perderían al reconstruir | Disco persistente e inicialización que preserva artefactos existentes |
| El entrenamiento completo exige librerías y recursos de laboratorio | Perfil de inferencia separado y entrenamiento deshabilitado en la configuración pequeña |
| Health check no detectaba la pérdida de PostgreSQL | `/api/ready` devuelve 503 si no puede consultar la base de datos |
| Se versionaban bytecode Python y caché TypeScript | Eliminación del índice Git; archivos locales y reglas de exclusión conservados |
| README mezclaba Docker experimental con la aplicación | Bloque Markdown cerrado y guía diferenciada de despliegue |

## Evidencia de validación

- Compilación inicial Next.js y verificación de tipos: correctas.
- 17 pruebas backend correctas, incluyendo CRUD con PostgreSQL real en esquema aislado, predicción con los artefactos incluidos, inicialización de disco y comportamiento con entrenamiento deshabilitado.
- `render.yaml` válido contra el esquema oficial de Render.
- `npm ci` comprobado mediante resolución del lockfile.
- Compilación final y arranque de Next.js en modo producción correctos; proxy hacia FastAPI probado con salud, disponibilidad de PostgreSQL, estado y reporte ML (HTTP 200) y rechazo de entrenamiento (HTTP 403 esperado).
- Disponibilidad de paquetes Python para Linux/Python 3.11 comprobada mediante resolución de wheels. Instalación, compilación y pruebas en Linux/PostgreSQL 16 aprobadas en [GitHub Actions](https://github.com/Takeshy24/GemeloDigitalCosteDeCarbono/actions/runs/38619279347), sobre el último commit del PR antes del merge.

Las pruebas no ejecutan un entrenamiento completo, no invocan proveedores de IA ni crean servicios en Render. La prueba local usa PostgreSQL 18; CI usa PostgreSQL 16, coincidiendo con el Blueprint.

## Limitaciones pendientes

Los endpoints de recursos no tienen autenticación ni autorización; los roles son controles de interfaz. La configuración es apta para una demo con datos no privados. El entrenamiento utiliza estado en memoria y no debe distribuirse entre múltiples workers. No hay migraciones versionadas de base de datos. El frontend inicial pesa aproximadamente 1 MB de JavaScript; la carga puede mejorarse con división de módulos.

## Documentación en Jira

La documentación se publicó en la descripción de [KAN-4: Carbon twin](https://takeshydiaz05.atlassian.net/browse/KAN-4), en el sitio proporcionado por el usuario. Incluye propósito y módulos, arquitectura y API, motor de carbono, ML e IA, instalación y Render, pruebas y trabajo pendiente. Se verificó su persistencia recargando Jira y comprobando las seis secciones y referencias.

La documentación se redactó a partir del código, sin trasladar afirmaciones antiguas sobre JWT, aislamiento multitenant o un ganador ML distinto al artefacto actual. Incluye enlaces a `main`, al PR integrado y a las guías del repositorio. La versión Markdown está en [JIRA_DOCUMENTATION.md](JIRA_DOCUMENTATION.md). Este informe y `RENDER_DEPLOYMENT.md` conservan el historial de preparación; los documentos de exposición anteriores son material histórico y pueden contener afirmaciones que requieren revisión.
