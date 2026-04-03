require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Finance Dashboard Platform listening on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`Health:     http://localhost:${PORT}/health`);
});
