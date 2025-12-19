/**
 * Application constants
 */
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const USER_ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ORG_OWNER: "ORG_OWNER";
    readonly ORG_ADMIN: "ORG_ADMIN";
    readonly ORG_MEMBER: "ORG_MEMBER";
    readonly ORG_VIEWER: "ORG_VIEWER";
};
export declare const PAGINATION_DEFAULTS: {
    readonly LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const PASSWORD_REQUIREMENTS: {
    readonly MIN_LENGTH: 8;
    readonly MAX_LENGTH: 128;
    readonly REQUIRE_UPPERCASE: true;
    readonly REQUIRE_LOWERCASE: true;
    readonly REQUIRE_NUMBER: true;
    readonly REQUIRE_SPECIAL: false;
};
export declare const TOKEN_EXPIRY: {
    readonly ACCESS_TOKEN: "15m";
    readonly REFRESH_TOKEN: "7d";
    readonly PASSWORD_RESET: "1h";
    readonly EMAIL_VERIFICATION: "24h";
};
export declare const RATE_LIMITS: {
    readonly AUTH_LOGIN: {
        readonly POINTS: 5;
        readonly DURATION: 900;
        readonly BLOCK_DURATION: 1800;
    };
    readonly API_AUTHENTICATED: {
        readonly POINTS: 1000;
        readonly DURATION: 3600;
    };
    readonly API_PUBLIC: {
        readonly POINTS: 100;
        readonly DURATION: 3600;
    };
};
//# sourceMappingURL=index.d.ts.map