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

    // Clear Cache Storage
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (e) {
        console.warn('Failed to clear Cache Storage:', e);
      }
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      } catch (e) {
        console.warn('Failed to unregister service workers:', e);
      }
    }
  } catch (e) {
    console.error('Error during app reset:', e);
  } finally {
    // Always reload, even if some cleanup steps failed
    window.location.reload();
  }
}
