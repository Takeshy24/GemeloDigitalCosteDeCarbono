import asyncio
from types import SimpleNamespace

from backend.app import main
from backend.app.ai import langflow_client


def settings(**overrides):
    values = {
        "gemini_api_key": None,
        "gemini_model": "test-model",
        "langflow_configured": False,
        "langflow_url": None,
        "langflow_flow_id": None,
        "langflow_api_key": None,
        "langflow_timeout_seconds": 60,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_ai_endpoint_uses_local_fallback_without_api_key(monkeypatch):
    monkeypatch.setattr(
        main,
        "get_settings",
        lambda: settings(),
    )
    request = main.AIRequest(
        project={"name": "Parcela Norte"},
        assessment={"totalEmissionsKgCO2e": 25, "keyInsights": {"operationSharePercent": 60}},
        userPrompt="¿Cómo reduzco las emisiones?",
    )

    response = asyncio.run(main.analyze_ai(request))

    assert response["success"] is True
    assert response["source"] == "local-carbon-advisor"
    assert "25.0 kg CO₂e" in response["analysis"]


def test_health_reports_ai_orchestrators_without_exposing_credentials(monkeypatch):
    monkeypatch.setattr(
        main,
        "get_settings",
        lambda: settings(gemini_api_key="secret"),
    )

    response = main.health()

    assert response["ai"] == {
        "primary": "langchain",
        "langflow": {"configured": False},
        "langchain": {
            "configured": True,
            "provider": "google-gemini",
            "model": "test-model",
        },
    }
    assert "secret" not in str(response)


def test_ai_endpoint_prefers_langflow_when_configured(monkeypatch):
    monkeypatch.setattr(
        main,
        "get_settings",
        lambda: settings(
            gemini_api_key="gemini-secret",
            langflow_configured=True,
            langflow_url="http://langflow:7860",
            langflow_flow_id="carbon-flow",
            langflow_api_key="langflow-secret",
        ),
    )

    async def fake_run_langflow(**kwargs):
        assert kwargs["flow_id"] == "carbon-flow"
        assert kwargs["history"] == [{"role": "user", "text": "mensaje anterior"}]
        return "Respuesta orquestada"

    monkeypatch.setattr(langflow_client, "run_langflow", fake_run_langflow)
    request = main.AIRequest(
        project={"name": "Parcela Norte"},
        assessment={"totalEmissionsKgCO2e": 25},
        userPrompt="¿Cómo reduzco las emisiones?",
        history=[{"role": "user", "text": "mensaje anterior"}],
    )

    response = asyncio.run(main.analyze_ai(request))

    assert response == {
        "success": True,
        "source": "langflow",
        "analysis": "Respuesta orquestada",
    }
