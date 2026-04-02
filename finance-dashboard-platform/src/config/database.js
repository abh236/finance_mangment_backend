const mongoose = require("mongoose");

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to finance-dashboard-platform/.env");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, mongoose, isConnected };
