import asyncio

import httpx

from backend.app.ai.langflow_client import (
    build_langflow_input,
    extract_langflow_text,
    run_langflow,
)


def test_langflow_input_uses_only_grounded_context():
    prompt = build_langflow_input(
        {"id": "p-1", "name": "Parcela", "secret": "no-enviar"},
        {"totalEmissionsKgCO2e": 42, "rawTelemetry": [1, 2, 3]},
        "¿Cuál es la huella?",
        [{"role": "assistant", "text": "Conversación previa"}],
    )

    assert '"totalEmissionsKgCO2e": 42' in prompt
    assert "Conversación previa" in prompt
    assert "¿Cuál es la huella?" in prompt
    assert "no-enviar" not in prompt
    assert "rawTelemetry" not in prompt


def test_extracts_official_nested_chat_output_shape():
    payload = {
        "outputs": [{
            "outputs": [{
                "results": {"message": {"data": {"text": "Respuesta de Langflow"}}}
            }]
        }]
    }

    assert extract_langflow_text(payload) == "Respuesta de Langflow"


def test_run_langflow_calls_v1_endpoint_with_api_key():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v1/run/carbon-flow"
        assert request.headers["x-api-key"] == "test-key"
        body = __import__("json").loads(request.content)
        assert body["input_type"] == "chat"
        assert "PREGUNTA ACTUAL" in body["input_value"]
        return httpx.Response(200, json={"outputs": [{"text": "OK desde flujo"}]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        result = asyncio.run(run_langflow(
            base_url="http://langflow:7860/",
            flow_id="carbon-flow",
            api_key="test-key",
            project={"name": "Parcela"},
            assessment={"totalEmissionsKgCO2e": 10},
            question="Analiza",
            client=client,
        ))
    finally:
        asyncio.run(client.aclose())

    assert result == "OK desde flujo"
