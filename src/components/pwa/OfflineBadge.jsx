import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBadge() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold shadow-sm animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>Offline Mode</span>
    </div>
  );
}
