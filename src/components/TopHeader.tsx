import { Bell, User } from 'lucide-react';
import { BackendStatusBadge } from './BackendStatusBadge';

export function TopHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-ink-700/60 bg-ink-900/80 px-8 py-5 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        <BackendStatusBadge />
        <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-ink-800 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ai-400 ring-2 ring-ink-900" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-ai-500/30 to-ai-600/20 ring-1 ring-ai-500/30">
            <User className="h-4 w-4 text-ai-300" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-white">Facility Manager</div>
            <div className="text-[10px] text-slate-500">Operations</div>
          </div>
        </div>
      </div>
    </header>
  );
}
