import { redis } from "../index.js";
import { RateLimitError } from "./errorHandler.js";

class RateLimiter {
  constructor() {
    this.defaultWindow = 15 * 60; // 15 minutes in seconds
    this.defaultMaxRequests = 100;
  }

  async checkLimit(
    key,
    maxRequests = this.defaultMaxRequests,
    window = this.defaultWindow
  ) {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, window);
    }

    if (current > maxRequests) {
      const ttl = await redis.ttl(key);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${ttl} seconds`
      );
    }

    return true;
  }

  createMiddleware({
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    keyGenerator = (req) => req.ip,
    handler = (req, res) => {
      res.status(429).json({
        status: "error",
        message: "Too many requests, please try again later.",
      });
    },
  } = {}) {
    return async (req, res, next) => {
      try {
        const key = `ratelimit:${keyGenerator(req)}`;
        await this.checkLimit(key, max, windowMs / 1000);
        next();
      } catch (error) {
        if (error instanceof RateLimitError) {
          handler(req, res);
        } else {
          next(error);
        }
      }
    };
  }

  // Different rate limits for different routes/methods
  apiLimiter() {
    return this.createMiddleware({
      windowMs: 15 * 60 * 1000,
      max: 100,
    });
  }

  authLimiter() {
    return this.createMiddleware({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      keyGenerator: (req) => `auth:${req.ip}`,
      handler: (req, res) => {
        res.status(429).json({
          status: "error",
          message: "Too many login attempts, please try again in an hour.",
        });
      },
    });
  }

  createLimiter() {
    return this.createMiddleware({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50,
      keyGenerator: (req) => `create:${req.user._id}`,
    });
  }
}

export default new RateLimiter();
