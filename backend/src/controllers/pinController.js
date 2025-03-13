import Pin from "../models/Pin.js";
import Like from "../models/likeModel.js";
import Save from "../models/saveModel.js";
import imageService from "../utils/imageKit.js";
import { redis } from "../index.js";

// Cache middleware
const cachePin = async (id) => {
  const cachedPin = await redis.get(`pin:${id}`);
  if (cachedPin) return JSON.parse(cachedPin);
  return null;
};

const setPinCache = async (id, data) => {
  await redis.setex(`pin:${id}`, 3600, JSON.stringify(data)); // Cache for 1 hour
};

export const getAllPins = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // Create cache key based on query parameters
    const cacheKey = `pins:${JSON.stringify(req.query)}`;
    try {
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return res.status(200).json(JSON.parse(cachedResult));
      }
    } catch (cacheError) {
      console.error("Redis cache error:", cacheError);
      // Continue without cache
    }

    // Optimize query with lean() for better performance
    const query = Pin.find()
      .select("media width height title description user")
      .populate("user", "username img displayName")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    // Execute query and count in parallel
    const [pins, total] = await Promise.all([query, Pin.countDocuments({})]);

    const result = {
      status: "success",
      results: pins.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: pins,
    };

    // Cache the result
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(result)); // Cache for 5 minutes
    } catch (cacheError) {
      console.error("Redis cache error:", cacheError);
      // Continue without cache
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching pins",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getPin = async (req, res) => {
  try {
    // Check cache first
    const cachedPin = await cachePin(req.params.id);
    if (cachedPin) {
      return res.status(200).json({
        status: "success",
        data: cachedPin,
      });
    }

    const pin = await Pin.findById(req.params.id)
      .populate("user", "username img displayName")
      .lean();

    if (!pin) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    await setPinCache(req.params.id, pin);

    res.status(200).json({
      status: "success",
      data: pin,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching pin",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const createPin = async (req, res) => {
  try {
    if (!req.files || !req.files.media) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide an image file",
      });
    }

    const file = req.files.media;

    // Upload image to ImageKit using the imageService
    try {
      const uploadedImage = await imageService.uploadImage(file);

      // Create new pin with uploaded image details
      const newPin = await Pin.create({
        media: uploadedImage.url,
        width: uploadedImage.width,
        height: uploadedImage.height,
        title: req.body.title,
        description: req.body.description,
        link: req.body.link,
        board: req.body.board || null,
        tags: req.body.tags
          ? req.body.tags.split(",").map((tag) => tag.trim())
          : [],
        user: req.user._id,
      });

      res.status(201).json({
        status: "success",
        data: newPin,
      });
    } catch (uploadError) {
      return res.status(400).json({
        status: "fail",
        message: "Error uploading image: " + uploadError.message,
      });
    }
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Error creating pin",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// @desc    Save/Unsave pin
// @route   POST /api/v1/pins/:id/save
// @access  Private
export const toggleSavePin = async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    const isSaved = pin.saves.includes(req.user._id);
    const update = isSaved
      ? { $pull: { saves: req.user._id } }
      : { $addToSet: { saves: req.user._id } };

    const updatedPin = await Pin.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    res.status(200).json({
      status: "success",
      data: updatedPin,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Error updating pin",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// @desc    Add comment to pin
// @route   POST /api/v1/pins/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    const comment = {
      text: req.body.text,
      createdBy: req.user._id,
    };

    pin.comments.push(comment);
    await pin.save();

    const populatedPin = await Pin.findById(pin._id).populate(
      "comments.createdBy",
      "username img displayName"
    );

    res.status(200).json({
      status: "success",
      data: populatedPin,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Error adding comment",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Bulk operations for better performance
export const checkInteractions = async (req, res) => {
  try {
    const pinId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      return res.json({
        isLiked: false,
        isSaved: false,
        likeCount: 0,
      });
    }

    const cacheKey = `interactions:${pinId}:${userId}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Use aggregation for better performance
    const [likeData, saveData] = await Promise.all([
      Like.aggregate([
        { $match: { pin: pinId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            isLiked: {
              $sum: {
                $cond: [{ $eq: ["$user", userId] }, 1, 0],
              },
            },
          },
        },
      ]),
      Save.exists({ pin: pinId, user: userId }),
    ]);

    const result = {
      isLiked: likeData[0]?.isLiked > 0 || false,
      isSaved: !!saveData,
      likeCount: likeData[0]?.count || 0,
    };

    // Cache the result
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error checking interactions",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const pinId = req.params.id;
    const userId = req.user._id;

    const pin = await Pin.findById(pinId);
    if (!pin) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    const existingLike = await Like.findOne({ pin: pinId, user: userId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
    } else {
      await Like.create({ pin: pinId, user: userId });
    }

    res.status(200).json({
      status: "success",
      message: existingLike ? "Like removed" : "Pin liked",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error toggling like",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
