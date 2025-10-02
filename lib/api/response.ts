/**
 * API Response Utilities
 * 
 * Helper functions for creating consistent API responses across all endpoints.
 * Ensures proper status codes, error handling, and response format compliance.
 * 
 * WHAT: Standardized response builders for Next.js API routes
 * WHY: Eliminate inconsistency and reduce boilerplate in API route handlers
 */

import { NextResponse } from 'next/server';
import type {
  APIResponse,
  APIError,
  APIResponseMeta,
  PaginationConfig,
  PaginatedAPIResponse,
} from '../types/api';
import { APIErrorCode, getHTTPStatusForError, HTTP_STATUS_CODES } from '../types/api';

/**
 * Creates a standardized success response
 * 
 * @param data - The response data
 * @param options - Optional configuration (status code, metadata)
 * @returns NextResponse with standardized success format
 * 
 * @example
 * return successResponse({ project: updatedProject });
 * return successResponse({ projects }, { status: HTTP_STATUS_CODES.CREATED });
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    meta?: Partial<APIResponseMeta>;
  }
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  return NextResponse.json(response, {
    status: options?.status ?? HTTP_STATUS_CODES.OK,
  });
}

/**
 * Creates a standardized paginated success response
 * 
 * @param data - The array of response data
 * @param pagination - Pagination configuration
 * @param options - Optional configuration (meta)
 * @returns NextResponse with paginated format
 * 
 * @example
 * return paginatedResponse(projects, {
 *   limit: 20,
 *   offset: 40,
 *   hasMore: true,
 *   nextOffset: 60,
 *   total: 150
 * });
 */
export function paginatedResponse<T>(
  data: T,
  pagination: PaginationConfig,
  options?: {
    meta?: Partial<APIResponseMeta>;
  }
): NextResponse<PaginatedAPIResponse<T>> {
  const response: PaginatedAPIResponse<T> = {
    success: true,
    data,
    pagination,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  return NextResponse.json(response, {
    status: HTTP_STATUS_CODES.OK,
  });
}

/**
 * Creates a standardized error response
 * 
 * @param errorCode - Standard API error code
 * @param message - Human-readable error message
 * @param options - Optional error details, field, status override
 * @returns NextResponse with standardized error format
 * 
 * @example
 * return errorResponse(
 *   APIErrorCode.NOT_FOUND,
 *   'Project not found'
 * );
 * 
 * return errorResponse(
 *   APIErrorCode.VALIDATION_ERROR,
 *   'Invalid email format',
 *   { field: 'email', details: { pattern: '/^[...]$/' } }
 * );
 */
export function errorResponse(
  errorCode: APIErrorCode | string,
  message: string,
  options?: {
    details?: unknown;
    field?: string;
    status?: number;
    meta?: Partial<APIResponseMeta>;
  }
): NextResponse<APIResponse<never>> {
  const error: APIError = {
    code: errorCode,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (options?.details !== undefined) {
    error.details = options.details;
  }
  if (options?.field !== undefined) {
    error.field = options.field;
  }

  const response: APIResponse<never> = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  // Determine HTTP status code
  const status = options?.status ?? (
    typeof errorCode === 'string' && errorCode in APIErrorCode
      ? getHTTPStatusForError(errorCode as APIErrorCode)
      : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
  );

  return NextResponse.json(response, { status });
}

/**
 * Wraps an async API handler with standardized error handling
 * Catches unhandled errors and returns proper error responses
 * 
 * @param handler - The async API route handler
 * @returns Wrapped handler with error catching
 * 
 * @example
 * export const GET = withErrorHandling(async (request) => {
 *   const projects = await getProjects();
 *   return successResponse(projects);
 * });
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[API Error]', error);
      
      // If error is already a NextResponse, return it as-is
      if (error instanceof NextResponse) {
        return error;
      }

      // Handle known error types
      if (error instanceof Error) {
        return errorResponse(
          'INTERNAL_ERROR',
          error.message,
          {
            details: process.env.NODE_ENV === 'development' ? {
              stack: error.stack,
              name: error.name,
            } : undefined,
          }
        );
      }

      // Unknown error type
      return errorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred',
        {
          details: process.env.NODE_ENV === 'development' ? error : undefined,
        }
      );
    }
  }) as T;
}

/**
 * Validates required fields in request body
 * Returns error response if validation fails, null if valid
 * 
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Error response or null if valid
 * 
 * @example
 * const validationError = validateRequiredFields(body, ['eventName', 'eventDate']);
 * if (validationError) return validationError;
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse<APIResponse<never>> | null {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return errorResponse(
      'VALIDATION_ERROR',
      `Missing required fields: ${missingFields.join(', ')}`,
      {
        details: { missingFields },
      }
    );
  }

  return null;
}

/**
 * Helper to create a "not found" error response
 * 
 * @param resourceType - Type of resource (e.g., 'Project', 'Hashtag')
 * @param identifier - Optional identifier value
 * @returns Standard not found error response
 * 
 * @example
 * return notFoundResponse('Project', projectId);
 */
export function notFoundResponse(
  resourceType: string,
  identifier?: string
): NextResponse<APIResponse<never>> {
  const message = identifier
    ? `${resourceType} with identifier "${identifier}" not found`
    : `${resourceType} not found`;

  return errorResponse('NOT_FOUND', message);
}

/**
 * Helper to create an unauthorized error response
 * 
 * @param message - Optional custom message
 * @returns Standard unauthorized error response
 */
export function unauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse<APIResponse<never>> {
  return errorResponse('UNAUTHORIZED', message);
}

/**
 * Helper to create a forbidden error response
 * 
 * @param message - Optional custom message
 * @returns Standard forbidden error response
 */
export function forbiddenResponse(
  message: string = 'You do not have permission to perform this action'
): NextResponse<APIResponse<never>> {
  return errorResponse('FORBIDDEN', message);
}
