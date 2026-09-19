import { useState } from 'react';
import type { DiagnosisResult, SimilarCase } from '@/types';
import { SectionCard } from '@/components/ui/Layout';
import { UrgencyBadge, ConfidenceBar, SimilarityBar } from '@/components/ui/Badges';
import { AgentPipeline } from '@/components/AgentPipeline';
import { AGENT_IDENTITIES } from '@/lib/agents';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Target,
  ShieldAlert,
  Wrench,
  ListChecks,
  Clock,
  IndianRupee,
  AlertTriangle,
  Lightbulb,
  FileSearch,
  History,
  Eye,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { FeedbackSection } from './FeedbackSection';
import { EvidenceModal } from './EvidenceModal';

export function DiagnosisResultDashboard({
  result,
  onReset,
}: {
  result: DiagnosisResult;
  onReset: () => void;
}) {
  const [evidenceCase, setEvidenceCase] = useState<SimilarCase | null>(null);

  return (
    <div className="space-y-6">
      {/* Main diagnosis card */}
      <div
        className="card relative overflow-hidden p-8"
        style={{ animation: 'slide-up 0.5s ease-out both' }}
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ai-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            AI Diagnosis Complete
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Likely Cause</div>
              <h2 className="mt-1 text-2xl font-bold text-white lg:text-3xl">{result.likely_cause}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-300">{result.confidence}%</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-ink-700" />
                <div>
                  <div className="text-xs text-slate-500">Urgency</div>
                  <div className="mt-1"><UrgencyBadge level={result.urgency} /></div>
                </div>
              </div>
            </div>

            {/* Confidence ring */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2c4d" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#34d399" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.confidence / 100) * 264} 264`}
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-bold text-white">{result.confidence}%</div>
                <div className="text-[10px] text-slate-500">confidence</div>
              </div>
            </div>
          </div>

          <div className="mt-4 max-w-md">
            <ConfidenceBar value={result.confidence} />
          </div>
        </div>
      </div>

      {/* Two-column: reasoning + alternatives */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reasoning */}
        <SectionCard
          title="Why this diagnosis?"
          subtitle="Evidence-based reasoning from the explanation agent."
          className="lg:col-span-2"
        >
          <p className="text-sm leading-relaxed text-slate-300">{result.explanation.why_this_diagnosis}</p>
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FileSearch className="h-4 w-4" /> Evidence Points
            </div>
            <div className="space-y-2">
              {result.explanation.evidence_points.map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"
                  style={{ animation: `fade-in 0.4s ease-out ${i * 0.1}s both` }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm text-slate-300">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Alternatives */}
        <SectionCard title="Other Possible Causes" subtitle="Less likely diagnoses.">
          <div className="space-y-3">
            {result.alternative_diagnoses.length === 0 && (
              <p className="text-sm text-slate-500">No alternative diagnoses identified.</p>
            )}
            {result.alternative_diagnoses.map((alt, i) => (
              <div
                key={i}
                className="rounded-xl border border-ink-700/60 bg-ink-800/40 p-4"
                style={{ animation: `fade-in 0.4s ease-out ${i * 0.1}s both` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{alt.cause}</span>
                  <span className="font-mono text-sm font-semibold text-slate-400">{alt.confidence}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400"
                    style={{ width: `${alt.confidence}%`, transition: 'width 0.8s ease-out' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Similar historical cases */}
      <SectionCard
        title="Similar Historical Cases"
        subtitle="Retrieved from the maintenance knowledge base."
        action={
          <div className="flex items-center gap-2 text-xs text-ai-300">
            <FileSearch className="h-4 w-4" />
            {result.similar_cases.length} cases retrieved
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.similar_cases.map((c, i) => (
            <div
              key={c.record_id}
              className="group rounded-xl border border-ink-700/60 bg-ink-800/40 p-4 transition-all hover:border-ai-500/30 hover:bg-ink-800/70"
              style={{ animation: `slide-up 0.5s ease-out ${i * 0.1}s both` }}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-semibold text-ai-300">{c.record_id}</span>
                <UrgencyBadge level={c.urgency} />
              </div>
              <div className="mt-3 text-sm font-semibold text-white">{c.equipment_type}</div>
              <div className="text-xs text-slate-500">{c.location}</div>
              <div className="mt-3 border-t border-ink-700/40 pt-3">
                <div className="text-xs text-slate-500">Symptom</div>
                <div className="text-sm text-slate-300">{c.symptom}</div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-slate-500">Likely cause</div>
                <div className="text-sm font-medium text-slate-200">{c.likely_cause}</div>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs text-slate-500">Similarity</div>
                <SimilarityBar value={c.similarity} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-700/40 pt-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{c.cost.toLocaleString('en-IN')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.repair_time}</span>
                </div>
              </div>
              <button
                onClick={() => setEvidenceCase(c)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-850/60 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-ai-500/40 hover:text-ai-200"
              >
                <Eye className="h-3.5 w-3.5" />
                View Evidence
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Recommendation */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recommended Action"
          subtitle="Generated by the recommendation agent."
          className="lg:col-span-2"
        >
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm font-medium text-slate-200">{result.recommended_action}</p>
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <ListChecks className="h-4 w-4" /> Repair Steps
          </div>
          <div className="space-y-2">
            {result.step_by_step_actions.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-ink-700/50 bg-ink-800/30 p-3"
                style={{ animation: `fade-in 0.4s ease-out ${i * 0.08}s both` }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ai-500/15 text-xs font-bold text-ai-300">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300">{step}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Estimates + safety */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-ai-300" />
              <span className="text-sm font-bold text-white">Estimates</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                <span className="flex items-center gap-2 text-sm text-slate-400"><IndianRupee className="h-4 w-4" /> Cost</span>
                <span className="text-lg font-bold text-white">{formatCurrency(result.estimated_cost)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                <span className="flex items-center gap-2 text-sm text-slate-400"><Clock className="h-4 w-4" /> Time</span>
                <span className="text-lg font-bold text-white">{result.estimated_time}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                <span className="flex items-center gap-2 text-sm text-slate-400"><AlertTriangle className="h-4 w-4" /> Urgency</span>
                <UrgencyBadge level={result.urgency} />
              </div>
            </div>
          </div>

          <div className="card border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-bold text-amber-200">Safety Note</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{result.safety_note}</p>
          </div>
        </div>
      </div>

      {/* Agent trace */}
      <SectionCard title="Agent Execution Trace" subtitle="High-level activity from the agent team.">
        <AgentPipeline trace={result.agent_trace} />
      </SectionCard>

      {/* Decision summary */}
      <div className="card p-6" style={{ animation: 'fade-in 0.4s ease-out both' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-ai-500/10 px-3 py-1 text-xs font-semibold text-ai-300">
              <Lightbulb className="h-3.5 w-3.5" /> AI Decision
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500">Cause</div>
                <div className="text-sm font-semibold text-white">{result.likely_cause}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Confidence</div>
                <div className="text-sm font-semibold text-emerald-300">{result.confidence}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Urgency</div>
                <div><UrgencyBadge level={result.urgency} /></div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Cost / Time</div>
                <div className="text-sm font-semibold text-white">{formatCurrency(result.estimated_cost)} · {result.estimated_time}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setEvidenceCase(result.similar_cases[0] ?? null)}
            disabled={result.similar_cases.length === 0}
            className="btn-secondary"
          >
            <FileText className="h-4 w-4" />
            View Full Evidence
          </button>
        </div>
      </div>

      {/* Feedback */}
      <FeedbackSection result={result} />

      {/* Reset */}
      <div className="flex justify-center pt-2">
        <button onClick={onReset} className="btn-ghost">
          <RotateCcw className="h-4 w-4" />
          Start New Diagnosis
        </button>
      </div>

      {/* Evidence Modal */}
      {evidenceCase && (
        <EvidenceModal caseData={evidenceCase} onClose={() => setEvidenceCase(null)} />
      )}
    </div>
  );
}

// Re-export to satisfy unused import linter
export { XCircle, History };
