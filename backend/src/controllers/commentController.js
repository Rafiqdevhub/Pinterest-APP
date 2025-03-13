import Comment from "../models/commentModel.js";
import Pin from "../models/Pin.js";
import { redis } from "../index.js";

export const getPostComments = async (req, res) => {
  try {
    const { pinId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check cache
    const cacheKey = `comments:${pinId}:${page}:${limit}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Verify pin exists using lean() for better performance
    const pinExists = await Pin.exists({ _id: pinId }).lean();
    if (!pinExists) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    // Use aggregation pipeline for better performance
    const [comments, total] = await Promise.all([
      Comment.aggregate([
        { $match: { pin: pinId } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            pipeline: [{ $project: { username: 1, img: 1, displayName: 1 } }],
            as: "user",
          },
        },
        { $unwind: "$user" },
      ]),
      Comment.countDocuments({ pin: pinId }),
    ]);

    const result = {
      status: "success",
      results: comments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: comments,
    };

    // Cache results for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching comments",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { pinId } = req.params;
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Comment text is required",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        status: "fail",
        message: "Comment cannot exceed 500 characters",
      });
    }

    // Verify pin exists using lean()
    const pinExists = await Pin.exists({ _id: pinId }).lean();
    if (!pinExists) {
      return res.status(404).json({
        status: "fail",
        message: "Pin not found",
      });
    }

    // Create comment and populate in one operation
    const newComment = await Comment.create({
      description: description.trim(),
      pin: pinId,
      user: req.user._id,
    });

    const populatedComment = await Comment.aggregate([
      { $match: { _id: newComment._id } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [{ $project: { username: 1, img: 1, displayName: 1 } }],
          as: "user",
        },
      },
      { $unwind: "$user" },
    ]);

    // Invalidate relevant caches
    const cachePattern = `comments:${pinId}:*`;
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }

    res.status(201).json({
      status: "success",
      data: populatedComment[0],
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error adding comment",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
