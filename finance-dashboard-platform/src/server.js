require("dotenv").config();
const app = require("./app");
const { connectMongo } = require("./config/database");

const PORT = Number(process.env.PORT || 4000);

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Finance Dashboard Platform listening on http://localhost:${PORT}`);
      console.log(`MongoDB connected`);
      console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
