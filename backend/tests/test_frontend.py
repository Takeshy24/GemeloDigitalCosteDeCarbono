from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from backend.app.frontend import mount_frontend


def test_static_frontend_preserves_api_and_assets(tmp_path):
    (tmp_path / "index.html").write_text("<html>Carbon Twin</html>")
    (tmp_path / "_next").mkdir()
    (tmp_path / "_next" / "app.js").write_text("console.log('frontend')")
    app = FastAPI()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    mount_frontend(app, tmp_path)
    with TestClient(app) as client:
        assert "Carbon Twin" in client.get("/").text
        assert client.get("/_next/app.js").status_code == 200
        assert client.get("/api/health").json() == {"status": "ok"}
        assert client.get("/docs").status_code == 200
        assert client.get("/api/missing").status_code == 404
        assert client.get("/../config.py").status_code == 404


def test_missing_export_fails_before_startup(tmp_path):
    with pytest.raises(RuntimeError, match="exportación estática"):
        mount_frontend(FastAPI(), tmp_path)
