class HttpError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {any} [details] - Optional validation details or extra context
   */
  constructor(status, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
