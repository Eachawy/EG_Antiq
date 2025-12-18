import winston from 'winston';
export declare const logger: winston.Logger;
/**
 * Create a child logger with additional context
 */
export declare function createLogger(context: Record<string, any>): winston.Logger;
/**
 * Add correlation ID to logger context
 */
export declare function addCorrelationId(correlationId: string): winston.Logger;
export type Logger = winston.Logger;
//# sourceMappingURL=logger.d.ts.map