import ImageKit from "imagekit";
import sharp from "sharp";
import { promisify } from "util";
import { pipeline } from "stream";
import cacheService from "./cacheService.js"; // Changed to import default export

const pipelineAsync = promisify(pipeline);

class ImageService {
  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IK_PUBLIC_KEY,
      privateKey: process.env.IK_PRIVATE_KEY,
      urlEndpoint: process.env.IK_URL_ENDPOINT,
    });

    this.defaultTransforms = {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 800, height: 800 },
      large: { width: 1600, height: 1600 },
    };
  }

  async optimizeImage(buffer) {
    try {
      // Analyze image metadata
      const metadata = await sharp(buffer).metadata();

      // Determine optimal format
      const format = this.getOptimalFormat(metadata.format);

      // Process image
      return await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .toFormat(format, {
          quality: 80,
          progressive: true,
          optimizeScans: true,
        })
        .toBuffer();
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  getOptimalFormat(originalFormat) {
    // Prefer WebP for web optimization, fallback to original format
    return originalFormat === "jpeg" || originalFormat === "png"
      ? "webp"
      : originalFormat;
  }

  async uploadImage(file, folder = "pinterest") {
    try {
      // Optimize image before upload
      const optimizedBuffer = await this.optimizeImage(file.buffer);

      // Upload original optimized version
      const uploadResponse = await this.imagekit.upload({
        file: optimizedBuffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder: folder,
      });

      // Generate and cache different sizes
      const variants = await this.generateVariants(
        optimizedBuffer,
        uploadResponse.fileId
      );

      return {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        variants,
      };
    } catch (error) {
      throw new Error("Error uploading image: " + error.message);
    }
  }

  async generateVariants(buffer, fileId) {
    const variants = {};

    for (const [size, dimensions] of Object.entries(this.defaultTransforms)) {
      try {
        const resizedBuffer = await sharp(buffer)
          .resize(dimensions.width, dimensions.height, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toBuffer();

        const cacheKey = `image:${fileId}:${size}`;
        await cacheService.set(cacheKey, resizedBuffer, 86400); // Cache for 24 hours

        variants[size] = {
          width: dimensions.width,
          height: dimensions.height,
          cacheKey,
        };
      } catch (error) {
        console.error(`Error generating ${size} variant:`, error);
      }
    }

    return variants;
  }

  async getVariant(fileId, size) {
    const cacheKey = `image:${fileId}:${size}`;
    return await cacheService.get(cacheKey);
  }

  async deleteImage(fileId) {
    try {
      await this.imagekit.deleteFile(fileId);
      // Clean up cached variants
      await cacheService.delByPattern(`image:${fileId}:*`);
    } catch (error) {
      throw new Error("Error deleting image: " + error.message);
    }
  }
}

export default new ImageService();
