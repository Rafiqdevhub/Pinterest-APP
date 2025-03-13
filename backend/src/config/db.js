import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 100, // Increase connection pool for better concurrency
      minPoolSize: 10, // Maintain minimum connections
      socketTimeoutMS: 45000, // Increase socket timeout
      serverSelectionTimeoutMS: 5000, // Faster failure detection
      heartbeatFrequencyMS: 10000, // More frequent heartbeats
      retryWrites: true,
      w: "majority", // Write concern for data reliability
      readPreference: "primaryPreferred", // Read from primary, fallback to secondary
      readConcern: { level: "local" }, // Faster reads with eventual consistency
    });

    // Enable mongoose query debugging in development
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }

    // Add connection error handlers
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
