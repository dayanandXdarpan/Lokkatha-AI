/**
 * Humanize error messages for better UX
 * Maps technical errors to user-friendly messages
 */

interface ErrorMapping {
  pattern: RegExp | string;
  message: string;
}

const errorMappings: ErrorMapping[] = [
  // Network errors
  { pattern: /ECONNREFUSED|ERR_CONNECTION_REFUSED/i, message: 'Unable to connect to the server. Please check your internet connection and try again.' },
  { pattern: /ETIMEDOUT|TIMEOUT|timed out/i, message: 'The request took too long. Please try again.' },
  { pattern: /ENOTFOUND|DNS|getaddrinfo/i, message: 'Network error. Please check your internet connection.' },
  { pattern: /Network|network error/i, message: 'A network error occurred. Please check your connection.' },
  
  // API errors
  { pattern: /401|unauthorized|unauthenticated/i, message: 'Authentication failed. Please refresh the page and try again.' },
  { pattern: /402|payment required|quota/i, message: 'Service quota exceeded. Please try again later or contact support.' },
  { pattern: /403|forbidden/i, message: 'Access denied. You don\'t have permission to perform this action.' },
  { pattern: /404|not found/i, message: 'The requested resource was not found.' },
  { pattern: /429|too many requests|rate limit/i, message: 'Too many requests. Please wait a moment and try again.' },
  { pattern: /500|internal server error/i, message: 'A server error occurred. Our team has been notified.' },
  { pattern: /502|bad gateway/i, message: 'Service temporarily unavailable. Please try again in a moment.' },
  { pattern: /503|service unavailable/i, message: 'Service is temporarily down. Please try again later.' },
  
  // Job/Queue errors
  { pattern: /job not found/i, message: 'Video generation job not found. It may have expired.' },
  { pattern: /queue.*full|queue.*overflow/i, message: 'System is at capacity. Please try again in a few minutes.' },
  
  // Validation errors
  { pattern: /missing required|required field/i, message: 'Please fill in all required fields.' },
  { pattern: /invalid.*topic|invalid.*language|invalid.*grade/i, message: 'Please check your input and try again.' },
  { pattern: /duration.*exceed|too long/i, message: 'Video duration is too long. Please choose a shorter duration.' },
  
  // Processing errors
  { pattern: /failed to generate script/i, message: 'Failed to create video script. Please try a different topic or try again.' },
  { pattern: /failed to generate image/i, message: 'Image generation failed. Please try again.' },
  { pattern: /failed to generate.*audio|tts failed/i, message: 'Audio generation failed. Please try again.' },
  { pattern: /ffmpeg|video processing failed/i, message: 'Video processing failed. Please try again.' },
  
  // Generic fallbacks
  { pattern: /error/i, message: 'Something went wrong. Please try again.' },
];

/**
 * Convert technical error to user-friendly message
 */
export function humanizeError(error: any): string {
  if (!error) {
    return 'An unknown error occurred. Please try again.';
  }

  // Get error message
  let errorMessage = '';
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.error) {
    errorMessage = error.error;
  } else {
    errorMessage = String(error);
  }

  // Try to match against known patterns
  for (const mapping of errorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (errorMessage.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return mapping.message;
      }
    } else if (mapping.pattern.test(errorMessage)) {
      return mapping.message;
    }
  }

  // If no match, return a sanitized version of the error
  // Remove technical jargon but keep essential info
  const cleaned = errorMessage
    .replace(/Error:/gi, '')
    .replace(/^\s*at\s+.*/gm, '') // Remove stack traces
    .replace(/\{.*\}/g, '') // Remove JSON
    .replace(/\[.*\]/g, '') // Remove arrays
    .trim();

  if (cleaned && cleaned.length < 150) {
    return cleaned;
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Get a retry suggestion based on error type
 */
export function getRetrySuggestion(error: any): string | null {
  const errorMessage = String(error?.message || error || '');

  if (/network|connection|timeout/i.test(errorMessage)) {
    return 'Check your internet connection';
  }
  
  if (/quota|rate limit|too many/i.test(errorMessage)) {
    return 'Wait a few minutes';
  }

  if (/queue.*full/i.test(errorMessage)) {
    return 'Try again in a few minutes';
  }

  return null;
}
