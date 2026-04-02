const HttpError = require("../utils/httpError");

function notFound(_req, res) {
  return res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  return res.status(500).json({ message: "Internal server error" });
}

module.exports = {
  notFound,
  errorHandler,
};
