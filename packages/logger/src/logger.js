"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
exports.addCorrelationId = addCorrelationId;
const winston_1 = __importDefault(require("winston"));
const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';
// Custom format for structured logging (production)
const structuredFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Pretty format for development
const prettyFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss.SSS' }), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: nodeEnv === 'production' ? structuredFormat : prettyFormat,
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'api',
        environment: nodeEnv,
        version: process.env.APP_VERSION || 'unknown',
    },
    transports: [
        new winston_1.default.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
    exceptionHandlers: [new winston_1.default.transports.Console()],
    rejectionHandlers: [new winston_1.default.transports.Console()],
    exitOnError: false,
});
/**
 * Create a child logger with additional context
 */
function createLogger(context) {
    return exports.logger.child(context);
}
/**
 * Add correlation ID to logger context
 */
function addCorrelationId(correlationId) {
    return exports.logger.child({ correlationId });
}
//# sourceMappingURL=logger.js.map