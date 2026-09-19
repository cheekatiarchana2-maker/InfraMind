import { Building2, Cpu, Wrench, Network } from 'lucide-react';
import type { PageId } from '@/types';
import { cn } from '@/lib/utils';
import { BackendStatusPanel } from './BackendStatus';

const NAV: { id: PageId; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'overview', label: 'Overview', icon: Building2, desc: 'Dashboard' },
  { id: 'new-diagnosis', label: 'New Diagnosis', icon: Cpu, desc: 'AI Analysis' },
  { id: 'cases', label: 'Maintenance Cases', icon: Wrench, desc: 'History' },
  { id: 'agent-activity', label: 'Agent Activity', icon: Network, desc: 'Operations' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Building2, desc: 'Evidence' },
  { id: 'feedback', label: 'Technician Feedback', icon: Wrench, desc: 'Learning' },
];

export function Sidebar({
  current,
  onNavigate,
}: {
  current: PageId;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/95">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-ink-700/60 px-5 py-5">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-ai-500/20 to-ai-600/10 ring-1 ring-ai-500/30">
          <Building2 className="h-5 w-5 text-ai-300" />
          <Network className="absolute -right-1 -top-1 h-4 w-4 text-ai-400/80" />
          <Wrench className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-amber-400/80" />
        </div>
        <div>
          <div className="text-base font-bold leading-tight text-white">FacilityAI</div>
          <div className="text-[11px] font-medium leading-tight text-ai-300/70">Agentic Maintenance Intelligence</div>
        </div>
      </div>

      {/* System status */}
      <div className="flex items-center gap-2 px-5 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">AI System Online</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                active
                  ? 'bg-ai-500/10 text-white ring-1 ring-ai-500/30'
                  : 'text-slate-400 hover:bg-ink-800/60 hover:text-slate-200',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active ? 'text-ai-300' : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">{item.label}</div>
                <div className={cn('text-[11px] leading-tight', active ? 'text-ai-300/60' : 'text-slate-600')}>
                  {item.desc}
                </div>
              </div>
              {active && <div className="h-1.5 w-1.5 rounded-full bg-ai-400" />}
            </button>
          );
        })}
      </nav>

      {/* Backend status */}
      <div className="border-t border-ink-700/60 p-3">
        <BackendStatusPanel />
      </div>
    </aside>
  );
}
