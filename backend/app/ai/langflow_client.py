"""Cliente mínimo y seguro para ejecutar el flujo publicado de Langflow."""
from __future__ import annotations

import json
from typing import Any
from urllib.parse import quote

import httpx

from .langchain_assistant import SYSTEM_PROMPT, build_grounded_context


def build_langflow_input(
    project: dict[str, Any],
    assessment: dict[str, Any],
    question: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Prepara una entrada autosuficiente para un flujo Chat Input → LLM → Chat Output."""
    context = build_grounded_context(project, assessment)
    recent_history = [
        {"role": item.get("role"), "text": str(item.get("text", ""))[:4000]}
        for item in (history or [])[-12:]
        if item.get("role") in {"user", "assistant"} and str(item.get("text", "")).strip()
    ]
    instructions = SYSTEM_PROMPT.replace("{context}", context)
    return (
        f"{instructions}\n\n"
        f"HISTORIAL RECIENTE (solo referencia conversacional):\n"
        f"{json.dumps(recent_history, ensure_ascii=False)}\n\n"
        f"PREGUNTA ACTUAL:\n{question.strip()}"
    )


def extract_langflow_text(payload: Any) -> str:
    """Extrae el mensaje de las variantes conocidas de respuesta de Langflow v1."""
    def find_text(node: Any) -> str | None:
        if isinstance(node, str):
            return node.strip() or None
        if isinstance(node, list):
            for item in node:
                result = find_text(item)
                if result:
                    return result
            return None
        if not isinstance(node, dict):
            return None

        direct_text = node.get("text")
        if isinstance(direct_text, str) and direct_text.strip():
            return direct_text.strip()
        direct_message = node.get("message")
        if isinstance(direct_message, str) and direct_message.strip():
            return direct_message.strip()

        for key in ("results", "message", "data", "outputs", "output", "content"):
            if key in node:
                result = find_text(node[key])
                if result:
                    return result
        return None

    result = find_text(payload)
    if not result:
        raise RuntimeError("Langflow respondió sin un mensaje de texto reconocible")
    return result


async def run_langflow(
    *,
    base_url: str,
    flow_id: str,
    api_key: str,
    project: dict[str, Any],
    assessment: dict[str, Any],
    question: str,
    history: list[dict[str, str]] | None = None,
    timeout_seconds: float = 60.0,
    client: httpx.AsyncClient | None = None,
) -> str:
    """Ejecuta un flujo publicado mediante la API v1 oficial de Langflow."""
    url = f"{base_url.rstrip('/')}/api/v1/run/{quote(flow_id, safe='-_')}"
    payload = {
        "input_value": build_langflow_input(project, assessment, question, history),
        "input_type": "chat",
        "output_type": "chat",
    }
    headers = {"accept": "application/json", "x-api-key": api_key}

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=timeout_seconds)
    try:
        response = await http_client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return extract_langflow_text(response.json())
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Langflow devolvió HTTP {exc.response.status_code}") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError("No se pudo obtener una respuesta válida de Langflow") from exc
    finally:
        if owns_client:
            await http_client.aclose()
