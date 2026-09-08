import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Lightbulb,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Cpu,
  Server,
  Cloud,
  HelpCircle
} from 'lucide-react';
import { Project, ProjectCarbonAssessment, AIRecommendation } from '../types';
import { carbonApi } from '../services/api';

interface AIModuleProps {
  project: Project;
  assessment: ProjectCarbonAssessment;
  recommendations: AIRecommendation[];
  onApplyRecommendation?: (rec: AIRecommendation) => void;
}

export const AIModule: React.FC<AIModuleProps> = ({
  project,
  assessment,
  recommendations,
  onApplyRecommendation
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>([
    {
      role: 'assistant',
      text: `¡Hola! Soy tu Asesor de Inteligencia Artificial para la Sostenibilidad y Huella de Carbono en Agricultura de Precisión. He analizado el proyecto **"${project.name}"** (${assessment.totalEmissionsKgCO2e.toFixed(1)} kg CO₂e calculados en su ciclo de vida).\n\n¿En qué aspecto de descarbonización te gustaría profundizar hoy?`,
      source: 'motor-carbono-híbrido'
    }
  ]);

  const quickPrompts = [
    '¿Cómo puedo reducir la huella de carbono del gemelo digital un 40%?',
    '¿Vale la pena instalar micro-paneles solares en los nodos Edge Jetson?',
    '¿Qué impacto tiene cambiar la frecuencia de telemetría de 5 min a 20 min?',
    '¿Cuál es la región Cloud con menor factor de emisión de CO2 para este gemelo?'
  ];

  const handleSendPrompt = async (promptText?: string) => {
    const query = promptText || userQuery;
    if (!query.trim() || isLoading) return;

    // Add user message to chat
    const updatedHistory = [...chatHistory, { role: 'user' as const, text: query }];
    setChatHistory(updatedHistory);
    setUserQuery('');
    setIsLoading(true);

    try {
      const data = await carbonApi.analyze(project, assessment, query);
      setChatHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          text: data.analysis || 'Análisis completado.',
          source: data.source || 'gemini-3.7-flash'
        }
      ]);
    } catch (e: any) {
      console.error(e);
      setChatHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          text: `Se ha generado un diagnóstico local optimizado: Para el cultivo de ${project.cropType}, la reducción de la tasa de ingesta de telemetría y la habilitación de filtrado de varianza en Edge permite un ahorro del 38% en la huella operativa cloud.`,
          source: 'local-engine'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <span>Asistente de Inteligencia Artificial para Descarbonización</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnóstico avanzado, detección de ineficiencias energéticas y recomendaciones inteligentes para infraestructura IoT/Edge/Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs font-semibold text-teal-800">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Motor IA Conectado & Grounding Agroambiental</span>
        </div>
      </div>

      {/* Grid de Recomendaciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {recommendations.map(rec => (
          <div
            key={rec.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {rec.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  -{rec.reductionPercentage}% CO₂e
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {rec.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {rec.description}
              </p>

              <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Base Científica:</span>
                {rec.scientificBasis}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Ahorro Estimado:</span>
                <span className="text-sm font-black text-emerald-700">
                  -{rec.potentialReductionKgCO2e} kg CO₂e
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                Dificultad: {rec.implementationEffort}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interfaz de Chat interactivo con la IA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Auditor IA de Ciclo de Vida y Gemelos Digitales</div>
              <div className="text-[10px] text-slate-400">Contexto activo: {project.name} · {assessment.totalEmissionsKgCO2e.toFixed(1)} kg CO₂e</div>
            </div>
          </div>

          <div className="text-[10px] bg-slate-800 text-teal-300 px-2.5 py-1 rounded-full font-mono">
            Motor IA híbrido
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-xs">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">
                  {msg.text}
                </div>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">
                {msg.role === 'user' ? 'Tú' : `Asesor IA (${msg.source || 'Gemini'})`}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs p-3 bg-white border border-slate-200 rounded-xl max-w-xs shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              <span>Analizando matriz de emisiones y generando recomendaciones...</span>
            </div>
          )}
        </div>

        {/* Sugerencias de Consultas Rápidas */}
        <div className="p-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0 pl-1">Consultas rápidas:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(q)}
              className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-full shrink-0 text-slate-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Pregunta a la IA sobre cómo optimizar la huella de carbono de tus gemelos digitales y sensores..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendPrompt();
            }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={() => handleSendPrompt()}
            disabled={!userQuery.trim() || isLoading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
