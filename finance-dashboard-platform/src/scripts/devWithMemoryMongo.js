/**
 * Dev helper when Docker/local MongoDB is not installed.
 * Sets MONGODB_URI before server loads; dotenv does not overwrite existing env vars.
 * Usage: npm run dev:memory
 */
const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  console.log("Starting in-memory MongoDB (mongodb-memory-server)...");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  console.log("MONGODB_URI set for this process.");
  require("../server");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
