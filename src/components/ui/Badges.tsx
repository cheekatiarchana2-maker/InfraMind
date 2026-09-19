import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/types';

const STYLES: Record<UrgencyLevel, string> = {
  LOW: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export function UrgencyBadge({ level, className }: { level: UrgencyLevel; className?: string }) {
  return (
    <span className={cn('badge border', STYLES[level], className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          level === 'LOW' && 'bg-slate-400',
          level === 'MEDIUM' && 'bg-amber-400',
          level === 'HIGH' && 'bg-orange-400',
          level === 'CRITICAL' && 'bg-red-400 animate-pulse-soft',
        )}
      />
      {level}
    </span>
  );
}

export function ConfidenceBar({
  value,
  className,
  showLabel = true,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const color = value >= 80 ? 'from-emerald-500 to-emerald-400' : value >= 60 ? 'from-ai-500 to-ai-400' : 'from-amber-500 to-amber-400';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-sm font-semibold text-slate-200 tabular-nums">{value}%</span>
      )}
    </div>
  );
}

export function SimilarityBar({ value }: { value: number }) {
  const color = value >= 80 ? 'from-ai-500 to-ai-300' : value >= 60 ? 'from-ai-600 to-ai-400' : 'from-slate-500 to-slate-400';
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-ai-300 tabular-nums">{value}%</span>
    </div>
  );
}
