import { useEffect, useState, useRef } from 'react';

export interface StartupDiagnostics {
  phase: string;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isFetched: boolean;
  profileLoading: boolean;
  timestamp: number;
}

interface UseStartupWatchdogOptions {
  isLoading: boolean;
  diagnostics: Omit<StartupDiagnostics, 'timestamp'>;
  timeoutMs?: number;
}

export function useStartupWatchdog({
  isLoading,
  diagnostics,
  timeoutMs = 15000, // 15 seconds default
}: UseStartupWatchdogOptions) {
  const [watchdogTriggered, setWatchdogTriggered] = useState(false);
  const [capturedDiagnostics, setCapturedDiagnostics] = useState<StartupDiagnostics | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhaseRef = useRef<string>('');

  useEffect(() => {
    // Log phase transitions safely
    if (diagnostics.phase !== lastPhaseRef.current) {
      try {
        console.log(`[Startup] Phase: ${diagnostics.phase}`);
      } catch (e) {
        // Ignore console errors
      }
      lastPhaseRef.current = diagnostics.phase;
    }
  }, [diagnostics.phase]);

  useEffect(() => {
    if (isLoading) {
      // Start watchdog timer
      timeoutRef.current = setTimeout(() => {
        const captured: StartupDiagnostics = {
          ...diagnostics,
          timestamp: Date.now(),
        };
        setCapturedDiagnostics(captured);
        setWatchdogTriggered(true);
        
        try {
          console.error('[Startup] Watchdog timeout triggered', captured);
        } catch (e) {
          // Ignore console errors
        }
      }, timeoutMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else {
      // Clear timeout if loading completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isLoading, diagnostics, timeoutMs]);

  return {
    watchdogTriggered,
    capturedDiagnostics,
  };
}
