import type { SimilarCase } from '@/types';
import { UrgencyBadge } from '@/components/ui/Badges';
import { formatCurrency } from '@/lib/utils';
import { X, FileSearch, MapPin, Wrench, Clock, IndianRupee, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

export function EvidenceModal({
  caseData,
  onClose,
}: {
  caseData: SimilarCase;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const fields: { label: string; value: string; icon: typeof MapPin }[] = [
    { label: 'Record ID', value: caseData.record_id, icon: FileSearch },
    { label: 'Equipment', value: caseData.equipment_type, icon: Wrench },
    { label: 'Location', value: caseData.location, icon: MapPin },
    { label: 'Symptom', value: caseData.symptom, icon: AlertTriangle },
    { label: 'Likely Cause', value: caseData.likely_cause, icon: FileSearch },
    { label: 'Resolution', value: caseData.recommended_fix, icon: CheckCircle2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: 'fade-in 0.2s ease-out both' }}
    >
      <div
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s ease-out both' }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ai-500/20 bg-ai-500/10 px-3 py-1 text-xs font-semibold text-ai-300">
              <FileSearch className="h-3.5 w-3.5" /> Historical Record
            </div>
            <h3 className="mt-2 text-xl font-bold text-white">{caseData.record_id}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-ink-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Why retrieved */}
        <div className="mb-5 rounded-xl border border-ai-500/20 bg-ai-500/5 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ai-200">
            <FileSearch className="h-4 w-4" /> Why this case was retrieved
          </div>
          <p className="text-sm text-slate-300">
            High semantic similarity with the current complaint ({caseData.similarity}% match).
            Same equipment type and comparable symptom profile.
          </p>
        </div>

        {/* Original complaint */}
        {caseData.complaint && (
          <div className="mb-5 rounded-xl border border-ink-700/60 bg-ink-800/40 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" /> Original Complaint
            </div>
            <p className="text-sm text-slate-300">{caseData.complaint}</p>
          </div>
        )}

        {/* Fields grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="rounded-xl border border-ink-700/50 bg-ink-800/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                <f.icon className="h-3.5 w-3.5" /> {f.label}
              </div>
              <div className="text-sm font-medium text-slate-200">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-ink-700/50 bg-ink-800/30 p-3 text-center">
            <IndianRupee className="mx-auto mb-1 h-4 w-4 text-slate-500" />
            <div className="text-sm font-bold text-white">{formatCurrency(caseData.cost)}</div>
            <div className="text-xs text-slate-500">Cost</div>
          </div>
          <div className="rounded-xl border border-ink-700/50 bg-ink-800/30 p-3 text-center">
            <Clock className="mx-auto mb-1 h-4 w-4 text-slate-500" />
            <div className="text-sm font-bold text-white">{caseData.repair_time}</div>
            <div className="text-xs text-slate-500">Repair Time</div>
          </div>
          <div className="rounded-xl border border-ink-700/50 bg-ink-800/30 p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-slate-500" />
            <div className="flex justify-center"><UrgencyBadge level={caseData.urgency} /></div>
            <div className="text-xs text-slate-500">Urgency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
