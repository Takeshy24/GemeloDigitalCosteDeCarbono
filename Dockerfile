# =============================================================================
# Dockerfile para CarbonTwin
# =============================================================================
# Imagen base: Python 3.10 (coincide con la versión usada en el artículo)
# =============================================================================

FROM python:3.10-slim

# Metadatos
LABEL maintainer="Christian Eduardo Verástegui Castillo <cverasteguic@unitru.edu.pe>"
LABEL description="CarbonTwin: Machine Learning for Carbon Footprint Estimation in Agricultural Digital Twins"
LABEL version="1.0.0"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt primero (para aprovechar el cache de Docker)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar el resto del proyecto
COPY . .

# Crear directorios de artefactos si no existen
RUN mkdir -p resultados_experimento/ml_artifacts/plots \
             resultados_experimento/figuras

# Comando por defecto: ejecutar el pipeline de entrenamiento
CMD ["python", "scripts/run_experiment_ml.py"]