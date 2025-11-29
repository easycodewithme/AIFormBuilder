import mongoose from "mongoose";
import { config } from "./env";

export async function connectToDatabase() {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(config.mongoUri, {
    dbName: config.mongoDbName,
  });
}
