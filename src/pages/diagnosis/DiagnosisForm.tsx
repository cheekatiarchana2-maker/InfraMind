import { useState } from 'react';
import type { AnalyzePayload } from '@/types';
import { Sparkles, Loader2, MapPin, Wrench, MessageSquare } from 'lucide-react';
import { mockData } from '@/lib/mockData';

const EXAMPLE_CHIPS = [
  'AC not cooling and making a loud buzzing noise',
  'Generator won\'t start',
  'Elevator stopping between floors',
  'Projector has no display',
];

const LOCATIONS = mockData.LOCATIONS;

export function DiagnosisForm({
  equipmentList,
  loading,
  onAnalyze,
}: {
  equipmentList: string[];
  loading: boolean;
  onAnalyze: (payload: AnalyzePayload) => void;
}) {
  const [equipment, setEquipment] = useState('');
  const [location, setLocation] = useState('');
  const [complaint, setComplaint] = useState('');

  const canSubmit = equipment && location && complaint.trim().length >= 10;

  const submit = () => {
    if (!canSubmit) return;
    onAnalyze({ equipment_type: equipment, location, complaint: complaint.trim() });
  };

  return (
    <div className="card p-8" style={{ animation: 'fade-in 0.4s ease-out both' }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai-500/10 ring-1 ring-ai-500/30">
          <Sparkles className="h-6 w-6 text-ai-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Describe the Equipment Issue</h2>
          <p className="text-sm text-slate-400">The agent team will investigate and provide an evidence-backed diagnosis.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Equipment */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Wrench className="h-4 w-4 text-slate-500" />
            Equipment Type
          </label>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            disabled={loading}
            className="input-field appearance-none bg-ink-800"
          >
            <option value="">{loading ? 'Loading equipment…' : 'Select equipment type'}</option>
            {equipmentList.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <MapPin className="h-4 w-4 text-slate-500" />
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field appearance-none bg-ink-800"
          >
            <option value="">Select location</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaint */}
      <div className="mt-5">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          Complaint
        </label>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Describe the equipment problem..."
          rows={4}
          className="input-field resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-slate-600">{complaint.trim().length} characters</span>
          {complaint.trim().length > 0 && complaint.trim().length < 10 && (
            <span className="text-xs text-amber-400/70">Add more detail for better analysis</span>
          )}
        </div>
      </div>

      {/* Example chips */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Example complaints</div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setComplaint(chip)}
              className="chip"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="mt-7 flex items-center justify-between border-t border-ink-700/60 pt-5">
        <p className="text-xs text-slate-500">
          Five specialized agents will collaborate on your diagnosis.
        </p>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn-primary text-base"
        >
          <Sparkles className="h-5 w-5" />
          Analyze with AI Agents
        </button>
      </div>
    </div>
  );
}

export { Loader2 };
