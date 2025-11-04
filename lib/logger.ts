// lib/logger.ts
// WHAT: Centralized structured logging system for MessMass
// WHY: Consistent logging format enables effective monitoring, debugging, and audit trails
// HOW: Structured JSON logs with severity levels, context tracking, and external service integration

// WHAT: Log severity levels (RFC 5424 compatible)
// WHY: Standard levels enable filtering and alert routing
export enum LogLevel {
  DEBUG = 0,    // Detailed information for diagnosing problems
  INFO = 1,     // Informational messages (normal operation)
  WARN = 2,     // Warning messages (potential issues)
  ERROR = 3,    // Error messages (failures that need attention)
  FATAL = 4,    // Critical errors (system failure, immediate action required)
}

// WHAT: Log entry structure
// WHY: Consistent format enables parsing by external services (Datadog, CloudWatch, etc.)
interface LogEntry {
  timestamp: string;        // ISO 8601 with milliseconds
  level: string;            // DEBUG, INFO, WARN, ERROR, FATAL
  message: string;          // Human-readable message
  context?: LogContext;     // Additional structured data
  error?: ErrorDetails;     // Error information if applicable
  requestId?: string;       // Request correlation ID
  userId?: string;          // User ID if authenticated
  ip?: string;              // Client IP address
  pathname?: string;        // Request pathname
  method?: string;          // HTTP method
  duration?: number;        // Request duration in ms
  tags?: string[];          // Searchable tags
}

// WHAT: Contextual information for log entries
interface LogContext {
  [key: string]: unknown;   // Flexible key-value pairs
}

// WHAT: Error details for structured error logging
interface ErrorDetails {
  name: string;             // Error type (TypeError, ValidationError, etc.)
  message: string;          // Error message
  stack?: string;           // Stack trace (redacted in production)
  code?: string;            // Error code (custom application codes)
}

// WHAT: Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;                    // Minimum level to log
  enableConsole: boolean;                // Output to console
  enableFile: boolean;                   // Output to file (future)
  enableExternal: boolean;               // Send to external service (future)
  redactSensitiveData: boolean;          // Redact passwords, tokens, etc.
  includeStackTrace: boolean;            // Include stack traces in error logs
}

// WHAT: Default logger configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,        // TODO: Implement file logging
  enableExternal: false,    // TODO: Implement Datadog/CloudWatch integration
  redactSensitiveData: true,
  includeStackTrace: process.env.NODE_ENV !== 'production',
};

// WHAT: Current logger configuration (mutable)
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

// WHAT: Set logger configuration
// WHY: Allow runtime configuration changes
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

// WHAT: Get current logger configuration
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

// WHAT: Sensitive data patterns to redact
// WHY: Prevent accidental logging of passwords, tokens, credit cards
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
];

// WHAT: Redact sensitive data from object
// WHY: Prevent credential leakage in logs
function redactSensitiveData(obj: unknown): unknown {
  if (!currentConfig.redactSensitiveData) {
    return obj;
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }
  
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

// WHAT: Format error for logging
// WHY: Extract useful information from Error objects
function formatError(error: Error): ErrorDetails {
  return {
    name: error.name,
    message: error.message,
    stack: currentConfig.includeStackTrace ? error.stack : undefined,
    code: (error as any).code, // Some errors have custom codes
  };
}

// WHAT: Core logging function
// WHY: Single function handles all log output routing
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  // WHAT: Skip if below minimum log level
  if (level < currentConfig.minLevel) {
    return;
  }
  
  // WHAT: Build log entry
  const entry: LogEntry = {
    timestamp: new Date().toISOString(), // ISO 8601 with milliseconds
    level: LogLevel[level],
    message,
    context: context ? (redactSensitiveData(context) as LogContext) : undefined,
    error: error ? formatError(error) : undefined,
  };
  
  // WHAT: Output to console (development and production)
  if (currentConfig.enableConsole) {
    const logFn = level >= LogLevel.ERROR ? console.error : console.log;
    
    // WHAT: Pretty print in development, JSON in production
    if (process.env.NODE_ENV !== 'production') {
      const levelColors = {
        [LogLevel.DEBUG]: '\x1b[36m',   // Cyan
        [LogLevel.INFO]: '\x1b[32m',    // Green
        [LogLevel.WARN]: '\x1b[33m',    // Yellow
        [LogLevel.ERROR]: '\x1b[31m',   // Red
        [LogLevel.FATAL]: '\x1b[35m',   // Magenta
      };
      const reset = '\x1b[0m';
      const color = levelColors[level] || '';
      
      logFn(`${color}[${entry.level}]${reset} ${entry.timestamp} - ${message}`);
      if (context) {
        logFn('Context:', context);
      }
      if (error) {
        logFn('Error:', error);
      }
    } else {
      // WHAT: Structured JSON for production (parseable by log aggregators)
      logFn(JSON.stringify(entry));
    }
  }
  
  // WHAT: TODO: Write to file (log rotation)
  if (currentConfig.enableFile) {
    // Implement file logging with rotation
    // Libraries: winston, pino, bunyan
  }
  
  // WHAT: TODO: Send to external service
  if (currentConfig.enableExternal) {
    // Implement integration with:
    // - Datadog: https://docs.datadoghq.com/logs/
    // - CloudWatch: https://docs.aws.amazon.com/cloudwatch/
    // - New Relic: https://docs.newrelic.com/docs/logs/
  }
}

// WHAT: Public logging API (level-specific functions)
// WHY: Convenient, type-safe logging interface

export function debug(message: string, context?: LogContext): void {
  log(LogLevel.DEBUG, message, context);
}

export function info(message: string, context?: LogContext): void {
  log(LogLevel.INFO, message, context);
}

export function warn(message: string, context?: LogContext, error?: Error): void {
  log(LogLevel.WARN, message, context, error);
}

export function error(message: string, context?: LogContext, err?: Error): void {
  log(LogLevel.ERROR, message, context, err);
}

export function fatal(message: string, context?: LogContext, err?: Error): void {
  log(LogLevel.FATAL, message, context, err);
}

// WHAT: Request logging utilities
// WHY: Standardized API request logging with performance tracking

export interface RequestLogContext {
  [key: string]: unknown;  // Make it compatible with LogContext
  method: string;
  pathname: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  requestId?: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export function logRequest(message: string, context: RequestLogContext): void {
  info(message, {
    ...context,
    tags: ['request'],
  });
}

export function logRequestStart(context: RequestLogContext): number {
  debug(`Request started: ${context.method} ${context.pathname}`, context);
  return Date.now(); // Return start time for duration tracking
}

export function logRequestEnd(
  startTime: number,
  context: RequestLogContext,
  statusCode?: number
): void {
  const duration = Date.now() - startTime;
  
  info(`Request completed: ${context.method} ${context.pathname}`, {
    ...context,
    statusCode,
    duration,
    tags: ['request', 'performance'],
  });
}

export function logRequestError(
  context: RequestLogContext,
  err: Error,
  statusCode?: number
): void {
  error(`Request failed: ${context.method} ${context.pathname}`, {
    ...context,
    statusCode,
    tags: ['request', 'error'],
  }, err);
}

// WHAT: Security event logging
// WHY: Track authentication, authorization, and suspicious activity

export function logAuthSuccess(userId: string, ip?: string): void {
  info('Authentication successful', {
    userId,
    ip,
    tags: ['auth', 'security'],
  });
}

export function logAuthFailure(email: string, reason: string, ip?: string): void {
  warn('Authentication failed', {
    email,
    reason,
    ip,
    tags: ['auth', 'security', 'failure'],
  });
}

export function logAuthorizationDenied(userId: string, resource: string, action: string): void {
  warn('Authorization denied', {
    userId,
    resource,
    action,
    tags: ['authorization', 'security', 'denied'],
  });
}

export function logSuspiciousActivity(description: string, context: LogContext): void {
  warn('Suspicious activity detected', {
    ...context,
    description,
    tags: ['security', 'suspicious'],
  });
}

export function logRateLimitExceeded(ip: string, pathname: string, limit: number): void {
  warn('Rate limit exceeded', {
    ip,
    pathname,
    limit,
    tags: ['rate-limit', 'security'],
  });
}

export function logCsrfViolation(ip: string, pathname: string): void {
  warn('CSRF token validation failed', {
    ip,
    pathname,
    tags: ['csrf', 'security'],
  });
}

// WHAT: Database operation logging
// WHY: Track slow queries and connection issues

export function logDatabaseQuery(
  operation: string,
  collection: string,
  duration: number,
  recordCount?: number
): void {
  const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
  
  log(level, `Database ${operation}`, {
    operation,
    collection,
    duration,
    recordCount,
    tags: ['database', 'performance'],
  });
}

export function logDatabaseError(operation: string, collection: string, err: Error): void {
  error(`Database ${operation} failed`, {
    operation,
    collection,
    tags: ['database', 'error'],
  }, err);
}

// WHAT: Application lifecycle logging
// WHY: Track startup, shutdown, and configuration changes

export function logAppStart(version: string, environment: string): void {
  // WHAT: Log application startup without Node.js version
  // WHY: Edge Runtime doesn't support process.version API
  info('Application starting', {
    version,
    environment,
    tags: ['lifecycle', 'startup'],
  });
}

export function logAppReady(port?: number): void {
  info('Application ready', {
    port,
    tags: ['lifecycle', 'ready'],
  });
}

export function logAppShutdown(reason: string): void {
  info('Application shutting down', {
    reason,
    tags: ['lifecycle', 'shutdown'],
  });
}

export function logConfigChange(key: string, oldValue: unknown, newValue: unknown): void {
  info('Configuration changed', {
    key,
    oldValue: redactSensitiveData(oldValue),
    newValue: redactSensitiveData(newValue),
    tags: ['config', 'change'],
  });
}

// WHAT: Export for external monitoring integration
// WHY: Allow external services to query log statistics
export function getLogStatistics(): {
  totalLogs: number;
  byLevel: Record<string, number>;
} {
  // TODO: Implement log statistics tracking
  return {
    totalLogs: 0,
    byLevel: {},
  };
}
