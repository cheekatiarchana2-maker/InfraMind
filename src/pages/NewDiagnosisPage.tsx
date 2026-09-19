import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AnalyzePayload, DiagnosisResult } from '@/types';
import { DiagnosisForm } from './diagnosis/DiagnosisForm';
import { AgentWorkingPanel } from './diagnosis/AgentWorkingPanel';
import { DiagnosisResultDashboard } from './diagnosis/DiagnosisResultDashboard';

export function NewDiagnosisPage() {
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEquipment().then((eq) => {
      setEquipmentList(eq);
      setLoading(false);
    });
  }, []);

  const handleAnalyze = async (payload: AnalyzePayload) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.analyze(payload);
      setResult(res);
    } catch {
      setError('Unable to complete the AI analysis. Check that the backend is running and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && !analyzing && !result && (
        <div className="card border-red-500/20 bg-red-500/5 p-6">
          <h3 className="text-sm font-semibold text-red-300">Unable to complete the AI analysis.</h3>
          <p className="mt-1 text-sm text-slate-400">{error}</p>
          <button onClick={reset} className="btn-secondary mt-4">
            Retry Analysis
          </button>
        </div>
      )}

      {!result && !analyzing && !error && (
        <DiagnosisForm
          equipmentList={equipmentList}
          loading={loading}
          onAnalyze={handleAnalyze}
        />
      )}

      {analyzing && <AgentWorkingPanel />}

      {result && !analyzing && (
        <DiagnosisResultDashboard result={result} onReset={reset} />
      )}
    </div>
  );
}
