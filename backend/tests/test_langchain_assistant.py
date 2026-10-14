import json

from langchain_core.language_models.fake_chat_models import FakeListChatModel

from backend.app.ai.langchain_assistant import (
    _message_text,
    _to_langchain_history,
    build_grounded_context,
    create_digital_twin_chain,
)


def test_grounded_context_only_includes_audited_fields():
    context = json.loads(build_grounded_context(
        {"id": "p-1", "name": "Parcela", "secret": "no-enviar"},
        {"totalEmissionsKgCO2e": 125.4, "rawTelemetry": [1, 2, 3]},
    ))

    assert context == {
        "proyecto": {"id": "p-1", "name": "Parcela"},
        "evaluacion_calculada": {"totalEmissionsKgCO2e": 125.4},
    }


def test_history_is_bounded_and_converted_to_langchain_messages():
    history = [{"role": "user", "text": f"mensaje {index}"} for index in range(15)]

    converted = _to_langchain_history(history)

    assert len(converted) == 12
    assert converted[0].content == "mensaje 3"
    assert converted[-1].content == "mensaje 14"


def test_lcel_chain_returns_model_text_without_external_api():
    chain = create_digital_twin_chain(FakeListChatModel(responses=["Respuesta verificada"]))

    result = chain.invoke({
        "context": '{"proyecto":{"name":"Parcela"}}',
        "history": [],
        "question": "¿Cuál es la huella?",
    })

    assert result == "Respuesta verificada"


def test_message_text_supports_block_content():
    class BlockMessage:
        content = [{"type": "text", "text": "Primera"}, {"type": "text", "text": " parte"}]

    assert _message_text(BlockMessage()) == "Primera parte"
