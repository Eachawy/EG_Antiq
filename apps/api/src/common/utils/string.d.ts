/**
 * String utility functions
 */
/**
 * Convert string to slug (URL-friendly format)
 */
export declare function slugify(text: string): string;
/**
 * Truncate string to specified length
 */
export declare function truncate(text: string, maxLength: number, suffix?: string): string;
/**
 * Capitalize first letter of string
 */
export declare function capitalize(text: string): string;
/**
 * Convert string to title case
 */
export declare function titleCase(text: string): string;
/**
 * Mask sensitive data (e.g., email, phone)
 */
export declare function maskEmail(email: string): string;
/**
 * Generate random alphanumeric string
 */
export declare function randomString(length: number): string;
/**
 * Check if string is valid email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Check if string is valid UUID
 */
export declare function isValidUUID(uuid: string): boolean;
//# sourceMappingURL=string.d.ts.map