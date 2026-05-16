import type { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (!error) return false;
    
    // Network errors (no response)
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('Network request failed') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT')) {
      return true;
    }
    
    // Supabase/Postgrest errors
    if (error.code) {
      // Retry on rate limiting (429)
      if (error.code === '429' || error.status === 429) return true;
      
      // Retry on server errors (5xx)
      if (error.status && error.status >= 500 && error.status < 600) return true;
      
      // Retry on connection errors
      if (error.code === 'PGRST116' || error.code === 'PGRST117') return true;
    }
    
    return false;
  }
};

/**
 * Sleep for a specified duration
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.1 * Math.random(); // Add 10% jitter
  const delay = exponentialDelay + jitter;
  return Math.min(delay, maxDelay);
};

/**
 * Retry a Supabase operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<PostgrestResponse<T>>,
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
    try {
      const result = await operation();
      
      // If the operation itself succeeded but has an error property, check if we should retry
      if (result.error && opts.shouldRetry!(result.error)) {
        lastError = result.error;
        if (attempt < opts.maxRetries!) {
          const delay = calculateDelay(attempt, opts.baseDelay!, opts.maxDelay!);
          console.warn(`Supabase operation failed (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${Math.round(delay)}ms:`, result.error);
          await sleep(delay);
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < opts.maxRetries! && opts.shouldRetry!(error)) {
        const delay = calculateDelay(attempt, opts.baseDelay!, opts.maxDelay!);
        console.warn(`Supabase operation threw error (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${Math.round(delay)}ms:`, error);
        await sleep(delay);
        continue;
      }
      
      // If we shouldn't retry or we've exhausted retries, throw
      throw error;
    }
  }
  
  // If we've exhausted all retries, return the last result or throw
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Max retries exceeded without error information');
}

/**
 * Retry an async operation (for auth calls and other non-Postgrest operations)
 */
export async function withRetryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < opts.maxRetries! && opts.shouldRetry!(error)) {
        const delay = calculateDelay(attempt, opts.baseDelay!, opts.maxDelay!);
        console.warn(`Async operation failed (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${Math.round(delay)}ms:`, error);
        await sleep(delay);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
