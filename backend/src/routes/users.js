import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  followUser,
} from "../controllers/userController.js";
import { validateRequest } from "../middleware/validationMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { registerSchema, loginSchema } from "../utils/validationSchemas.js";

const router = express.Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/login", validateRequest(loginSchema), loginUser);
router.post("/logout", protect, logoutUser);

// Add URL decoding middleware for username parameter
router.param("username", (req, res, next, username) => {
  req.params.username = decodeURIComponent(username);
  next();
});

router.get("/:username", getUser);
router.post("/:username/follow", protect, followUser);

export default router;
