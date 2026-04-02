const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) =>
  res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Finance Backend</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Finance Dashboard Backend is running</h1>
        <p>Try these endpoints:</p>
        <ul>
          <li><a href="/health">/health</a></li>
          <li>/api/auth/register</li>
          <li>/api/auth/login</li>
          <li>/api/dashboard/summary (requires token)</li>
        </ul>
      </body>
    </html>
  `)
);

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
