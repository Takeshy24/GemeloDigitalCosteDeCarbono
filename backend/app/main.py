from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any
import asyncio
import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import get_settings
from .database import Base, engine, get_db
from .models import Resource

RESOURCE_KINDS = {"projects", "sensors", "edge", "cloud", "twins", "emission-factors", "scenarios", "users", "audit-logs"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Carbon Twin API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class ResourceInput(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    projectId: str | None = None
    data: dict[str, Any]


class BootstrapInput(BaseModel):
    resources: dict[str, list[dict[str, Any]]]


class AIRequest(BaseModel):
    project: dict[str, Any] = {}
    assessment: dict[str, Any] = {}
    userPrompt: str = Field(min_length=1, max_length=4000)


class MLTrainRequest(BaseModel):
    csv_path: str | None = None  # si None → datos sintéticos


class PredictRequest(BaseModel):
    sensor_count: int = Field(ge=1, le=200)
    edge_count: int = Field(ge=1, le=50)
    cloud_region_intensity: float = Field(ge=0.01, le=1.0)
    data_volume_gb_day: float = Field(ge=0.01, le=500.0)
    transmission_freq_hz: float = Field(ge=0.0001, le=20.0)
    model_resolution: float = Field(ge=0.05, le=1.0)
    crop_type: str = Field(default="wheat")
    operation_days: int = Field(ge=1, le=365)
    solar_powered: bool = False


def valid_kind(kind: str):
    if kind not in RESOURCE_KINDS:
        raise HTTPException(status_code=404, detail="Tipo de recurso no soportado")


# ────────────────────────────────────────────────────────────────────────────
# Endpoints existentes
# ────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "carbon-twin-api", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/resources/{kind}")
def list_resources(kind: str, project_id: str | None = None, db: Session = Depends(get_db)):
    valid_kind(kind)
    query = select(Resource).where(Resource.kind == kind)
    if project_id:
        query = query.where(Resource.project_id == project_id)
    rows = db.scalars(query.order_by(Resource.updated_at.desc())).all()
    return [row.payload for row in rows]


@app.put("/api/resources/{kind}/{external_id}")
def upsert_resource(kind: str, external_id: str, item: ResourceInput, db: Session = Depends(get_db)):
    valid_kind(kind)
    if external_id != item.id:
        raise HTTPException(status_code=400, detail="El id de ruta no coincide con el cuerpo")
    project_id = item.projectId or item.data.get("projectId")
    row = db.scalar(select(Resource).where(Resource.kind == kind, Resource.external_id == external_id))
    if row:
        row.project_id, row.payload = project_id, item.data
    else:
        row = Resource(kind=kind, external_id=external_id, project_id=project_id, payload=item.data)
        db.add(row)
    db.commit()
    return row.payload


@app.delete("/api/resources/{kind}/{external_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(kind: str, external_id: str, db: Session = Depends(get_db)):
    valid_kind(kind)
    row = db.scalar(select(Resource).where(Resource.kind == kind, Resource.external_id == external_id))
    if not row:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/bootstrap")
def bootstrap(input: BootstrapInput, db: Session = Depends(get_db)):
    created = 0
    for kind, items in input.resources.items():
        valid_kind(kind)
        for data in items:
            external_id = str(data.get("id", ""))
            if not external_id or db.scalar(select(Resource.id).where(Resource.kind == kind, Resource.external_id == external_id)):
                continue
            db.add(Resource(kind=kind, external_id=external_id, project_id=data.get("projectId"), payload=data))
            created += 1
    db.commit()
    return {"created": created}


def local_advice(project: dict[str, Any], assessment: dict[str, Any], prompt: str) -> str:
    total = float(assessment.get("totalEmissionsKgCO2e", 0))
    operation_share = assessment.get("keyInsights", {}).get("operationSharePercent", 0)
    return (f"Diagnóstico para **{project.get('name', 'el proyecto')}**: la huella estimada es de "
            f"**{total:.1f} kg CO₂e** y la operación representa {operation_share}% del ciclo de vida.\n\n"
            f"En respuesta a «{prompt}», prioriza: (1) filtrado por eventos en Edge y envío por lotes, "
            "(2) región cloud con menor intensidad de carbono y autoescalado, y (3) alimentación solar de gateways. "
            "Mide una línea base semanal antes de aplicar cambios para validar el ahorro real.")


@app.post("/api/ai/analyze")
async def analyze_ai(request: AIRequest):
    settings = get_settings()
    if not settings.openai_api_key:
        return {"success": True, "source": "local-carbon-advisor", "analysis": local_advice(request.project, request.assessment, request.userPrompt)}
    system = "Eres un especialista ISO 14040/44 en ACV de gemelos digitales agrícolas. Responde en español, con recomendaciones concretas, trazables y prudentes."
    payload = {"model": settings.openai_model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": f"Proyecto: {request.project}. Evaluación: {request.assessment}. Consulta: {request.userPrompt}"}], "temperature": 0.3}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://api.openai.com/v1/chat/completions", headers={"Authorization": f"Bearer {settings.openai_api_key}"}, json=payload)
            response.raise_for_status()
        return {"success": True, "source": settings.openai_model, "analysis": response.json()["choices"][0]["message"]["content"]}
    except Exception:
        return {"success": True, "source": "local-carbon-advisor", "analysis": local_advice(request.project, request.assessment, request.userPrompt)}


# ────────────────────────────────────────────────────────────────────────────
# Endpoints de ML
# ────────────────────────────────────────────────────────────────────────────

def _run_pipeline_sync(csv_path: str | None) -> None:
    """Ejecuta el pipeline en el hilo de background (no async)."""
    from .ml.pipeline import run_pipeline
    run_pipeline(csv_path=csv_path)


@app.post("/api/ml/train", status_code=status.HTTP_202_ACCEPTED)
async def ml_train(request: MLTrainRequest, background_tasks: BackgroundTasks):
    """
    Lanza el pipeline completo de ML en background.
    Devuelve 202 Accepted inmediatamente.
    Consulta el estado con GET /api/ml/status.
    """
    from .ml.pipeline import PIPELINE_STATUS
    if PIPELINE_STATUS.get("status") == "running":
        raise HTTPException(status_code=409, detail="El pipeline ya está en ejecución.")

    background_tasks.add_task(_run_pipeline_sync, request.csv_path)
    return {
        "message": "Pipeline de ML iniciado en background.",
        "poll_url": "/api/ml/status",
    }


@app.get("/api/ml/status")
def ml_status():
    """Estado del pipeline de ML (idle | running | done | error)."""
    from .ml.pipeline import PIPELINE_STATUS
    # Devuelve una copia sin el reporte completo (puede ser grande)
    safe = {k: v for k, v in PIPELINE_STATUS.items() if k != "report"}
    return safe


@app.get("/api/ml/report")
def ml_report():
    """Devuelve el reporte JSON completo del último entrenamiento."""
    import json
    from pathlib import Path
    report_path = Path("backend/ml_artifacts/ml_report.json")
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="No hay reporte disponible. Ejecuta primero /api/ml/train.")
    with open(report_path, encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/ml/predict")
def ml_predict(request: PredictRequest):
    """
    Predicción en tiempo real usando el mejor modelo entrenado.
    Requiere que el pipeline haya completado (best_model_sklearn.pkl + preprocessor.pkl).
    """
    import pandas as pd
    import numpy as np
    import joblib
    from pathlib import Path

    preprocessor_path = Path("backend/ml_artifacts/preprocessor.pkl")
    model_path = Path("backend/ml_artifacts/best_model_sklearn.pkl")

    if not preprocessor_path.exists() or not model_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Modelos no disponibles. Ejecuta primero POST /api/ml/train y espera a que finalice."
        )

    preprocessor = joblib.load(preprocessor_path)
    model = joblib.load(model_path)

    # Construir DataFrame con el mismo esquema que el training
    input_df = pd.DataFrame([{
        "sensor_count": request.sensor_count,
        "edge_count": request.edge_count,
        "cloud_region_intensity": request.cloud_region_intensity,
        "data_volume_gb_day": request.data_volume_gb_day,
        "transmission_freq_hz": request.transmission_freq_hz,
        "model_resolution": request.model_resolution,
        "crop_type": request.crop_type,
        "operation_days": request.operation_days,
        "solar_powered": int(request.solar_powered),
    }])

    X = preprocessor.transform(input_df)
    prediction = float(model.predict(X)[0])

    return {
        "total_co2e_kg": round(prediction, 4),
        "unit": "kg CO₂e",
        "model_used": "best_model_sklearn.pkl",
        "inputs": request.model_dump(),
    }
