import { redis } from "../index.js";
import { CacheError } from "./errorHandler.js";

class CacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw new CacheError(`Error getting cache: ${error.message}`);
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const stringValue = JSON.stringify(value);
      await redis.setex(key, ttl, stringValue);
    } catch (error) {
      throw new CacheError(`Error setting cache: ${error.message}`);
    }
  }

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      throw new CacheError(`Error deleting cache: ${error.message}`);
    }
  }

  async delByPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      throw new CacheError(`Error deleting cache pattern: ${error.message}`);
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(keyPrefix, ttl) {
    return async (req, res, next) => {
      try {
        const key = `${keyPrefix}:${req.originalUrl}`;
        const cachedData = await this.get(key);

        if (cachedData) {
          return res.json(cachedData);
        }

        // Store original send function
        const originalSend = res.json;

        // Override res.json to cache the response
        res.json = function (body) {
          this.service.set(key, body, ttl);
          return originalSend.call(this, body);
        }.bind({ service: this });

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Method for handling batch operations
  async mget(keys) {
    try {
      const values = await redis.mget(keys);
      return values.map((val) => (val ? JSON.parse(val) : null));
    } catch (error) {
      throw new CacheError(`Error batch getting cache: ${error.message}`);
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const multi = redis.multi();
      keyValuePairs.forEach(([key, value]) => {
        multi.setex(key, ttl, JSON.stringify(value));
      });
      await multi.exec();
    } catch (error) {
      throw new CacheError(`Error batch setting cache: ${error.message}`);
    }
  }
}

export default new CacheService();
