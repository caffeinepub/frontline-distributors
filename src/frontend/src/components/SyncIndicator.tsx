import { useSyncStatus } from '../offline/useSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, pendingCount, lastError, retry, isSyncing } = useSyncStatus();

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1.5">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>

      {/* Pending Changes Count */}
      {pendingCount > 0 && (
        <Badge variant="outline" className="gap-1.5">
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              {pendingCount} pending
            </>
          )}
        </Badge>
      )}

      {/* Error State with Retry */}
      {lastError && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="h-3 w-3" />
            Sync Error
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={isSyncing}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
