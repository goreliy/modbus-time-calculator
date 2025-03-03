
// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default timeout in milliseconds
export const DEFAULT_TIMEOUT = 5000;

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;
