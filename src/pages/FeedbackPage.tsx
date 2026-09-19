import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FeedbackEntry, FeedbackStats } from '@/types';
import { KpiCard, SectionCard, LoadingSpinner, ErrorState } from '@/components/ui/Layout';
import { CheckCircle2, XCircle, Database, ThumbsUp, ThumbsDown, BookOpen, ArrowDown, GitBranch } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

export function FeedbackPage() {
  const [history, setHistory] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [h, s] = await Promise.all([api.getFeedbackHistory(), api.getFeedbackStats()]);
      setHistory(h);
      setStats(s);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const accuracy = stats && stats.total_feedback > 0
    ? Math.round((stats.correct / stats.total_feedback) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSpinner label="Loading feedback data…" />
      ) : error ? (
        <ErrorState title="Unable to load feedback" message="Check that the backend is running and try again." onRetry={load} />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Feedback" value={stats?.total_feedback ?? 0} sublabel="submissions" icon={BookOpen} accent="bg-ai-500/10 text-ai-300 ring-ai-500/20" />
            <KpiCard label="Correct Diagnoses" value={stats?.correct ?? 0} sublabel="confirmed by technicians" icon={ThumbsUp} accent="bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" delay={0.05} />
            <KpiCard label="Incorrect Diagnoses" value={stats?.incorrect ?? 0} sublabel="flagged for review" icon={ThumbsDown} accent="bg-red-500/10 text-red-300 ring-red-500/20" delay={0.1} />
            <KpiCard label="Confirmed Cases" value={stats?.confirmed_cases ?? 0} sublabel="added to knowledge base" icon={Database} accent="bg-amber-500/10 text-amber-300 ring-amber-500/20" delay={0.15} />
          </div>

          {/* Learning pipeline */}
          <SectionCard title="Learning Pipeline" subtitle="How technician feedback improves the knowledge base.">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex items-center gap-3 rounded-xl border border-ai-500/20 bg-ai-500/5 px-5 py-2.5">
                <span className="text-sm font-bold text-white">AI Diagnosis</span>
              </div>
              <ArrowDown className="h-5 w-5 text-slate-600" />
              <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-2.5">
                <span className="text-sm font-bold text-white">Technician Review</span>
              </div>
              <ArrowDown className="h-5 w-5 text-slate-600" />
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-2.5">
                <span className="text-sm font-bold text-white">Correct?</span>
              </div>

              {/* Branch */}
              <div className="flex items-start gap-12">
                <div className="flex flex-col items-center gap-2">
                  <GitBranch className="h-5 w-5 rotate-[-90deg] text-emerald-400" />
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm font-bold text-emerald-300">YES</div>
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                  <div className="rounded-xl border border-ink-700 bg-ink-800/40 px-4 py-2 text-sm font-semibold text-slate-300">Confirmed Case</div>
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                  <div className="rounded-xl border border-ai-500/20 bg-ai-500/5 px-4 py-2 text-sm font-semibold text-ai-300">Knowledge Base</div>
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                  <div className="rounded-xl border border-ink-700 bg-ink-800/40 px-4 py-2 text-sm text-slate-400">Future Retrieval</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GitBranch className="h-5 w-5 rotate-90 text-red-400" />
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-bold text-red-300">NO</div>
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                  <div className="rounded-xl border border-ink-700 bg-ink-800/40 px-4 py-2 text-sm font-semibold text-slate-300">Feedback Stored</div>
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                  <div className="rounded-xl border border-ink-700 bg-ink-800/40 px-4 py-2 text-sm text-slate-400">Review & Improve</div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Accuracy bar */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Diagnosis Accuracy</h3>
                <p className="text-xs text-slate-500">Based on technician feedback</p>
              </div>
              <span className="text-2xl font-bold text-emerald-300">{accuracy}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-ink-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${accuracy}%` }}
              />
              <div
                className="bg-gradient-to-r from-red-500/60 to-red-400/60 transition-all duration-700"
                style={{ width: `${100 - accuracy}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {stats?.correct ?? 0} correct</span>
              <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-400" /> {stats?.incorrect ?? 0} incorrect</span>
            </div>
          </div>

          {/* Recent feedback */}
          <SectionCard title="Recent Feedback" subtitle="Latest technician reviews.">
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-xl border border-ink-700/60 bg-ink-800/40 p-4"
                  style={{ animation: `fade-in 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                    entry.feedback === 'correct'
                      ? 'bg-emerald-500/10 ring-emerald-500/30'
                      : 'bg-red-500/10 ring-red-500/30',
                  )}>
                    {entry.feedback === 'correct'
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      : <XCircle className="h-5 w-5 text-red-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ai-300">{entry.request_id}</span>
                      {entry.equipment_type && <span className="text-xs text-slate-500">· {entry.equipment_type}</span>}
                      <span className={cn(
                        'ml-auto text-xs',
                        entry.feedback === 'correct' ? 'text-emerald-300' : 'text-red-300',
                      )}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{entry.actual_resolution}</p>
                    <div className="mt-1 text-xs text-slate-500">
                      {entry.feedback === 'correct'
                        ? 'Confirmed — added to knowledge base'
                        : 'Flagged as incorrect — not added as confirmed knowledge'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
