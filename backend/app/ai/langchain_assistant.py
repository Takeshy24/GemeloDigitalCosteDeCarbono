"""Cadena conversacional LangChain para explicar resultados reales de AP-9.

El modelo no calcula emisiones ni consulta la base de datos directamente: recibe un
contexto acotado, producido por el motor de carbono de la aplicación. Esto evita que
una respuesta generativa sustituya los cálculos deterministas o invente métricas.
"""
from __future__ import annotations

import json
from typing import Any


SYSTEM_PROMPT = """Eres el Asistente IA del gemelo digital AP-9, especialista en análisis de ciclo de vida (ACV) de infraestructura agrícola IoT/Edge/Cloud. Responde siempre en español.

Usa exclusivamente el CONTEXTO VERIFICADO entregado por el motor. El historial sirve para comprender referencias conversacionales, pero no es una fuente de hechos. No inventes factores de emisión, porcentajes, fuentes, sensores ni resultados. Si el contexto no permite responder, indícalo y explica qué dato o simulación hace falta. Distingue claramente entre una recomendación y un resultado calculado. Mantén un tono técnico, breve y accionable; cuando sea pertinente, señala la capa afectada (sensores, comunicaciones, Edge o Cloud).

Para preguntas causales como «¿por qué emite más?», responde exactamente en este orden:
1. **Respuesta directa:** una o dos frases que expliquen el mecanismo técnico causal (por ejemplo, cómputo, ingesta, almacenamiento, transferencia y/o intensidad de la red), no solo que una capa tiene un porcentaje alto. Declara el mecanismo únicamente si el contexto lo respalda; de lo contrario, dilo como hipótesis a medir.
2. **Evidencia del gemelo:** máximo tres viñetas con métricas exactas del contexto y comparación con la capa o fase relevante.
3. **Acción prioritaria:** una recomendación concreta, separada explícitamente de los resultados calculados.
4. **Alcance:** una sola frase que aclare que se trata del escenario simulado y no de una medición física, si aplica.

No empieces con frases vagas como «basado en los datos». No repitas el nombre del proveedor Cloud ni de recursos concretos salvo que estén incluidos en el contexto. No presentes una recomendación como si fuese un resultado calculado.

CONTEXTO VERIFICADO DEL GEMELO:
{context}"""


def build_grounded_context(project: dict[str, Any], assessment: dict[str, Any]) -> str:
    """Convierte el estado del gemelo en un contexto compacto y auditable."""
    safe_project = {
        key: project.get(key)
        for key in ("id", "name", "cropType", "areaHectares", "status")
        if project.get(key) is not None
    }
    safe_assessment = {
        key: assessment.get(key)
        for key in (
            "totalEmissionsKgCO2e", "totalEmissionsPerHectare", "carbonIntensity",
            "lifecycleBreakdown", "layerBreakdown", "keyInsights", "recommendations",
        )
        if assessment.get(key) is not None
    }
    context = json.dumps(
        {"proyecto": safe_project, "evaluacion_calculada": safe_assessment},
        ensure_ascii=False,
        default=str,
    )
    # Límite defensivo: evita enviar objetos extensos de UI como historiales o gráficas.
    return context[:12000]


def _message_text(message: Any) -> str:
    """Normaliza respuestas de texto y respuestas por bloques de los chat models."""
    content = getattr(message, "content", message)
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, dict):
                parts.append(str(part.get("text", "")))
            else:
                parts.append(str(part))
        return "".join(parts).strip()
    return str(content).strip()


def _to_langchain_history(history: list[dict[str, str]] | None) -> list[Any]:
    """Convierte y limita el historial recibido; nunca se persiste en el servidor."""
    from langchain_core.messages import AIMessage, HumanMessage

    converted: list[Any] = []
    for item in (history or [])[-12:]:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        converted.append(HumanMessage(content=text) if item.get("role") == "user" else AIMessage(content=text))
    return converted


def create_digital_twin_chain(llm: Any) -> Any:
    """Construye la cadena LCEL, separada para poder probarla sin consumir una API."""
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_core.runnables import RunnableLambda

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history", optional=True),
        ("human", "{question}"),
    ])
    return prompt | llm | RunnableLambda(_message_text)


def ask_digital_twin(
    *,
    api_key: str,
    model: str,
    project: dict[str, Any],
    assessment: dict[str, Any],
    question: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Ejecuta una cadena LangChain con grounding del estado actual del gemelo."""
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise RuntimeError(
            "LangChain no está instalado. Ejecuta: pip install -r backend/requirements.txt"
        ) from exc

    context = build_grounded_context(project, assessment)
    llm = ChatGoogleGenerativeAI(
        model=model,
        api_key=api_key,
        max_output_tokens=700,
        max_retries=1,
    )
    chain = create_digital_twin_chain(llm)
    return chain.invoke({
        "context": context,
        "history": _to_langchain_history(history),
        "question": question.strip(),
    })
