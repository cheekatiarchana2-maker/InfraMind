import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { KnowledgeStats } from '@/types';
import { KpiCard, SectionCard, LoadingSpinner, ErrorState } from '@/components/ui/Layout';
import { Database, Boxes, TrendingUp, CheckCircle2, ArrowDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KnowledgeBasePage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const s = await api.getKnowledgeStats();
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

  const maxCount = stats ? Math.max(...stats.equipment_distribution.map((e) => e.count)) : 1;

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSpinner label="Loading knowledge base…" />
      ) : error ? (
        <ErrorState title="Unable to load knowledge base" message="Check that the backend is running and try again." onRetry={load} />
      ) : stats ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Records" value={stats.total_records} sublabel="historical cases" icon={Database} accent="bg-ai-500/10 text-ai-300 ring-ai-500/20" />
            <KpiCard label="Equipment Categories" value={stats.equipment_categories} sublabel="types covered" icon={Boxes} accent="bg-violet-500/10 text-violet-300 ring-violet-500/20" delay={0.05} />
            <KpiCard label="Recent Additions" value={stats.recent_additions} sublabel="newly added cases" icon={TrendingUp} accent="bg-amber-500/10 text-amber-300 ring-amber-500/20" delay={0.1} />
            <KpiCard label="Confirmed Cases" value={stats.confirmed_cases} sublabel="technician-verified" icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" delay={0.15} />
          </div>

          {/* Retrieval flow */}
          <SectionCard title="Knowledge Retrieval Pipeline" subtitle="How historical cases become evidence for new diagnoses.">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex items-center gap-3 rounded-xl border border-ai-500/20 bg-ai-500/5 px-6 py-3">
                <Database className="h-5 w-5 text-ai-300" />
                <span className="text-sm font-bold text-white">{stats.total_records} Historical Cases</span>
              </div>
              <ArrowDown className="h-5 w-5 text-slate-600" />
              <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-6 py-3">
                <Search className="h-5 w-5 text-violet-300" />
                <span className="text-sm font-bold text-white">Semantic Vector Search</span>
              </div>
              <ArrowDown className="h-5 w-5 text-slate-600" />
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span className="text-sm font-bold text-white">Relevant Maintenance Evidence</span>
              </div>
            </div>
          </SectionCard>

          {/* Equipment distribution chart */}
          <SectionCard title="Equipment Distribution" subtitle="Cases by equipment type across the knowledge base.">
            <div className="space-y-3">
              {stats.equipment_distribution.map((item, i) => (
                <div
                  key={item.equipment}
                  className="flex items-center gap-4"
                  style={{ animation: `fade-in 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <div className="w-40 shrink-0 text-sm text-slate-300">{item.equipment}</div>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-ink-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-ai-600 to-ai-400 transition-all duration-700"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

export { cn };
