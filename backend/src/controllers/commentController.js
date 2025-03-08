import Comment from '../models/commentModel.js';
import Pin from '../models/Pin.js';

export const getPostComments = async (req, res) => {
    try {
        const { pinId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const pinExists = await Pin.exists({ _id: pinId });
        if (!pinExists) {
            return res.status(404).json({
                status: 'fail',
                message: 'Pin not found'
            });
        }

        const [comments, total] = await Promise.all([
            Comment.find({ pin: pinId })
                .populate('user', 'username img displayName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments({ pin: pinId })
        ]);

        res.status(200).json({
            status: 'success',
            results: comments.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: comments
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching comments',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const addComment = async (req, res) => {
    try {
        const { pinId } = req.params;
        const { description } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Comment text is required'
            });
        }

        if (description.length > 500) {
            return res.status(400).json({
                status: 'fail',
                message: 'Comment cannot exceed 500 characters'
            });
        }

        const pinExists = await Pin.exists({ _id: pinId });
        if (!pinExists) {
            return res.status(404).json({
                status: 'fail',
                message: 'Pin not found'
            });
        }

        const newComment = await Comment.create({
            description: description.trim(),
            pin: pinId,
            user: req.user._id
        });

        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'username img displayName');

        res.status(201).json({
            status: 'success',
            data: populatedComment
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Error adding comment',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};