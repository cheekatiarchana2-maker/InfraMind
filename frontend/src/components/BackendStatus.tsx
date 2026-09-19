import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import type { BackendStatus } from '@/types';

export function BackendStatusPanel() {
  const [status, setStatus] = useState<BackendStatus>({ connected: false });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const s = await api.health();
      if (mounted) {
        setStatus(s);
        setChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const connected = status.connected;
  const demo = status.message === 'Demo mode';

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Backend Status</div>
      <div className="flex items-center gap-2.5">
        <span className={cn('relative flex h-2.5 w-2.5', checking && 'opacity-50')}>
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full',
              connected ? 'bg-emerald-400 animate-pulse-ring' : 'bg-red-400',
            )}
          />
          <span
            className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              connected ? 'bg-emerald-400' : 'bg-red-400',
            )}
          />
        </span>
        <span className={cn('text-sm font-semibold', connected ? 'text-emerald-300' : 'text-red-300')}>
          {checking ? 'Checking…' : connected ? (demo ? 'Demo Mode' : 'Connected') : 'Offline'}
        </span>
        {connected ? <Wifi className="h-4 w-4 text-emerald-400/60" /> : <WifiOff className="h-4 w-4 text-red-400/60" />}
      </div>
      {!connected && !checking && (
        <p className="mt-2 text-xs text-slate-500">
          Backend unreachable. Showing demo data. Start the FastAPI server to use live AI agents.
        </p>
      )}
    </div>
  );
}
