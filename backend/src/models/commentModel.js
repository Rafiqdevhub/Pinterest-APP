import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      index: "text", // Add text index for search
    },
    pin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      required: true,
      index: true, // Add index for pin lookups
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
    // Add index on timestamps for sorting
    index: { createdAt: -1 },
  }
);

// Add compound indexes for common query patterns
commentSchema.index({ pin: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Add method to sanitize comment text
commentSchema.methods.sanitize = function () {
  return {
    id: this._id,
    description: this.description.trim(),
    pin: this.pin,
    user: this.user,
    createdAt: this.createdAt,
  };
};

// Add static method for bulk operations
commentSchema.statics.bulkUpsert = async function (comments) {
  const ops = comments.map((comment) => ({
    updateOne: {
      filter: { _id: comment._id },
      update: { $set: comment },
      upsert: true,
    },
  }));
  return this.bulkWrite(ops);
};

export default mongoose.model("Comment", commentSchema);
