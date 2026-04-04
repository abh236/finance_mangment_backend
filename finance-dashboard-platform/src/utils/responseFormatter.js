/**
 * Standardised JSON response helpers.
 * Keeps controller code thin and response shapes consistent.
 */

const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, ...data });

const created = (res, data = {}) =>
  res.status(201).json({ success: true, ...data });

const noContent = (res) => res.status(204).send();

const fail = (res, status, error, details = null) =>
  res.status(status).json({ success: false, error, ...(details && { details }) });

module.exports = { ok, created, noContent, fail };
