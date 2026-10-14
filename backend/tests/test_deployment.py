import os
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import BackgroundTasks, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from backend.app import main
from backend.app.artifacts import initialize_artifacts
from backend.app.database import normalize_database_url


@pytest.mark.parametrize("scheme", ["postgres", "postgresql", "postgresql+psycopg"])
def test_render_database_url_preserves_credentials_and_tls(scheme):
    url = normalize_database_url(f"{scheme}://user:p%40ss@host:5432/db?sslmode=require")
    assert url.drivername == "postgresql+psycopg"
    assert url.password == "p@ss"
    assert url.query["sslmode"] == "require"


def test_initialize_persistent_models_preserves_existing_training(tmp_path):
    source, destination = tmp_path / "seed", tmp_path / "disk"
    source.mkdir()
    destination.mkdir()
    (source / "model.pkl").write_bytes(b"seed")
    (source / "report.json").write_text("{}")
    (destination / "model.pkl").write_bytes(b"trained")
    initialize_artifacts(destination, source)
    assert (destination / "model.pkl").read_bytes() == b"trained"
    assert (destination / "report.json").read_text() == "{}"


def test_readiness_returns_503_when_database_is_unavailable(monkeypatch):
    def unavailable():
        raise RuntimeError("private connection information")
    monkeypatch.setattr(main, "engine", SimpleNamespace(connect=unavailable))
    with pytest.raises(HTTPException) as error:
        main.ready()
    assert error.value.status_code == 503
    assert "private" not in error.value.detail


def test_render_rejects_training_before_loading_heavy_dependencies(monkeypatch):
    import asyncio
    monkeypatch.setattr(main, "get_settings", lambda: SimpleNamespace(ml_training_enabled=False))
    with pytest.raises(HTTPException) as error:
        asyncio.run(main.ml_train(main.MLTrainRequest(), BackgroundTasks()))
    assert error.value.status_code == 403


def test_postgresql_api_and_bundled_inference(monkeypatch, tmp_path):
    """Usa un esquema efímero propio; nunca toca los recursos del usuario."""
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("Define TEST_DATABASE_URL para la prueba con PostgreSQL real")
    schema = "deployment_test_" + uuid4().hex
    admin = create_engine(normalize_database_url(database_url))
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(normalize_database_url(database_url), connect_args={"options": f"-csearch_path={schema}"})
    session = sessionmaker(bind=engine)

    def test_db():
        with session() as db:
            yield db

    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "initialize_artifacts", lambda: None)
    main.app.dependency_overrides[main.get_db] = test_db
    try:
        with TestClient(main.app) as client:
            assert client.get("/api/ready").status_code == 200
            assert client.get("/api/resources/projects").json() == []
            resource = {"id": "deployment-test", "data": {"id": "deployment-test", "name": "Prueba"}}
            assert client.put("/api/resources/projects/deployment-test", json=resource).status_code == 200
            assert client.get("/api/resources/projects").json()[0]["name"] == "Prueba"
            assert client.put("/api/resources/projects/wrong-id", json=resource).status_code == 400
            assert client.delete("/api/resources/projects/deployment-test").status_code == 204
            assert client.get("/api/resources/projects").json() == []
            prediction = client.post("/api/ml/predict", json={
                "sensor_count": 10, "edge_count": 2, "cloud_region_intensity": 0.3,
                "data_volume_gb_day": 5, "transmission_freq_hz": 0.1,
                "model_resolution": 0.5, "crop_type": "wheat", "operation_days": 180,
            })
            assert prediction.status_code == 200, prediction.text
            assert prediction.json()["total_co2e_kg"] > 0
    finally:
        main.app.dependency_overrides.pop(main.get_db, None)
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()
