// lib/apiClient.ts
// WHAT: Client-side API request wrapper with CSRF protection
// WHY: Automatically includes CSRF token in all state-changing requests
// HOW: Read token from cookie, add to headers, handle errors

// WHAT: Get CSRF token from cookie
// WHY: Need token for state-changing requests (POST/PUT/DELETE)
function getCsrfToken(): string | null {
  // WHAT: Check if running in browser
  if (typeof document === 'undefined') {
    return null;
  }
  
  // WHAT: Parse cookies to find csrf-token
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

// WHAT: Fetch CSRF token from server if not in cookie
// WHY: First request needs to get token before making state-changing requests
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfToken();
  
  if (!token) {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      token = data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      return null;
    }
  }
  
  return token;
}

// WHAT: API request options extending standard fetch options
interface ApiRequestOptions extends RequestInit {
  skipCsrf?: boolean;  // Set to true to skip CSRF token (for GET requests)
}

// WHAT: Make API request with automatic CSRF token handling
// WHY: Centralized request logic ensures all requests are protected
// HOW: Add CSRF token header for state-changing methods, handle errors consistently
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipCsrf = false, ...fetchOptions } = options;
  
  // WHAT: Prepare headers
  const headers = new Headers(fetchOptions.headers);
  
  // WHAT: Set Content-Type if not already set
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // WHAT: Add CSRF token for state-changing methods
  // WHY: CSRF protection required for POST/PUT/DELETE/PATCH
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const requiresCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  if (requiresCsrf && !skipCsrf) {
    const csrfToken = await ensureCsrfToken();
    
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    } else {
      console.warn('CSRF token not available - request may fail');
    }
  }
  
  // WHAT: Make request
  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });
    
    // WHAT: Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const errorData = await response.json();
      
      throw new Error(
        `Rate limit exceeded. ${errorData.error || 'Please try again later.'}` +
        (retryAfter ? ` Retry after ${retryAfter} seconds.` : '')
      );
    }
    
    // WHAT: Handle CSRF violation (403)
    if (response.status === 403) {
      const errorData = await response.json();
      
      if (errorData.code === 'CSRF_TOKEN_INVALID') {
        // WHAT: Clear invalid token and retry once
        document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        throw new Error(
          'CSRF token invalid. Please refresh the page and try again.'
        );
      }
    }
    
    // WHAT: Handle other HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response not JSON, use default message
      }
      
      throw new Error(errorMessage);
    }
    
    // WHAT: Parse successful response
    const contentType = response.headers.get('Content-Type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text() as any;
  } catch (error) {
    // WHAT: Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`API request failed: ${error}`);
  }
}

// WHAT: Convenience methods for common HTTP verbs
// WHY: Simplified API with automatic method setting

export async function apiGet<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
    skipCsrf: true,  // GET requests don't need CSRF
  });
}

export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// WHAT: Example usage in React components
// WHY: Show developers how to use the API client

/*
// Example: GET request
import { apiGet } from '@/lib/apiClient';

const projects = await apiGet('/api/projects');

// Example: POST request with data
import { apiPost } from '@/lib/apiClient';

const newProject = await apiPost('/api/projects', {
  eventName: 'New Event',
  eventDate: '2025-11-01',
  stats: { ... }
});

// Example: PUT request
import { apiPut } from '@/lib/apiClient';

const updated = await apiPut('/api/projects', {
  projectId: '123',
  eventName: 'Updated Name',
});

// Example: DELETE request
import { apiDelete } from '@/lib/apiClient';

await apiDelete('/api/projects?projectId=123');

// Example: Error handling
try {
  const result = await apiPost('/api/projects', data);
  console.log('Success:', result);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limiting
    alert('Too many requests. Please try again later.');
  } else if (error.message.includes('CSRF')) {
    // Handle CSRF error
    alert('Security token expired. Please refresh the page.');
  } else {
    // Handle other errors
    alert(`Error: ${error.message}`);
  }
}
*/
