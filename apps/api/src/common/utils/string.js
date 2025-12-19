"use strict";
/**
 * String utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.truncate = truncate;
exports.capitalize = capitalize;
exports.titleCase = titleCase;
exports.maskEmail = maskEmail;
exports.randomString = randomString;
exports.isValidEmail = isValidEmail;
exports.isValidUUID = isValidUUID;
/**
 * Convert string to slug (URL-friendly format)
 */
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Truncate string to specified length
 */
function truncate(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
}
/**
 * Capitalize first letter of string
 */
function capitalize(text) {
    if (!text)
        return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
/**
 * Convert string to title case
 */
function titleCase(text) {
    return text
        .split(' ')
        .map((word) => capitalize(word))
        .join(' ');
}
/**
 * Mask sensitive data (e.g., email, phone)
 */
function maskEmail(email) {
    const [localPart, domain] = email.split('@');
    if (!domain)
        return email;
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    const masked = localPart.slice(0, visibleChars) + '***';
    return `${masked}@${domain}`;
}
/**
 * Generate random alphanumeric string
 */
function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Check if string is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Check if string is valid UUID
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
//# sourceMappingURL=string.js.map