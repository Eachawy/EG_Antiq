"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.InternalError = exports.BusinessError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class.
 * All custom errors should extend this class.
 */
class AppError extends Error {
    code;
    message;
    statusCode;
    isOperational;
    metadata;
    constructor(code, message, statusCode, isOperational = true, metadata) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.metadata = metadata;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            metadata: this.metadata,
        };
    }
}
exports.AppError = AppError;
/**
 * Validation error (400)
 */
class ValidationError extends AppError {
    constructor(message, metadata) {
        super('VALIDATION_ERROR', message, 400, true, metadata);
    }
}
exports.ValidationError = ValidationError;
/**
 * Unauthorized error (401)
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super('UNAUTHORIZED', message, 401, true);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden error (403)
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super('FORBIDDEN', message, 403, true);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
    constructor(resource, id) {
        super('NOT_FOUND', `${resource} with id ${id} not found`, 404, true, { resource, id });
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
    constructor(message, metadata) {
        super('CONFLICT', message, 409, true, metadata);
    }
}
exports.ConflictError = ConflictError;
/**
 * Business logic error (422)
 */
class BusinessError extends AppError {
    constructor(code, message, metadata) {
        super(code, message, 422, true, metadata);
    }
}
exports.BusinessError = BusinessError;
/**
 * Internal server error (500)
 */
class InternalError extends AppError {
    constructor(message = 'Internal server error', metadata) {
        super('INTERNAL_ERROR', message, 500, false, metadata);
    }
}
exports.InternalError = InternalError;
/**
 * Service unavailable error (503)
 */
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super('SERVICE_UNAVAILABLE', message, 503, true);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=base.error.js.map