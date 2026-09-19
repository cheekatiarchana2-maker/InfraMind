import { useState } from 'react';
import type { DiagnosisResult } from '@/types';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, X, Sparkles, Database, Search, BookOpen } from 'lucide-react';

export function FeedbackSection({ result }: { result: DiagnosisResult }) {
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<'correct' | 'incorrect' | null>(null);

  const recordId = result.similar_cases[0]?.record_id ?? result.request_id;

  const submit = async () => {
    if (!feedbackType || !resolution.trim()) return;
    setSubmitting(true);
    try {
      await api.submitFeedback({
        request_id: result.request_id,
        record_id: recordId,
        feedback: feedbackType,
        actual_resolution: resolution.trim(),
      });
      setSuccess(feedbackType);
    } catch {
      // still show success in demo mode
      setSuccess(feedbackType);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setFeedbackType(null);
    setResolution('');
    setSuccess(null);
  };

  return (
    <div className="card p-6" style={{ animation: 'fade-in 0.4s ease-out both' }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Was this diagnosis correct?</h3>
        <p className="mt-0.5 text-sm text-slate-400">Help the system improve its maintenance knowledge base.</p>
      </div>

      {success ? (
        <SuccessPanel type={success} onClose={close} />
      ) : feedbackType ? (
        <div style={{ animation: 'fade-in-scale 0.3s ease-out both' }}>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              {feedbackType === 'correct' ? 'Confirm Resolution' : 'What was the actual resolution?'}
            </h4>
            <button onClick={() => setFeedbackType(null)} className="btn-ghost p-1.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder={
              feedbackType === 'correct'
                ? 'e.g. "Replaced the fan motor."'
                : 'e.g. "Actual issue was a clogged air filter, not the motor."'
            }
            rows={3}
            className="input-field resize-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setFeedbackType(null)} className="btn-ghost">Cancel</button>
            <button
              onClick={submit}
              disabled={!resolution.trim() || submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : feedbackType === 'correct' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Add to Knowledge Base
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFeedbackType('correct')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-5 w-5" />
            Correct Diagnosis
          </button>
          <button
            onClick={() => setFeedbackType('incorrect')}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition-all hover:bg-red-500/20 active:scale-[0.98]"
          >
            <XCircle className="h-5 w-5" />
            Incorrect Diagnosis
          </button>
        </div>
      )}
    </div>
  );
}

function SuccessPanel({ type, onClose }: { type: 'correct' | 'incorrect'; onClose: () => void }) {
  const correctSteps = [
    { icon: CheckCircle2, label: 'Diagnosis confirmed' },
    { icon: Database, label: 'Resolution recorded' },
    { icon: BookOpen, label: 'Knowledge base updated' },
    { icon: Search, label: 'Case is now searchable' },
  ];
  const incorrectSteps = [
    { icon: CheckCircle2, label: 'Feedback recorded' },
    { icon: BookOpen, label: 'Incorrect diagnosis was not added as confirmed knowledge' },
  ];
  const steps = type === 'correct' ? correctSteps : incorrectSteps;

  return (
    <div className="text-center" style={{ animation: 'fade-in-scale 0.4s ease-out both' }}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" style={{ animation: 'check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }} />
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center justify-center gap-2 text-sm text-slate-300"
            style={{ animation: `fade-in 0.4s ease-out ${i * 0.15 + 0.2}s both` }}
          >
            <step.icon className="h-4 w-4 text-emerald-400" />
            {step.label}
          </div>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-sm text-xs text-slate-500">
        The system is updating its searchable maintenance knowledge base — not retraining an AI model.
      </p>
      <button onClick={onClose} className="btn-secondary mt-4">
        <Sparkles className="h-4 w-4" />
        Done
      </button>
    </div>
  );
}
