import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { getSecretParameter } from '../utils/urlParams';

export type ActorStatus = 'initializing' | 'ready' | 'error';

export interface ActorStatusResult {
  actor: any;
  status: ActorStatus;
  error: Error | null;
  isFetching: boolean;
  retry: () => void;
  diagnostics: {
    hasAdminToken: boolean;
    identityPrincipal: string | null;
    queryStatus: string;
    errorMessage: string | null;
  };
}

/**
 * Hook that wraps useActor and exposes detailed initialization state
 * for diagnostics and error recovery UI
 */
export function useActorStatus(): ActorStatusResult {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get the actor query state from the cache
  const actorQueryKey = ['actor', identity?.getPrincipal().toString()];
  const actorQueryState = queryClient.getQueryState(actorQueryKey);

  // Determine status
  let status: ActorStatus = 'initializing';
  let error: Error | null = null;

  if (actorQueryState) {
    if (actorQueryState.status === 'error') {
      status = 'error';
      error = actorQueryState.error as Error;
      // Log initialization failures for debugging
      console.error('Actor initialization failed:', {
        error: actorQueryState.error,
        errorMessage: error?.message,
        stack: error?.stack,
      });
    } else if (actorQueryState.status === 'success' && actor) {
      status = 'ready';
    }
  }

  // Build diagnostics
  const adminToken = getSecretParameter('caffeineAdminToken');
  const diagnostics = {
    hasAdminToken: !!adminToken && adminToken.trim().length > 0,
    identityPrincipal: identity?.getPrincipal().toString() || null,
    queryStatus: actorQueryState?.status || 'unknown',
    errorMessage: error?.message || null,
  };

  // Retry function
  const retry = () => {
    console.log('Retrying actor initialization...');
    queryClient.invalidateQueries({ queryKey: actorQueryKey });
  };

  return {
    actor,
    status,
    error,
    isFetching,
    retry,
    diagnostics,
  };
}
