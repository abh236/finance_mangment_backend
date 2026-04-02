/**
 * Run: node src/scripts/seedAdmin.js (from finance-dashboard-platform, with .env loaded)
 * Or: npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectMongo } = require("../config/database");
const { User } = require("../models/User");

async function run() {
  await connectMongo();
  const email = "admin@example.com";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }
  const password = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin",
    email,
    password,
    role: "admin",
    status: "active",
  });
  console.log("Created admin:", email, "/ admin123");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
