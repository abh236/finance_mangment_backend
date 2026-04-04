require("dotenv").config();
const app = require("./app");
const { connectMongo } = require("./config/database");

const PORT = Number(process.env.PORT || 4000);

// Eager connect on local — fail fast if DB is unreachable
connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log("─────────────────────────────────────────");
      console.log(`  Finance Dashboard Platform`);
      console.log(`  Local:   http://localhost:${PORT}`);
      console.log(`  Docs:    http://localhost:${PORT}/api/docs`);
      console.log(`  Health:  http://localhost:${PORT}/health`);
      console.log("─────────────────────────────────────────");
    });
  })
  .catch((err) => {
    console.error("─────────────────────────────────────────");
    console.error("  MongoDB connection failed:", err.message);
    console.error("  Check MONGODB_URI in finance-dashboard-platform/.env");
    console.error("  Or run: npm run dev:memory --prefix finance-dashboard-platform");
    console.error("─────────────────────────────────────────");
    process.exit(1);
  });
