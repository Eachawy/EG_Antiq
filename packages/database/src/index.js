"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@packages/logger");
// Create Prisma client instance
exports.prisma = new client_1.PrismaClient({
    log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
    ],
});
// Log warnings
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma warning', { message: e.message });
});
// Log errors
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma error', { message: e.message });
});
// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$on('query', (e) => {
        if (e.duration > 1000) {
            // Log queries taking longer than 1 second
            logger_1.logger.warn('Slow query detected', {
                query: e.query,
                duration: e.duration,
                params: e.params,
            });
        }
    });
}
// Graceful shutdown
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Prisma disconnected');
}
process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);
// Export Prisma types
__exportStar(require("@prisma/client"), exports);
//# sourceMappingURL=index.js.map