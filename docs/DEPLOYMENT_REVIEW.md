# Revisión de preparación para Render

Fecha: 14 de octubre de 2026.

## Arquitectura verificada

La aplicación activa utiliza React 19 y Next.js 15; `package.json` compila y arranca Next.js. Vite y Express permanecen como código anterior y no son los procesos de despliegue. FastAPI persiste recursos JSONB en PostgreSQL. El motor de ACV corre en el frontend; la API proporciona CRUD, bootstrap, asesor IA, reportes y predicción ML. Streamlit es un laboratorio opcional separado.

## GitHub

Se verificó el repositorio remoto `Takeshy24/GemeloDigitalCosteDeCarbono` y se leyó `package.json` mediante la integración GitHub. Al iniciar, `main` remoto estaba en `3d1bb61` y la copia local en `6705d19`; además existían modificaciones locales de Langflow y del asistente. Se conservaron en un commit de la rama `codex/render-deployment` y se integraron los cambios del remoto sin conflictos. La preparación se publica como propuesta revisable en esa rama.

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
- Disponibilidad de paquetes Python para Linux/Python 3.11 comprobada mediante resolución de wheels. La instalación y ejecución Linux se verifican adicionalmente con GitHub Actions.

Las pruebas no ejecutan un entrenamiento completo, no invocan proveedores de IA ni crean servicios en Render. La prueba local usa PostgreSQL 18; CI usa PostgreSQL 16, coincidiendo con el Blueprint.

## Limitaciones pendientes

Los endpoints de recursos no tienen autenticación ni autorización; los roles son controles de interfaz. La configuración es apta para una demo con datos no privados. El entrenamiento utiliza estado en memoria y no debe distribuirse entre múltiples workers. No hay migraciones versionadas de base de datos. El frontend inicial pesa aproximadamente 1 MB de JavaScript; la carga puede mejorarse con división de módulos.

## Documentación en Jira

La verificación requiere el sitio/proyecto de Jira y una conexión Atlassian autenticada. Mientras eso no esté confirmado, este informe y la guía están preparados en GitHub como respaldo y **no acreditan que la documentación ya exista en Jira**. Los documentos funcionales y del laboratorio existentes son `docs/DOCUMENTO_1_SISTEMA_Y_MODULOS_EXPOSICION.md` y `docs/DOCUMENTO_2_MACHINE_LEARNING_ESTADISTICA_LABORATORIO.md`. Al obtener acceso se debe verificar su correspondencia con los tickets y añadir el enlace del PR y la guía de despliegue al registro correcto.
