/**
 * Performs a best-effort app reset by clearing storage and caches
 * Safe to call even if service worker or Cache Storage APIs are unavailable
 */
export async function resetCachedApp(): Promise<void> {
  try {
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }

    // Clear Cache Storage if available
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cleared Cache Storage:', cacheNames);
      } catch (e) {
        console.warn('Failed to clear Cache Storage:', e);
      }
    }

    // Unregister service workers if available
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('Unregistered service workers:', registrations.length);
      } catch (e) {
        console.warn('Failed to unregister service workers:', e);
      }
    }

    // Reload the page
    window.location.reload();
  } catch (error) {
    console.error('Error during app reset:', error);
    // Force reload even if reset partially failed
    window.location.reload();
  }
}
