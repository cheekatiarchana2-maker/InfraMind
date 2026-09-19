import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RecentDiagnosis } from '@/types';
import { mockData } from '@/lib/mockData';
import { SectionCard, LoadingSpinner, ErrorState } from '@/components/ui/Layout';
import { AgentPipeline, AgentPipelineMini } from '@/components/AgentPipeline';
import { AGENT_IDENTITIES, AGENT_ORDER } from '@/lib/agents';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, X, Network, Activity, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function AgentActivityPage() {
  const [recent, setRecent] = useState<RecentDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await api.getRecentDiagnoses();
      setRecent(r);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Build a trace for the selected request
  const selectedTrace = mockData.buildTrace({
    orchestrator: { duration_ms: 85, detail: 'Planned 5-step investigation.' },
    retrieval: { duration_ms: 312, detail: 'Retrieved 5 similar cases.' },
    diagnosis: { duration_ms: 1200, detail: 'Identified probable cause.' },
    recommendation: { duration_ms: 840, detail: 'Generated repair plan.' },
    explanation: { duration_ms: 620, detail: 'Generated evidence summary.' },
  });

  return (
    <div className="space-y-6">
      {/* Architecture overview */}
      <SectionCard
        title="Agent Operations Center"
        subtitle="Observe how FacilityAI coordinates specialized agents."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <AgentPipeline trace={selectedTrace} />
          <div className="space-y-3">
            {AGENT_ORDER.map((id) => {
              const agent = AGENT_IDENTITIES[id];
              const Icon: LucideIcon = agent.icon;
              return (
                <div
                  key={id}
                  className={cn('rounded-xl border p-4', agent.border, agent.bg)}
                  style={{ animation: `fade-in 0.4s ease-out ${AGENT_ORDER.indexOf(id) * 0.1}s both` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', agent.bg, 'ring-1', agent.border)}>
                      <Icon className={cn('h-5 w-5', agent.text)} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{agent.name}</div>
                      <div className="text-xs text-slate-400">{agent.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Recent executions */}
      <SectionCard title="Recent Executions" subtitle="Latest agent team runs across the system.">
        {loading ? (
          <LoadingSpinner label="Loading agent activity…" />
        ) : error ? (
          <ErrorState title="Unable to load activity" message="Check that the backend is running and try again." onRetry={load} />
        ) : (
          <div className="space-y-4">
            {/* Request selector */}
            <div className="flex flex-wrap gap-2">
              {recent.slice(0, 6).map((r, i) => (
                <button
                  key={r.request_id}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all',
                    selected === i
                      ? 'border-ai-500/40 bg-ai-500/10 text-ai-300'
                      : 'border-ink-700 bg-ink-800/40 text-slate-400 hover:text-slate-200',
                  )}
                >
                  {r.request_id}
                </button>
              ))}
            </div>

            {/* Execution detail */}
            {recent[selected] && (
              <div
                className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-5"
                style={{ animation: 'fade-in 0.4s ease-out both' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-ai-300" />
                    <div>
                      <div className="text-sm font-bold text-white">Request #{recent[selected].request_id}</div>
                      <div className="text-xs text-slate-500">{recent[selected].equipment} · {recent[selected].location}</div>
                    </div>
                  </div>
                  <span className="badge bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                </div>

                {/* Agent steps */}
                <div className="space-y-2">
                  {selectedTrace.map((step) => {
                    const agent = AGENT_IDENTITIES[step.agent];
                    const Icon: LucideIcon = agent.icon;
                    return (
                      <div
                        key={step.agent}
                        className="flex items-center gap-3 rounded-lg border border-ink-700/40 bg-ink-800/30 p-3"
                      >
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', agent.bg, 'ring-1', agent.border)}>
                          <Icon className={cn('h-4 w-4', agent.text)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">{step.label}</span>
                          </div>
                          <div className="text-xs text-slate-400">{step.detail}</div>
                        </div>
                        {step.duration_ms != null && (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {step.duration_ms} ms
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-ink-700/40 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Total: {selectedTrace.reduce((a, s) => a + (s.duration_ms ?? 0), 0)} ms</span>
                  <span className="flex items-center gap-1.5"><Network className="h-3.5 w-3.5" /> 5 agents coordinated</span>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Mini pipeline summary */}
      <SectionCard title="Agent Pipeline Summary" subtitle="The standard investigation workflow.">
        <div className="flex justify-center py-4">
          <AgentPipelineMini />
        </div>
      </SectionCard>
    </div>
  );
}

export { Loader2, X };
