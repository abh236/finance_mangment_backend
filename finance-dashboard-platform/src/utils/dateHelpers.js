/**
 * Date utility helpers used across services.
 */

/**
 * Returns a Date N months ago from now.
 * @param {number} months
 * @returns {Date}
 */
function monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * Returns a Date N days ago from now.
 * @param {number} days
 * @returns {Date}
 */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Format a Date to YYYY-MM string.
 * @param {Date} date
 * @returns {string}
 */
function toYearMonth(date) {
  return date.toISOString().slice(0, 7);
}

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(Number(val) || min, min), max);
}

module.exports = { monthsAgo, daysAgo, toYearMonth, clamp };
