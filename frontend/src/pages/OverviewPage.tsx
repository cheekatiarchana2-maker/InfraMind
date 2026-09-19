import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardStats, RecentDiagnosis } from '@/types';
import { KpiCard, SectionCard, LoadingSpinner, ErrorState } from '@/components/ui/Layout';
import { UrgencyBadge, ConfidenceBar } from '@/components/ui/Badges';
import { AgentPipelineHero } from '@/components/AgentPipeline';
import { Sparkles, FileStack, CheckCircle2, Database, ArrowRight, Activity, RefreshCw } from 'lucide-react';
import type { PageId } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export function OverviewPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, r] = await Promise.all([api.getDashboardStats(), api.getRecentDiagnoses()]);
      setStats(s);
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

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="card relative overflow-hidden p-8"
        style={{ animation: 'fade-in 0.5s ease-out both' }}
      >
        <div className="grid-pattern absolute inset-0 opacity-50" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-ai-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ai-500/20 bg-ai-500/10 px-3 py-1 text-xs font-semibold text-ai-300">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-Agent AI System
            </div>
            <h2 className="text-2xl font-bold leading-tight text-white text-balance lg:text-3xl">
              AI-powered maintenance decisions
            </h2>
            <p className="mt-3 text-sm text-slate-400 lg:text-base">
              From a new complaint to evidence-backed diagnosis and repair recommendation — coordinated by
              specialized AI agents.
            </p>
            <button onClick={() => onNavigate('new-diagnosis')} className="btn-primary mt-5">
              <Sparkles className="h-5 w-5" />
              Start New Diagnosis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="lg:pl-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Agent Pipeline
            </div>
            <AgentPipelineHero />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <LoadingSpinner label="Loading dashboard…" />
      ) : error ? (
        <ErrorState
          title="Unable to load dashboard data"
          message="Check that the backend is running and try again."
          onRetry={load}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Maintenance Cases" value={stats?.total_cases ?? 0} sublabel="All time" icon={FileStack} accent="bg-ai-500/10 text-ai-300 ring-ai-500/20" delay={0} />
            <KpiCard label="AI Diagnoses" value={stats?.ai_diagnoses ?? 0} sublabel="Agent-generated" icon={Sparkles} accent="bg-violet-500/10 text-violet-300 ring-violet-500/20" delay={0.05} />
            <KpiCard label="Confirmed Diagnoses" value={stats?.confirmed_diagnoses ?? 0} sublabel="Technician-verified" icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" delay={0.1} />
            <KpiCard label="Knowledge Base" value={`${stats?.knowledge_base ?? 0}`} sublabel="searchable cases" icon={Database} accent="bg-amber-500/10 text-amber-300 ring-amber-500/20" delay={0.15} />
          </div>

          {/* Recent AI Diagnoses */}
          <SectionCard
            title="Recent AI Diagnoses"
            subtitle="Latest diagnosis requests processed by the agent team."
            action={
              <button onClick={() => onNavigate('cases')} className="btn-ghost text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-700/60 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 font-semibold">Request ID</th>
                    <th className="px-3 py-2.5 font-semibold">Equipment</th>
                    <th className="px-3 py-2.5 font-semibold">Location</th>
                    <th className="px-3 py-2.5 font-semibold">Diagnosis</th>
                    <th className="px-3 py-2.5 font-semibold">Confidence</th>
                    <th className="px-3 py-2.5 font-semibold">Urgency</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/60">
                  {recent.map((row, i) => (
                    <tr
                      key={row.request_id}
                      className="group transition-colors hover:bg-ink-800/40"
                      style={{ animation: `fade-in 0.4s ease-out ${i * 0.05}s both` }}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-ai-300">{row.request_id}</td>
                      <td className="px-3 py-3 text-slate-300">{row.equipment}</td>
                      <td className="px-3 py-3 text-slate-400">{row.location}</td>
                      <td className="px-3 py-3 font-medium text-slate-200">{row.diagnosis}</td>
                      <td className="px-3 py-3">
                        <ConfidenceBar value={row.confidence} className="w-28" />
                      </td>
                      <td className="px-3 py-3"><UrgencyBadge level={row.urgency} /></td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            row.status === 'Completed'
                              ? 'badge bg-emerald-500/10 text-emerald-300'
                              : row.status === 'In Review'
                              ? 'badge bg-amber-500/10 text-amber-300'
                              : 'badge bg-slate-500/10 text-slate-400'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
