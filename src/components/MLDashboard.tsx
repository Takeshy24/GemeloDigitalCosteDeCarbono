import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  Play,
  RefreshCw,
  Trophy,
  TrendingDown,
  BarChart3,
  FlaskConical,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Target,
  Sigma,
  ExternalLink,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface ModelMetrics {
  RMSE: number;
  MAE: number;
  R2: number;
  MAPE: number;
}

interface ModelResult {
  cv_rmse_mean: number;
  cv_rmse_std: number;
  cv_rmse_scores: number[];
  test_metrics: ModelMetrics;
  best_params: Record<string, unknown>;
}

interface StatTest {
  test: string;
  statistic?: number;
  lm_statistic?: number;
  t_statistic?: number;
  p_value?: number;
  significant?: boolean;
  significance?: string;
  interpretation: string;
  point_rmse?: number;
  ci_lower?: number;
  ci_upper?: number;
  confidence_level?: string;
  n_bootstrap?: number;
  comparison?: string;
}

interface PipelineReport {
  pipeline_version: string;
  generated_at: string;
  elapsed_seconds: number;
  dataset: { n_samples: number; n_features: number; source: string };
  models: Record<string, ModelResult>;
  best_model: { name: string; metrics: ModelMetrics; cv_rmse_mean: number };
  statistical_tests: {
    friedman?: StatTest;
    bootstrap_ci?: StatTest;
    shapiro_wilk?: StatTest;
    breusch_pagan?: StatTest;
    wilcoxon?: StatTest[];
    nadeau_bengio?: StatTest & { comparison?: string };
  };
}

interface PipelineStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  step: string;
  progress: number;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────
const Badge: React.FC<{ label: string; color?: string }> = ({ label, color = 'emerald' }) => {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    violet: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    amber: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    red: 'bg-red-900/50 text-red-300 border-red-700/50',
    cyan: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${map[color] || map.emerald}`}>
      {label}
    </span>
  );
};

const SigBadge: React.FC<{ sig?: string }> = ({ sig }) => {
  if (!sig) return null;
  if (sig === 'ns') return <Badge label="ns" color="amber" />;
  if (sig === '*') return <Badge label="*" color="emerald" />;
  if (sig === '**') return <Badge label="**" color="cyan" />;
  if (sig === '***') return <Badge label="***" color="violet" />;
  return <Badge label={sig} />;
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, sub, icon, color = 'emerald' }) => {
  const border: Record<string, string> = {
    emerald: 'border-emerald-700/40 bg-emerald-950/30',
    violet: 'border-violet-700/40 bg-violet-950/30',
    cyan: 'border-cyan-700/40 bg-cyan-950/30',
    amber: 'border-amber-700/40 bg-amber-950/30',
  };
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${border[color] || border.emerald}`}>
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
};

const MODEL_COLORS: Record<string, { bar: string; ring: string }> = {
  RandomForest: { bar: 'bg-emerald-500', ring: 'ring-emerald-400' },
  XGBoost: { bar: 'bg-violet-500', ring: 'ring-violet-400' },
  SVR: { bar: 'bg-cyan-500', ring: 'ring-cyan-400' },
  Stacking: { bar: 'bg-amber-500', ring: 'ring-amber-400' },
  Blending: { bar: 'bg-pink-500', ring: 'ring-pink-400' },
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export const MLDashboard: React.FC = () => {
  const [status, setStatus] = useState<PipelineStatus>({
    status: 'idle', step: '', progress: 0, started_at: null, finished_at: null, error: null,
  });
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch status ──────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ml/status`);
      const data: PipelineStatus = await res.json();
      setStatus(data);
      if (data.status === 'done' && !report) fetchReport();
      if (data.status !== 'running') stopPolling();
    } catch { /* ignore */ }
  }, [report]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchStatus, 2500);
  }, [fetchStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ── Fetch report ─────────────────────────────────────
  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ml/report`);
      if (res.ok) setReport(await res.json());
    } catch { /* ignore */ }
  }, []);

  // ── Init ─────────────────────────────────────────────
  useEffect(() => {
    fetchStatus();
    return () => stopPolling();
  }, []);

  // ── Start training ───────────────────────────────────
  const startTraining = async () => {
    setLoading(true);
    setReport(null);
    try {
      await fetch(`${API}/api/ml/train`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      startPolling();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────
  const models = report?.models ? Object.entries(report.models) : [];
  const bestName = report?.best_model?.name;
  const maxRmse = models.length ? Math.max(...models.map(([, v]) => v.test_metrics.RMSE)) : 1;

  // ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pipeline ML — Análisis de Coste de Carbono</h1>
              <p className="text-xs text-slate-400">3 algoritmos base · 2 modelos híbridos · EDA · Pruebas estadísticas · Exportación .h5</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status.status === 'done' && (
            <button
              id="ml-refresh-btn"
              onClick={fetchReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
          )}
          <a
            id="ml-streamlit-lab-btn"
            href="http://localhost:8501"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 hover:text-white font-semibold text-sm transition-all shadow-md shadow-indigo-950/50"
          >
            <FlaskConical className="w-4 h-4 text-indigo-400" />
            <span>Laboratorio Streamlit (8501)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <button
            id="ml-train-btn"
            onClick={startTraining}
            disabled={loading || status.status === 'running'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/40"
          >
            {status.status === 'running'
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Entrenando…</>
              : <><Play className="w-4 h-4" /> Entrenar modelos</>}
          </button>
        </div>
      </div>

      {/* ── Progress bar (while running) ── */}
      {status.status === 'running' && (
        <div className="rounded-xl border border-violet-800/50 bg-violet-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-violet-300 font-medium">
              <Activity className="w-4 h-4 animate-pulse" />
              {status.step || 'Procesando…'}
            </span>
            <span className="text-violet-400 font-mono font-bold">{status.progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status.status === 'error' && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">Error en el pipeline</p>
            <p className="text-red-400 text-xs mt-1 font-mono">{status.error}</p>
          </div>
        </div>
      )}

      {/* ── Idle placeholder ── */}
      {status.status === 'idle' && !report && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-700/40 flex items-center justify-center">
            <Brain className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold">Pipeline no ejecutado aún</p>
            <p className="text-slate-500 text-sm mt-1">
              Pulsa <strong className="text-violet-300">Entrenar modelos</strong> para lanzar el pipeline completo
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Random Forest', 'XGBoost', 'SVR', 'Stacking (híbrido)', 'Blending (híbrido)'].map(m => (
              <span key={m} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Report ── */}
      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Mejor modelo"
              value={report.best_model.name}
              sub={`CV-RMSE: ${report.best_model.cv_rmse_mean.toFixed(4)}`}
              icon={<Trophy className="w-4 h-4 text-amber-400" />}
              color="amber"
            />
            <MetricCard
              label="RMSE (test)"
              value={report.best_model.metrics.RMSE.toFixed(4)}
              sub="kg CO₂e"
              icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
              color="emerald"
            />
            <MetricCard
              label="R² (test)"
              value={report.best_model.metrics.R2.toFixed(4)}
              sub="coeficiente de determinación"
              icon={<Target className="w-4 h-4 text-cyan-400" />}
              color="cyan"
            />
            <MetricCard
              label="Dataset"
              value={report.dataset.n_samples.toLocaleString()}
              sub={`registros · ${report.dataset.n_features} features`}
              icon={<BarChart3 className="w-4 h-4 text-violet-400" />}
              color="violet"
            />
          </div>

          {/* Model Comparison Table */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <h2 className="font-bold text-white">Comparación de modelos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-800">
                    <th className="text-left px-5 py-3">Modelo</th>
                    <th className="text-right px-4 py-3">CV-RMSE (μ)</th>
                    <th className="text-right px-4 py-3">CV-RMSE (σ)</th>
                    <th className="text-right px-4 py-3">RMSE test</th>
                    <th className="text-right px-4 py-3">MAE test</th>
                    <th className="text-right px-4 py-3">R² test</th>
                    <th className="text-right px-4 py-3">MAPE %</th>
                    <th className="text-right px-4 py-3">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {models
                    .sort(([, a], [, b]) => a.cv_rmse_mean - b.cv_rmse_mean)
                    .map(([name, data]) => {
                      const isBest = name === bestName;
                      const colors = MODEL_COLORS[name] ?? { bar: 'bg-slate-500', ring: '' };
                      const rmse = data.test_metrics.RMSE;
                      const pct = (rmse / maxRmse) * 100;
                      return (
                        <React.Fragment key={name}>
                          <tr
                            className={`border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/40 transition-colors ${isBest ? 'bg-amber-950/20' : ''}`}
                            onClick={() => setExpandedModel(expandedModel === name ? null : name)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
                                <span className={`font-medium ${isBest ? 'text-amber-300' : 'text-white'}`}>{name}</span>
                                {isBest && <Badge label="★ Ganador" color="amber" />}
                                {(name === 'Stacking' || name === 'Blending') && <Badge label="Híbrido" color="violet" />}
                              </div>
                            </td>
                            <td className="text-right px-4 py-3.5 font-mono text-slate-300">{data.cv_rmse_mean.toFixed(4)}</td>
                            <td className="text-right px-4 py-3.5 font-mono text-slate-500">±{data.cv_rmse_std.toFixed(4)}</td>
                            <td className="text-right px-4 py-3.5 font-mono text-slate-200">{rmse.toFixed(4)}</td>
                            <td className="text-right px-4 py-3.5 font-mono text-slate-300">{data.test_metrics.MAE.toFixed(4)}</td>
                            <td className="text-right px-4 py-3.5 font-mono text-emerald-300">{data.test_metrics.R2.toFixed(4)}</td>
                            <td className="text-right px-4 py-3.5 font-mono text-slate-300">{data.test_metrics.MAPE.toFixed(2)}%</td>
                            <td className="px-4 py-3.5 w-28">
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                          {expandedModel === name && (
                            <tr className="bg-slate-900/80">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">CV-RMSE por fold</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {data.cv_rmse_scores.map((s, i) => (
                                      <span key={i} className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300">
                                        Fold {i + 1}: {s.toFixed(4)}
                                      </span>
                                    ))}
                                  </div>
                                  {Object.keys(data.best_params).length > 0 && (
                                    <>
                                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-3 mb-2">Mejores hiperparámetros</p>
                                      <div className="flex gap-2 flex-wrap">
                                        {Object.entries(data.best_params).map(([k, v]) => (
                                          <span key={k} className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-violet-300">
                                            {k}: <span className="text-white">{JSON.stringify(v)}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Statistical Tests */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-white">Pruebas estadísticas de solidez</h2>
            </div>
            <div className="p-5 space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mb-2">
                <span className="flex items-center gap-1"><Badge label="***" color="violet" /> p &lt; 0.001</span>
                <span className="flex items-center gap-1"><Badge label="**" color="cyan" /> p &lt; 0.01</span>
                <span className="flex items-center gap-1"><Badge label="*" color="emerald" /> p &lt; 0.05</span>
                <span className="flex items-center gap-1"><Badge label="ns" color="amber" /> p ≥ 0.05</span>
              </div>

              {/* Friedman */}
              {report.statistical_tests.friedman && (() => {
                const t = report.statistical_tests.friedman!;
                return (
                  <StatRow
                    id="friedman"
                    icon={<Sigma className="w-4 h-4 text-violet-400" />}
                    title="Test de Friedman"
                    subtitle="No paramétrico · k modelos × n folds"
                    sig={t.significance}
                    pValue={t.p_value}
                    statistic={t.statistic}
                    interpretation={t.interpretation}
                    expanded={expandedStat === 'friedman'}
                    onToggle={() => setExpandedStat(expandedStat === 'friedman' ? null : 'friedman')}
                  />
                );
              })()}

              {/* Wilcoxon */}
              {report.statistical_tests.wilcoxon?.map((w, i) => (
                <StatRow
                  key={i}
                  id={`wilcoxon-${i}`}
                  icon={<Activity className="w-4 h-4 text-emerald-400" />}
                  title={`Wilcoxon Signed-Rank`}
                  subtitle={w.comparison ?? 'Post-hoc'}
                  sig={w.significance}
                  pValue={w.p_value}
                  statistic={w.statistic}
                  interpretation={w.interpretation}
                  expanded={expandedStat === `wilcoxon-${i}`}
                  onToggle={() => setExpandedStat(expandedStat === `wilcoxon-${i}` ? null : `wilcoxon-${i}`)}
                />
              ))}

              {/* Nadeau-Bengio */}
              {report.statistical_tests.nadeau_bengio && (() => {
                const t = report.statistical_tests.nadeau_bengio!;
                return (
                  <StatRow
                    id="nb"
                    icon={<Zap className="w-4 h-4 text-amber-400" />}
                    title="t-test Corregido (Nadeau-Bengio)"
                    subtitle={t.comparison ?? 'Corrección de correlación CV'}
                    sig={t.significance}
                    pValue={t.p_value}
                    statistic={t.t_statistic ?? t.statistic}
                    interpretation={t.interpretation}
                    expanded={expandedStat === 'nb'}
                    onToggle={() => setExpandedStat(expandedStat === 'nb' ? null : 'nb')}
                  />
                );
              })()}

              {/* Bootstrap CI */}
              {report.statistical_tests.bootstrap_ci && (() => {
                const t = report.statistical_tests.bootstrap_ci!;
                const ciText = (t.ci_lower !== undefined && t.ci_upper !== undefined)
                  ? `IC ${t.confidence_level ?? '95%'}: [${t.ci_lower.toFixed(2)}, ${t.ci_upper.toFixed(2)}] kg CO₂e`
                  : undefined;
                return (
                  <StatRow
                    id="bootstrap"
                    icon={<RefreshCw className="w-4 h-4 text-cyan-400" />}
                    title={`Bootstrap CI ${t.confidence_level ?? '95%'}`}
                    subtitle={`${t.n_bootstrap?.toLocaleString() ?? 2000} reps · RMSE del mejor modelo`}
                    sig={t.significance}
                    valueDisplay={t.point_rmse !== undefined ? `RMSE: ${t.point_rmse.toFixed(2)}` : undefined}
                    interpretation={t.interpretation}
                    extra={ciText}
                    expanded={expandedStat === 'bootstrap'}
                    onToggle={() => setExpandedStat(expandedStat === 'bootstrap' ? null : 'bootstrap')}
                  />
                );
              })()}

              {/* Shapiro-Wilk */}
              {report.statistical_tests.shapiro_wilk && (() => {
                const t = report.statistical_tests.shapiro_wilk!;
                return (
                  <StatRow
                    id="shapiro"
                    icon={<BarChart3 className="w-4 h-4 text-pink-400" />}
                    title="Shapiro-Wilk"
                    subtitle="Normalidad de residuales"
                    sig={t.significance}
                    pValue={t.p_value}
                    statistic={t.statistic}
                    interpretation={t.interpretation}
                    expanded={expandedStat === 'shapiro'}
                    onToggle={() => setExpandedStat(expandedStat === 'shapiro' ? null : 'shapiro')}
                  />
                );
              })()}

              {/* Breusch-Pagan */}
              {report.statistical_tests.breusch_pagan && (() => {
                const t = report.statistical_tests.breusch_pagan!;
                return (
                  <StatRow
                    id="bp"
                    icon={<CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    title="Breusch-Pagan"
                    subtitle="Homocedasticidad de residuales"
                    sig={t.significance}
                    pValue={t.p_value}
                    statistic={t.lm_statistic ?? t.statistic}
                    interpretation={t.interpretation}
                    expanded={expandedStat === 'bp'}
                    onToggle={() => setExpandedStat(expandedStat === 'bp' ? null : 'bp')}
                  />
                );
              })()}
            </div>
          </section>

          {/* Footer — metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Generado: {new Date(report.generated_at).toLocaleString('es-ES')}
              </span>
              <span>· Tiempo total: {report.elapsed_seconds}s</span>
              <span>· Fuente: {report.dataset.source}</span>
            </div>
            <a
              href={`${API}/api/ml/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors"
              id="ml-download-report-link"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar reporte JSON
            </a>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// StatRow helper
// ─────────────────────────────────────────────────────────
interface StatRowProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  sig?: string;
  pValue?: number;
  valueDisplay?: string;
  statistic?: number;
  interpretation: string;
  extra?: string;
  expanded: boolean;
  onToggle: () => void;
}

const StatRow: React.FC<StatRowProps> = ({
  id, icon, title, subtitle, sig, pValue, valueDisplay, statistic, interpretation, extra, expanded, onToggle,
}) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
    <button
      id={`stat-row-${id}`}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors text-left"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {sig && <SigBadge sig={sig} />}
        {pValue !== undefined && pValue !== null && (
          <span className="font-mono text-sm text-slate-300">p={Number(pValue).toFixed(4)}</span>
        )}
        {valueDisplay && (
          <span className="font-mono text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-md font-semibold">
            {valueDisplay}
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>
    </button>
    {expanded && (
      <div className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-2">
        {statistic !== undefined && statistic !== null && (
          <p className="text-xs text-slate-400">
            Estadístico: <span className="font-mono text-white">{Number(statistic).toFixed(6)}</span>
          </p>
        )}
        {extra && <p className="text-xs text-emerald-400 font-mono font-medium">{extra}</p>}
        <p className="text-xs text-slate-300">{interpretation}</p>
      </div>
    )}
  </div>
);

export default MLDashboard;
