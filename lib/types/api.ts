/**
 * API Response Type Definitions
 * 
 * Centralized type definitions for all API responses across the application.
 * Provides consistent structure for success/error states, pagination, and metadata.
 * 
 * WHAT: Standardized API response types and error codes
 * WHY: Ensure consistency across all API endpoints and improve type safety
 */

/**
 * Standard API error codes
 * Used for programmatic error handling on the client
 */
export enum APIErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Custom business logic errors
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_OPERATION = 'INVALID_OPERATION',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
}

/**
 * API error details
 */
export interface APIError {
  code: APIErrorCode | string;
  message: string;
  details?: unknown;
  field?: string; // For validation errors
  timestamp?: string;
}

/**
 * API response metadata
 */
export interface APIResponseMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

/**
 * Base API response structure
 * All API responses should follow this pattern
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIResponseMeta;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  limit: number;
  offset?: number;
  cursor?: string;
  total?: number;
  hasMore: boolean;
  nextOffset?: number;
  nextCursor?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedAPIResponse<T = unknown> extends APIResponse<T> {
  pagination?: PaginationConfig;
}

/**
 * Project data transfer object
 */
export interface ProjectDTO {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [category: string]: string[] };
  styleIdEnhanced?: string | null;
  partner1?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  partner2?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  stats: {
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    remoteFans?: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    eventAttendees?: number;
    [key: string]: number | undefined; // Allow dynamic stats
  };
  viewSlug?: string;
  editSlug?: string;
  createdAt: string;
  updatedAt: string;
  
  // Google Sheets sync fields (v12.0.0)
  googleSheetUuid?: string;
  googleSheetSyncedAt?: string;
  googleSheetModifiedAt?: string;
  googleSheetSource?: 'messmass' | 'sheet' | 'both';
  isSyncedFromSheet?: boolean;
  partnerId?: string;
}

/**
 * Project list response
 */
export interface ProjectListResponse extends PaginatedAPIResponse<ProjectDTO[]> {
  data: ProjectDTO[];
}

/**
 * Single project response
 */
export interface ProjectResponse extends APIResponse<ProjectDTO> {
  data: ProjectDTO;
}

/**
 * Hashtag data transfer object
 */
export interface HashtagDTO {
  hashtag: string;
  count: number;
  color?: string;
}

/**
 * Hashtag list response
 */
export interface HashtagListResponse extends PaginatedAPIResponse<HashtagDTO[]> {
  data: HashtagDTO[];
}

/**
 * Category data transfer object
 */
export interface CategoryDTO {
  _id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category list response
 */
export interface CategoryListResponse extends APIResponse<CategoryDTO[]> {
  data: CategoryDTO[];
}

/**
 * Authentication session response
 */
export interface AuthSessionResponse extends APIResponse<{
  authenticated: boolean;
  user?: {
    email: string;
    role: string;
  };
}> {}

/**
 * Page password validation response
 */
export interface PagePasswordResponse extends APIResponse<{
  valid: boolean;
  token?: string;
}> {}

/**
 * Generic success response (for operations that don't return data)
 */
export interface SuccessResponse extends APIResponse<{ message: string }> {
  success: true;
  data: { message: string };
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: false; error: APIError } {
  return response.success === false && response.error !== undefined;
}

/**
 * HTTP status codes mapping to API error codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Map API error codes to HTTP status codes
 */
export function getHTTPStatusForError(errorCode: APIErrorCode): number {
  switch (errorCode) {
    case APIErrorCode.BAD_REQUEST:
    case APIErrorCode.VALIDATION_ERROR:
      return HTTP_STATUS_CODES.BAD_REQUEST;
    case APIErrorCode.UNAUTHORIZED:
      return HTTP_STATUS_CODES.UNAUTHORIZED;
    case APIErrorCode.FORBIDDEN:
      return HTTP_STATUS_CODES.FORBIDDEN;
    case APIErrorCode.NOT_FOUND:
      return HTTP_STATUS_CODES.NOT_FOUND;
    case APIErrorCode.CONFLICT:
    case APIErrorCode.DUPLICATE_ENTRY:
      return HTTP_STATUS_CODES.CONFLICT;
    case APIErrorCode.INVALID_OPERATION:
    case APIErrorCode.RESOURCE_LIMIT_EXCEEDED:
      return HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;
    case APIErrorCode.DATABASE_ERROR:
    case APIErrorCode.EXTERNAL_SERVICE_ERROR:
    case APIErrorCode.INTERNAL_ERROR:
    default:
      return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
}
