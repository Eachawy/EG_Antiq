"use strict";
/**
 * Date utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDays = addDays;
exports.addHours = addHours;
exports.addMinutes = addMinutes;
exports.isPast = isPast;
exports.isFuture = isFuture;
exports.toISOString = toISOString;
exports.fromISOString = fromISOString;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
/**
 * Add days to a date
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
/**
 * Add hours to a date
 */
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
/**
 * Add minutes to a date
 */
function addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}
/**
 * Check if a date is in the past
 */
function isPast(date) {
    return date.getTime() < Date.now();
}
/**
 * Check if a date is in the future
 */
function isFuture(date) {
    return date.getTime() > Date.now();
}
/**
 * Format date to ISO string
 */
function toISOString(date) {
    return date.toISOString();
}
/**
 * Parse ISO string to date
 */
function fromISOString(iso) {
    return new Date(iso);
}
/**
 * Get start of day
 */
function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
/**
 * Get end of day
 */
function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
//# sourceMappingURL=date.js.map