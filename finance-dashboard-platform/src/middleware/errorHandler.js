function notFound(_req, res) {
  return res.status(404).json({ success: false, error: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack || err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
