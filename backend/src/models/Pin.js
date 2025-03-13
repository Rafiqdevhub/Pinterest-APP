import mongoose from "mongoose";

const PinSchema = new mongoose.Schema(
  {
    media: {
      type: String,
      required: true,
      index: true, // Add index for media searches
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      index: true, // Add index for title searches
    },
    description: {
      type: String,
      required: true,
      index: true, // Add index for description searches
    },
    link: {
      type: String,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      index: true, // Add index for board lookups
    },
    tags: {
      type: [String],
      index: true, // Add index for tag searches
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Add index for user lookups
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add compound indexes for common query patterns
PinSchema.index({ user: 1, createdAt: -1 });
PinSchema.index({ board: 1, createdAt: -1 });
PinSchema.index({ tags: 1, createdAt: -1 });

// Add text index for search functionality
PinSchema.index({ title: "text", description: "text", tags: "text" });

// Add virtual for likes count
PinSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "pin",
  count: true,
});

// Add virtual for comments count
PinSchema.virtual("commentsCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "pin",
  count: true,
});

export default mongoose.model("Pin", PinSchema);
