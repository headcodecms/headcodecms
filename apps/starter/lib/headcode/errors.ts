/**
 * Base error class for Headcode CMS errors.
 */
export class HeadcodeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'HeadcodeError'
  }
}

/**
 * Database-related errors.
 */
export class DatabaseError extends HeadcodeError {
  constructor(message: string) {
    super(message, 'DB_ERROR')
    this.name = 'DatabaseError'
  }
}

/**
 * Authorization-related errors.
 */
export class UnauthorizedError extends HeadcodeError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

/**
 * Not found errors.
 */
export class NotFoundError extends HeadcodeError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`
    super(message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Configuration errors.
 */
export class ConfigurationError extends HeadcodeError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR')
    this.name = 'ConfigurationError'
  }
}

/**
 * Checks if an error is a HeadcodeError and returns the code.
 * Useful for error handling in UI components.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof HeadcodeError) {
    return error.code
  }
  if (error instanceof Error && error.message) {
    // Check for legacy string-based error codes
    if (error.message.startsWith('DB_ERROR')) {
      return 'DB_ERROR'
    }
    if (error.message.startsWith('UNAUTHORIZED')) {
      return 'UNAUTHORIZED'
    }
  }
  return undefined
}

/**
 * Checks if an error is a specific error type.
 */
export function isHeadcodeError(
  error: unknown,
  code?: string,
): error is HeadcodeError {
  if (!(error instanceof HeadcodeError)) {
    return false
  }
  if (code) {
    return error.code === code
  }
  return true
}

