import Board from '../models/boardModel.js';
import Pin from '../models/Pin.js';
import User from '../models/User.js';

export const getUserBoards = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        const [boards, total] = await Promise.all([
            Board.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username displayName img'),
            Board.countDocuments({ user: userId })
        ]);

        const boardsWithPinDetails = await Promise.all(
            boards.map(async (board) => {
                const [pinCount, firstPin] = await Promise.all([
                    Pin.countDocuments({ board: board._id }),
                    Pin.findOne({ board: board._id })
                        .select('media width height')
                        .lean()
                ]);

                return {
                    ...board.toObject(),
                    pinCount,
                    coverImage: firstPin?.media || null
                };
            })
        );

        res.status(200).json({
            status: 'success',
            results: boardsWithPinDetails.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: boardsWithPinDetails
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching boards',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};


