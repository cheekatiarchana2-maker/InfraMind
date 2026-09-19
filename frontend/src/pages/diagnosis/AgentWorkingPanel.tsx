import { useEffect, useState } from 'react';
import { AgentPipeline } from '@/components/AgentPipeline';
import { AGENT_ORDER, AGENT_IDENTITIES } from '@/lib/agents';
import type { AgentName, AgentStatus, AgentTraceStep } from '@/types';
import { Loader2 } from 'lucide-react';

const STEP_LABELS: Record<AgentName, string> = {
  orchestrator: 'Planning investigation...',
  retrieval: 'Searching historical maintenance cases...',
  diagnosis: 'Reasoning over similar cases...',
  recommendation: 'Generating repair recommendation...',
  explanation: 'Preparing evidence...',
};

const DURATIONS = [900, 1400, 1600, 1200, 1000];

export function AgentWorkingPanel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trace, setTrace] = useState<AgentTraceStep[]>(() =>
    AGENT_ORDER.map((agent) => ({
      agent,
      label: AGENT_IDENTITIES[agent].name,
      description: AGENT_IDENTITIES[agent].role,
      status: 'pending' as AgentStatus,
    })),
  );

  useEffect(() => {
    if (currentIndex >= AGENT_ORDER.length) return;
    const timer = setTimeout(() => {
      setTrace((prev) =>
        prev.map((step, i) => {
          if (i === currentIndex) return { ...step, status: 'running', detail: STEP_LABELS[step.agent] };
          if (i < currentIndex) return { ...step, status: 'completed', detail: STEP_LABELS[step.agent] };
          return step;
        }),
      );
      // After a bit, mark as completed and advance
      const completeTimer = setTimeout(() => {
        setTrace((prev) =>
          prev.map((step, i) =>
            i === currentIndex
              ? { ...step, status: 'completed', detail: STEP_LABELS[step.agent] }
              : step,
          ),
        );
        setCurrentIndex((c) => c + 1);
      }, DURATIONS[currentIndex]);
      return () => clearTimeout(completeTimer);
    }, 200);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out both' }}>
      {/* Banner */}
      <div className="card mb-6 border-ai-500/20 bg-gradient-to-r from-ai-500/5 to-transparent p-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2.5">
          <Loader2 className="h-6 w-6 animate-spin text-ai-400" />
          <h2 className="text-2xl font-bold tracking-tight text-white">AI AGENTS WORKING</h2>
        </div>
        <p className="text-sm text-slate-400">
          A team of five specialized agents is collaborating to diagnose this issue.
        </p>
      </div>

      {/* Pipeline */}
      <div className="card p-8">
        <AgentPipeline trace={trace} />
      </div>

      {/* Activity log */}
      <div className="card mt-4 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Live Activity</div>
        <div className="space-y-2 font-mono text-xs">
          {trace.map((step) => (
            <div key={step.agent} className="flex items-center gap-3">
              {step.status === 'completed' && <span className="text-emerald-400">✓</span>}
              {step.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-ai-400" />}
              {step.status === 'pending' && <span className="text-slate-700">○</span>}
              <span
                className={
                  step.status === 'completed'
                    ? 'text-slate-300'
                    : step.status === 'running'
                    ? 'text-ai-300'
                    : 'text-slate-600'
                }
              >
                {step.label}: {step.detail || step.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
