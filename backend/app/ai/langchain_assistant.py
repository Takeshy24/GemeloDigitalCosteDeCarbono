"""Cadena LangChain para explicar resultados reales de AP-9.

El modelo no calcula emisiones ni consulta la base de datos directamente: recibe un
contexto acotado, producido por el motor de carbono de la aplicación. Esto evita que
una respuesta generativa sustituya los cálculos deterministas o invente métricas.
"""
from __future__ import annotations

import json
from typing import Any


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


def ask_digital_twin(
    *, api_key: str, model: str, project: dict[str, Any], assessment: dict[str, Any], question: str
) -> str:
    """Ejecuta una cadena LangChain con grounding del estado actual del gemelo."""
    try:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise RuntimeError(
            "LangChain no está instalado. Ejecuta: pip install -r backend/requirements.txt"
        ) from exc

    context = build_grounded_context(project, assessment)
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """Eres el Asistente IA del gemelo digital AP-9, especialista en análisis de ciclo de vida (ACV) de infraestructura agrícola IoT/Edge/Cloud. Responde siempre en español.

Usa exclusivamente el CONTEXTO VERIFICADO entregado por el motor. No inventes factores de emisión, porcentajes, fuentes, sensores ni resultados. Si el contexto no permite responder, indícalo y explica qué dato o simulación hace falta. Distingue claramente entre una recomendación y un resultado calculado. Mantén un tono técnico, breve y accionable; cuando sea pertinente, señala la capa afectada (sensores, comunicaciones, Edge o Cloud).

Para preguntas causales como «¿por qué emite más?», responde exactamente en este orden:
1. **Respuesta directa:** una o dos frases que expliquen el mecanismo técnico causal (por ejemplo, cómputo, ingesta, almacenamiento, transferencia y/o intensidad de la red), no solo que una capa tiene un porcentaje alto. Declara el mecanismo únicamente si el contexto lo respalda; de lo contrario, dilo como hipótesis a medir.
2. **Evidencia del gemelo:** máximo tres viñetas con métricas exactas del contexto y comparación con la capa o fase relevante.
3. **Acción prioritaria:** una recomendación concreta, separada explícitamente de los resultados calculados.
4. **Alcance:** una sola frase que aclare que se trata del escenario simulado y no de una medición física, si aplica.

No empieces con frases vagas como «basado en los datos». No repitas el nombre del proveedor Cloud ni de recursos concretos salvo que estén incluidos en el contexto. No presentes una recomendación como si fuese un resultado calculado.

CONTEXTO VERIFICADO DEL GEMELO:
{context}""",
        ),
        ("human", "{question}"),
    ])
    llm = ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=0.2,
        max_output_tokens=700,
        max_retries=1,
    )
    response = (prompt | llm).invoke({"context": context, "question": question})
    content = response.content
    if isinstance(content, list):
        return "".join(str(part.get("text", part)) if isinstance(part, dict) else str(part) for part in content)
    return str(content).strip()
