require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const openapi = require("./docs/openapi.spec");
const { apiLimiter } = require("./middleware/rateLimiters");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", apiLimiter);

app.get("/", (_req, res) =>
  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"/><title>Finance API</title></head>
  <body style="font-family:system-ui;padding:24px">
  <h1>Finance Dashboard Platform</h1>
  <p>API is running. Open <a href="/api/docs">/api/docs</a> for Swagger UI.</p>
  <p>Health: <a href="/health">/health</a></p>
  </body></html>`)
);

app.get("/health", (_req, res) => res.json({ ok: true, service: "finance-dashboard-platform" }));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/records", require("./routes/records"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
