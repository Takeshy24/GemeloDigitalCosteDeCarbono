from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from backend.app import main
from backend.app.database import create_database_engine


def test_sqlite_demo_crud_bootstrap_and_restart(monkeypatch, tmp_path):
    engine = create_database_engine(f"sqlite:///{tmp_path / 'demo.db'}")
    sessions = sessionmaker(bind=engine)

    def db_session():
        with sessions() as db:
            yield db

    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "initialize_artifacts", lambda: None)
    main.app.dependency_overrides[main.get_db] = db_session
    try:
        with TestClient(main.app) as client:
            assert client.get("/api/ready").status_code == 200
            seed = {"resources": {"projects": [{"id": "demo", "name": "Parcela", "nested": {"enabled": True}, "values": [1, 2]}]}}
            assert client.post("/api/bootstrap", json=seed).json() == {"created": 1}
            assert client.post("/api/bootstrap", json=seed).json() == {"created": 0}
            row = client.get("/api/resources/projects").json()[0]
            assert row["nested"] == {"enabled": True}
            assert row["values"] == [1, 2]
            row["name"] = "Editada"
            assert client.put("/api/resources/projects/demo", json={"id": "demo", "projectId": "p1", "data": row}).status_code == 200
            assert client.get("/api/resources/projects?project_id=otro").json() == []
        with TestClient(main.app) as client:
            assert client.get("/api/resources/projects?project_id=p1").json()[0]["name"] == "Editada"
            assert client.delete("/api/resources/projects/demo").status_code == 204
            assert client.get("/api/resources/projects").json() == []
    finally:
        main.app.dependency_overrides.pop(main.get_db, None)
        engine.dispose()
