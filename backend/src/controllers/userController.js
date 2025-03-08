import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Follow from "../models/followModel.js";
import Pin from "../models/Pin.js";

export const registerUser = async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;

    const userExists = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username })
    ]);

    if (userExists[0]) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already registered'
      });
    }

    if (userExists[1]) {
      return res.status(400).json({
        status: 'fail',
        message: 'Username already taken'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      displayName,
      email,
      hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });

    const { hashedPassword: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });

    const { hashedPassword: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error logging out',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { username } = req.params;

    const [user, followerCount, followingCount, pinCount] = await Promise.all([
      User.findOne({ username }).select('-hashedPassword'),
      Follow.countDocuments({ following: user?._id }),
      Follow.countDocuments({ follower: user?._id }),
      Pin.countDocuments({ user: user?._id })
    ]);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    let isFollowing = false;
    if (req.user) {
      isFollowing = await Follow.exists({
        follower: req.user._id,
        following: user._id
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        ...user.toObject(),
        followerCount,
        followingCount,
        pinCount,
        isFollowing
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const { username } = req.params;

    const userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot follow yourself'
      });
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: userToFollow._id
    });

    if (existingFollow) {
      await Follow.deleteOne({
        follower: req.user._id,
        following: userToFollow._id
      });

      res.status(200).json({
        status: 'success',
        message: 'User unfollowed successfully'
      });
    } else {
      await Follow.create({
        follower: req.user._id,
        following: userToFollow._id
      });

      res.status(200).json({
        status: 'success',
        message: 'User followed successfully'
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error following user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};