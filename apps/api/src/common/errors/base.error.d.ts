/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly message: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly metadata?: Record<string, any> | undefined;
    constructor(code: string, message: string, statusCode: number, isOperational?: boolean, metadata?: Record<string, any> | undefined);
    toJSON(): {
        code: string;
        message: string;
        statusCode: number;
        metadata: Record<string, any> | undefined;
    };
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends AppError {
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Unauthorized error (401)
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Forbidden error (403)
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string, id: string);
}
/**
 * Conflict error (409)
 */
export declare class ConflictError extends AppError {
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Business logic error (422)
 */
export declare class BusinessError extends AppError {
    constructor(code: string, message: string, metadata?: Record<string, any>);
}
/**
 * Internal server error (500)
 */
export declare class InternalError extends AppError {
    constructor(message?: string, metadata?: Record<string, any>);
}
/**
 * Service unavailable error (503)
 */
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=base.error.d.ts.map