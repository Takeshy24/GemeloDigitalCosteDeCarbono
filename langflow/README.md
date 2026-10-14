# Langflow para Carbon Twin AP-9

Esta configuración ejecuta Langflow 1.12 en `http://localhost:7860`, con datos
persistentes y acceso limitado a la máquina local. FastAPI usa Langflow como
orquestador principal y conserva LangChain y el asesor local como respaldos.

## Configuración

1. En `backend/.env`, define una clave propia para `LANGFLOW_API_KEY` y conserva
   `GEMINI_API_KEY`. Para generar una clave local:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. Inicia Langflow:

   ```powershell
   docker compose -f langflow/docker-compose.yml up -d
   ```

3. Abre `http://localhost:7860`, crea el flujo **Basic Prompting** y conecta:

   ```text
   Chat Input → Google Generative AI → Chat Output
   ```

   En el componente de Google, selecciona `GEMINI_API_KEY` como variable global y
   usa el modelo configurado para el proyecto. La entrada enviada por FastAPI ya
   incluye las instrucciones, el contexto verificado, el historial y la pregunta.

4. En **Share → API access**, asigna un Endpoint Name, por ejemplo
   `carbon-twin-advisor`. Guarda ese nombre en `backend/.env`:

   ```dotenv
   LANGFLOW_URL=http://localhost:7860
   LANGFLOW_FLOW_ID=carbon-twin-advisor
   LANGFLOW_API_KEY=la-misma-clave-del-paso-1
   ```

5. Reinicia FastAPI y comprueba `GET http://localhost:8000/api/health`. El valor
   `ai.primary` será `langflow` y `ai.langflow.configured` será `true`.

`LANGFLOW_AUTO_LOGIN=true` es adecuado únicamente para desarrollo local. Antes de
publicar el servicio, habilita autenticación, cambia la clave y colócalo detrás de
un proxy TLS. El puerto del Compose está enlazado a `127.0.0.1` para no exponerlo
directamente en la red.
