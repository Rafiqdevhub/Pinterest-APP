import Board from '../models/boardModel.js';
import Pin from '../models/Pin.js';

// @desc    Get all boards for a user
// @route   GET /api/v1/boards/user/:username
// @access  Public
export const getUserBoards = async (req, res) => {
    const { userId } = req.params;

    const boards = await Board.find({ user: userId });
  
    const boardsWithPinDetails = await Promise.all(
      boards.map(async (board) => {
        const pinCount = await Pin.countDocuments({ board: board._id });
        const firstPin = await Pin.findOne({ board: board._id });
  
        return {
          ...board.toObject(),
          pinCount,
          firstPin,
        };
      })
    );
  
    res.status(200).json(boardsWithPinDetails);
};

