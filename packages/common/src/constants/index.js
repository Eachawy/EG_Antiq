"use strict";
/**
 * Application constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = exports.TOKEN_EXPIRY = exports.PASSWORD_REQUIREMENTS = exports.PAGINATION_DEFAULTS = exports.USER_ROLES = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
exports.USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ORG_OWNER: 'ORG_OWNER',
    ORG_ADMIN: 'ORG_ADMIN',
    ORG_MEMBER: 'ORG_MEMBER',
    ORG_VIEWER: 'ORG_VIEWER',
};
exports.PAGINATION_DEFAULTS = {
    LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
};
exports.TOKEN_EXPIRY = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
    PASSWORD_RESET: '1h',
    EMAIL_VERIFICATION: '24h',
};
exports.RATE_LIMITS = {
    AUTH_LOGIN: {
        POINTS: 5,
        DURATION: 900, // 15 minutes
        BLOCK_DURATION: 1800, // 30 minutes
    },
    API_AUTHENTICATED: {
        POINTS: 1000,
        DURATION: 3600, // 1 hour
    },
    API_PUBLIC: {
        POINTS: 100,
        DURATION: 3600,
    },
};
//# sourceMappingURL=index.js.map