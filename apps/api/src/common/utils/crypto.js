"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.sha256 = sha256;
exports.createSignature = createSignature;
exports.verifySignature = verifySignature;
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
const crypto_1 = require("crypto");
/**
 * Generate a random token
 */
function generateToken(length = 32) {
    return (0, crypto_1.randomBytes)(length).toString('hex');
}
/**
 * Hash a string using SHA-256
 */
function sha256(data) {
    return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
}
/**
 * Create HMAC signature
 */
function createSignature(data, secret) {
    return (0, crypto_1.createHmac)('sha256', secret).update(data).digest('hex');
}
/**
 * Verify HMAC signature
 */
function verifySignature(data, signature, secret) {
    const expected = createSignature(data, secret);
    return timingSafeEqual(signature, expected);
}
/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Encode cursor for pagination
 */
function encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}
/**
 * Decode cursor for pagination
 */
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    }
    catch {
        throw new Error('Invalid cursor');
    }
}
//# sourceMappingURL=crypto.js.map