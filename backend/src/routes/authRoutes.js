// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");
const { signJwtToken } = require("../utils/jwt");
const authMiddleware = require("../middlewares/authMiddleware");

// Email/Password

// Email/Password
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);
// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failure" }),
  authController.googleCallback
);

router.get("/google/failure", authController.googleFailure);

module.exports = router;