/**
 * Normalizes backend authorization errors into user-friendly English messages.
 * Strips stack traces, technical prefixes, and replica/canister rejection wrappers
 * while preserving the core reason.
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
  // Added more comprehensive replica/canister rejection patterns
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
    .replace(/^Canister:\s*/i, '')
    .replace(/^Replica:\s*/i, '')
    .replace(/^Reject message:\s*/i, '')
    .replace(/^Rejection:\s*/i, '')
    .trim();

  // Remove stack traces (everything after newline)
  const firstLine = message.split('\n')[0].trim();
  if (firstLine) {
    message = firstLine;
  }

  // If it's an authorization error, make it more user-friendly
  if (message.toLowerCase().includes('unauthorized')) {
    // Check for specific authorization scenarios
    if (message.includes('Only admins can assign user roles')) {
      return 'Access denied. Please contact the system administrator.';
    }
    if (message.includes('Only admins can perform this action')) {
      return 'This action requires administrator privileges.';
    }
    if (message.includes('Only users can perform this action')) {
      return 'You must be logged in to perform this action.';
    }
    // Keep other unauthorized messages as-is (they're already clear)
    return message;
  }

  // If it's about actor/connection issues
  if (message.toLowerCase().includes('actor not available') || 
      message.toLowerCase().includes('unable to connect')) {
    return 'Unable to connect to the server. Please wait a moment and try again.';
  }

  // If it's about authentication failure or wrong password
  if (message.toLowerCase().includes('authentication failed') || 
      message.toLowerCase().includes('wrong password') ||
      message.toLowerCase().includes('incorrect password')) {
    return 'Incorrect password. Please verify you selected the correct role and use the password provided by the administrator.';
  }

  // If it's about anonymous principals
  if (message.toLowerCase().includes('anonymous principal')) {
    return 'Anonymous login is not supported. Please use a valid account.';
  }

  // If message is empty or too technical, provide a fallback
  if (!message || message.length < 3) {
    return 'Login failed. Please check your credentials and try again.';
  }

  return message;
}
