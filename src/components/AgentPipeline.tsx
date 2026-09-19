import { cn } from '@/lib/utils';
import { AGENT_IDENTITIES, AGENT_ORDER } from '@/lib/agents';
import type { AgentName, AgentStatus, AgentTraceStep } from '@/types';
import { Check, Loader2, X, ArrowDown, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function StatusIcon({ status }: { status: AgentStatus }) {
  if (status === 'completed')
    return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === 'running')
    return <Loader2 className="h-4 w-4 animate-spin text-ai-400" />;
  if (status === 'failed')
    return <X className="h-4 w-4 text-red-400" />;
  return <div className="h-2 w-2 rounded-full bg-slate-600" />;
}

function AgentNode({
  agentId,
  status,
  label,
  description,
  durationMs,
  detail,
  active,
}: {
  agentId: AgentName;
  status: AgentStatus;
  label: string;
  description: string;
  durationMs?: number;
  detail?: string;
  active?: boolean;
}) {
  const identity = AGENT_IDENTITIES[agentId];
  const Icon: LucideIcon = identity.icon;

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500',
        status === 'pending' && 'border-ink-700/50 bg-ink-850/40 opacity-50',
        status === 'running' && cn('border-ai-500/40 bg-ink-850/80 ring-2 ring-ai-500/20 shadow-lg shadow-ai-500/10'),
        status === 'completed' && cn('border-emerald-500/20 bg-ink-850/60'),
        status === 'failed' && 'border-red-500/30 bg-red-500/5',
        active && 'scale-[1.02]',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-all',
          identity.bg,
          identity.border,
          status === 'running' && identity.ring,
        )}
      >
        <Icon className={cn('h-6 w-6', identity.text)} />
        {status === 'running' && (
          <span className={cn('absolute inset-0 animate-pulse-ring rounded-xl', identity.bg)} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{label}</span>
          <StatusIcon status={status} />
          {durationMs != null && status === 'completed' && (
            <span className="font-mono text-[11px] text-slate-500">{durationMs} ms</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {status === 'running' ? detail || description : description}
        </p>
      </div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto h-8 w-px">
      <div className="absolute inset-0 bg-ink-700" />
      {active && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 h-4 w-px animate-flow-down bg-gradient-to-b from-transparent via-ai-400 to-transparent" />
        </div>
      )}
    </div>
  );
}

export function AgentPipeline({
  trace,
  compact = false,
}: {
  trace: AgentTraceStep[];
  compact?: boolean;
}) {
  const ordered = AGENT_ORDER.map((name) => {
    const found = trace.find((t) => t.agent === name);
    return (
      found ?? {
        agent: name,
        label: AGENT_IDENTITIES[name].name,
        description: AGENT_IDENTITIES[name].role,
        status: 'pending' as AgentStatus,
      }
    );
  });

  return (
    <div className={cn('mx-auto', compact ? 'max-w-sm' : 'max-w-md')}>
      {/* User complaint entry */}
      <div className="mb-2 flex justify-center">
        <div className="rounded-full border border-ink-700/60 bg-ink-800/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          User Complaint
        </div>
      </div>
      <Connector active={ordered.some((a) => a.status === 'running' || a.status === 'completed')} />

      {ordered.map((step, i) => (
        <div key={step.agent}>
          <AgentNode
            agentId={step.agent}
            status={step.status}
            label={step.label}
            description={step.description}
            durationMs={step.duration_ms}
            detail={step.detail}
            active={step.status === 'running'}
          />
          {i < ordered.length - 1 && (
            <Connector
              active={ordered.slice(i + 1).some((a) => a.status === 'running' || a.status === 'completed')}
            />
          )}
        </div>
      ))}

      <Connector active={ordered.every((a) => a.status === 'completed')} />
      <div className="flex justify-center">
        <div
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all',
            ordered.every((a) => a.status === 'completed')
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-ink-700/60 bg-ink-800/60 text-slate-400',
          )}
        >
          Final Decision
        </div>
      </div>
    </div>
  );
}

export function AgentPipelineMini() {
  const steps: { name: string; icon: LucideIcon; color: string }[] = AGENT_ORDER.map((id) => {
    const a = AGENT_IDENTITIES[id];
    return { name: a.shortName, icon: a.icon, color: a.text };
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-850/60 px-3 py-2">
            <step.icon className={cn('h-4 w-4', step.color)} />
            <span className="text-xs font-semibold text-slate-300">{step.name}</span>
          </div>
          {i < steps.length - 1 && <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg] text-slate-600" />}
        </div>
      ))}
    </div>
  );
}

export function AgentPipelineHero() {
  const steps = ['Complaint', 'Retrieval', 'Diagnosis', 'Recommendation', 'Explanation'];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="rounded-lg border border-ai-500/20 bg-ai-500/5 px-3 py-1.5 text-xs font-semibold text-ai-200"
            style={{ animation: `fade-in 0.5s ease-out ${i * 0.15}s both` }}
          >
            {step}
          </div>
          {i < steps.length - 1 && (
            <ArrowDown
              className="h-3.5 w-3.5 rotate-[-90deg] text-ai-400/50"
              style={{ animation: `fade-in 0.3s ease-out ${i * 0.15 + 0.1}s both` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export { AlertCircle };
