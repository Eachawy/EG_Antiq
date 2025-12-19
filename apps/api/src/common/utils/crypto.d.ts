/**
 * Generate a random token
 */
export declare function generateToken(length?: number): string;
/**
 * Hash a string using SHA-256
 */
export declare function sha256(data: string): string;
/**
 * Create HMAC signature
 */
export declare function createSignature(data: string, secret: string): string;
/**
 * Verify HMAC signature
 */
export declare function verifySignature(data: string, signature: string, secret: string): boolean;
/**
 * Encode cursor for pagination
 */
export declare function encodeCursor(data: Record<string, any>): string;
/**
 * Decode cursor for pagination
 */
export declare function decodeCursor(cursor: string): Record<string, any>;
//# sourceMappingURL=crypto.d.ts.map