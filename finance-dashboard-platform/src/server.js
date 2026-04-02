require("dotenv").config();
const app = require("./app");
const { runMigrationsIfNeeded } = require("./config/database");

const PORT = Number(process.env.PORT || 4000);

runMigrationsIfNeeded()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Finance Dashboard Platform listening on http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error("Database migration failed:", err);
    process.exit(1);
  });
