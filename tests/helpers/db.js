import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

let server = null;

export async function startTestDB() {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    server = await MongoMemoryServer.create();
    uri = server.getUri();
  }
  const base = uri.replace(/\/[^/]*$/, "");
  process.env.MONGODB_URI = `${base}/aether-test-${process.pid}-${Date.now()}`;
  await connectDB();
}

export async function stopTestDB() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  globalThis._mongoose = { conn: null, promise: null };
  await server?.stop();
}
