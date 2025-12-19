/**
 * Pagination request parameters
 */
export interface PaginationParams {
    limit?: number;
    cursor?: string;
}
/**
 * Pagination response metadata
 */
export interface PaginationMeta {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
}
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    data: T;
    meta?: {
        timestamp: string;
        correlationId?: string;
        [key: string]: any;
    };
}
/**
 * Standard error response
 */
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
    };
    meta: {
        timestamp: string;
        correlationId?: string;
    };
}
/**
 * Generic list response
 */
export interface ListResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
/**
 * Request context (from AsyncLocalStorage)
 */
export interface RequestContext {
    correlationId: string;
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Audit metadata
 */
export interface AuditMetadata {
    userId: string;
    tenantId: string;
    action: string;
    resource: string;
    resourceId: string;
    timestamp: Date;
    ipAddress: string;
    correlationId: string;
}
//# sourceMappingURL=index.d.ts.map