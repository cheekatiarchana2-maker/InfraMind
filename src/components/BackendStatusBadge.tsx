import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function BackendStatusBadge() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const s = await api.health();
      if (mounted) setConnected(s.connected);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        'hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold md:flex',
        connected
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/20 bg-red-500/10 text-red-300',
      )}
    >
      <span className={cn('relative flex h-2 w-2')}>
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-pulse-ring rounded-full',
            connected ? 'bg-emerald-400' : 'bg-red-400',
          )}
        />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-red-400')} />
      </span>
      {connected ? 'Backend Connected' : 'Backend Offline'}
    </div>
  );
}
