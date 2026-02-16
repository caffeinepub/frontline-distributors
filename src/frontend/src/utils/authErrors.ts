/**
 * Normalizes backend authorization errors into user-friendly English messages.
 * Strips stack traces and technical prefixes while preserving the core reason.
 */
export function normalizeAuthError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  let message = '';

  // Extract message from various error formats
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && 'message' in error) {
    message = String((error as any).message);
  } else {
    message = String(error);
  }

  // Strip common technical prefixes while preserving the core message
  // Order matters: strip outer wrappers first, then inner ones
  message = message
    .replace(/^Error:\s*/i, '')
    .replace(/^Reject text:\s*/i, '')
    .replace(/^Call was rejected:\s*/i, '')
    .replace(/^Request failed:\s*/i, '')
    .replace(/^IC\d+:\s*/i, '')
    .replace(/^Request failed with status code \d+:\s*/i, '')
    .replace(/^Agent error:\s*/i, '')
    .replace(/^Canister error:\s*/i, '')
    .replace(/^Backend error:\s*/i, '')
    .replace(/^Call failed:\s*/i, '')
    .replace(/^Canister rejected the message:\s*/i, '')
    .replace(/^The replica returned an error:\s*/i, '')
    .trim();

  // Remove stack traces (everything after newline)
  const firstLine = message.split('\n')[0].trim();
  if (firstLine) {
    message = firstLine;
  }

  // If it's an authorization error, ensure it's clear
  if (message.toLowerCase().includes('unauthorized')) {
    // Keep the original message as it's already user-friendly
    return message;
  }

  // If it's about actor/connection issues
  if (message.toLowerCase().includes('actor not available') || 
      message.toLowerCase().includes('unable to connect')) {
    return 'Unable to connect to the server. Please wait a moment and try again.';
  }

  // If message is empty or too technical, provide a fallback
  if (!message || message.length < 3) {
    return 'Login failed. Please check your credentials and try again.';
  }

  return message;
}
