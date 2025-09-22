const prisma = require("../config/db");
const bcrypt = require("bcrypt");
const { signJwtToken } = require("../utils/jwt");
const redis = require("../config/redis");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  maxAge: Number(process.env.JWT_COOKIE_MAX_AGE_MS || 60 * 60 * 1000),
};

// ---------------- Cache Helper ----------------
async function invalidateUserCache(userId) {
  const cacheKey = `user:${userId}:chats`;
  await redis.del(cacheKey);
  await redis.set(`user:${userId}:dirty`, "true"); // mark dirty for write-back
}

// --------- EMAIL/PASSWORD SIGNUP ----------
exports.signup = async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with same email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, name, phoneNumber },
    });

    const chat = await prisma.chat.create({ data: { userId: user.userId } });
    await invalidateUserCache(user.userId); // mark dirty

    const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user.userId, name: user.name, email: user.email },
      chatId: chat.chatId,
    });
  } catch (err) {
    next(err);
  }
};

// --------- EMAIL/PASSWORD LOGIN ----------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password) return res.status(400).json({ error: "This account uses Google login only" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: "Invalid credentials" });

    const chat = await prisma.chat.create({
  data: { userId: user.userId },
});
await invalidateUserCache(user.userId);


    const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful",
      user: { id: user.userId, name: user.name, email: user.email },
      chatId: chat.chatId,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}:chats`;
    const isDirty = await redis.get(`user:${userId}:dirty`);
    console.log("Logout check:", userId, cacheKey, isDirty);

    const cachedChats = await redis.get(cacheKey);
    if (isDirty === "true" && cachedChats) {
      const chats = JSON.parse(cachedChats);

      for (const chat of chats) {
  await prisma.chat.upsert({
    where: { chatId: chat.chatId },
    update: {
      persona: chat.persona,
      job: chat.job,
      insights: chat.insights,
      userId: chat.userId, // if needed
    },
    create: {
      chatId: chat.chatId,
      persona: chat.persona,
      job: chat.job,
      insights: chat.insights,
      userId: chat.userId,
    },
  });
}


      console.log(`📝 Write-back completed for user ${userId}`);
      await redis.set(`user:${userId}:dirty`, "false");
    }

    await redis.del(cacheKey);
    await redis.del(`user:${userId}:dirty`);

    res.clearCookie("token", COOKIE_OPTIONS);
    return res.json({ message: "Logged out successfully, cache flushed." });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

// --------- GOOGLE: success handler ----------
exports.googleSuccess = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Google auth failed" });

  let chat = await prisma.chat.findFirst({ where: { userId: user.userId } });
  if (!chat) {
    chat = await prisma.chat.create({ data: { userId: user.userId } });
    await invalidateUserCache(user.userId);
  }

  const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.status(200).json({
    message: "Google login successful",
    user: { id: user.userId, name: user.name, email: user.email },
    chatId: chat.chatId,
  });
};

// --------- GOOGLE: failure handler ----------
exports.googleFailure = async (_req, res) => {
  return res.status(400).json({ error: "Google login failed" });
};

// --------- GOOGLE: callback (redirect after OAuth) ----------
exports.googleCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
  }

  // Remove findFirst
const chat = await prisma.chat.create({
  data: { userId: user.userId }
});
await invalidateUserCache(user.userId);


  const token = signJwtToken({ id: req.user.userId, name: req.user.name, email: req.user.email });
  res.cookie("token", token, COOKIE_OPTIONS);

  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-success?name=${encodeURIComponent(req.user.name)}&chatId=${chat.chatId}`
  );
};
