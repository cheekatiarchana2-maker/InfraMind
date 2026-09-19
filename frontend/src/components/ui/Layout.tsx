import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  accent: string;
  delay?: number;
}) {
  return (
    <div
      className="card group relative overflow-hidden p-5"
      style={{ animation: `slide-up 0.5s ease-out ${delay}s both` }}
    >
      <div className={cn('absolute right-0 top-0 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20', accent)} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-white tabular-nums">{value}</div>
          {sublabel && <div className="mt-1 text-xs text-slate-500">{sublabel}</div>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', accent, 'bg-opacity-10')}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-800 ring-1 ring-ink-700">
        <Icon className="h-6 w-6 text-slate-600" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-300">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
        <Icon name="alert" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-red-300">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          Retry
        </button>
      )}
    </div>
  );
}

import { AlertCircle } from 'lucide-react';

function Icon({ name }: { name: 'alert' }) {
  return <AlertCircle className="h-6 w-6 text-red-400" />;
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-ai-500/30 border-t-ai-400" />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}
