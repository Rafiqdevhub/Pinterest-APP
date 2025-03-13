import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import Redis from "ioredis";
import compression from "compression";
import cluster from "cluster";
import os from "os";
import connectDB from "./config/db.js";
import pinRoutes from "./routes/pins.js";
import userRoutes from "./routes/users.js";
import boardRoutes from "./routes/boards.js";
import commentRoutes from "./routes/comments.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import rateLimiter from "./utils/rateLimiter.js";

dotenv.config();

const numCPUs = os.cpus().length;

// Initialize Redis with connection pool - declared outside block scope
let redis;
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
    connectionName: `worker-${process.pid}`,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log("Could not connect to Redis. Running without cache...");
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });
} catch (err) {
  console.error("Redis initialization error:", err);
  // Create a mock redis instance that does nothing
  redis = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    setex: () => Promise.resolve(),
    quit: () => Promise.resolve(),
  };
}

// Export redis instance
export { redis };

if (cluster.isPrimary && process.env.NODE_ENV === "production") {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  const app = express();
  const port = process.env.PORT || 5000;

  // Add compression with optimal settings
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Balanced setting between speed and compression
      memLevel: 8, // Maximum memory for compression
    })
  );

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production",
      crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
    })
  );
  app.use(mongoSanitize());
  app.use(hpp());

  // CORS with preflight
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : "http://localhost:5173",
      credentials: true,
      maxAge: 86400, // Cache CORS preflight for 24 hours
    })
  );

  // Rate limiting
  app.use("/api", rateLimiter.apiLimiter());
  app.use("/api/v1/users/login", rateLimiter.authLimiter());
  app.use("/api/v1/users/register", rateLimiter.authLimiter());
  app.use("/api/v1/pins", rateLimiter.createLimiter());

  // Body parsing with optimized limits
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(cookieParser());

  // Optimized file upload settings
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1, // Limit to one file per request
      },
      abortOnLimit: true,
      safeFileNames: true,
      preserveExtension: true,
    })
  );

  // Logging only in development
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // API routes
  app.use("/api/v1/pins", pinRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/boards", boardRoutes);
  app.use("/api/v1/comments", commentRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log(`Worker ${process.pid} received shutdown signal`);

    // Close Redis connection
    await redis.quit();

    // Close MongoDB connection
    await mongoose.connection.close();

    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    gracefulShutdown();
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown();
  });

  app.listen(port, () => {
    connectDB();
    console.log(
      `Worker ${process.pid} running in ${process.env.NODE_ENV} mode on port ${port}`
    );
  });
}
