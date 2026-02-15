import { useSyncStatus } from '../offline/useSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, pendingCount, lastError, retry, isSyncing } = useSyncStatus();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {/* Online/Offline Status */}
      <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1 sm:gap-1.5 text-xs">
        {isOnline ? (
          <>
            <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </Badge>

      {/* Pending Changes Count */}
      {pendingCount > 0 && (
        <Badge variant="outline" className="gap-1 sm:gap-1.5 text-xs">
          {isSyncing ? (
            <>
              <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </>
          ) : (
            <>
              {pendingCount} <span className="hidden sm:inline">pending</span>
            </>
          )}
        </Badge>
      )}

      {/* Error State with Retry */}
      {lastError && (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant="destructive" className="gap-1 sm:gap-1.5 text-xs">
            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Error</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={isSyncing}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
