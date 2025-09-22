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

/* ------------------ CACHE HELPERS ------------------ */
// Write-through: clear and update cache immediately
async function updateUserCache(userId) {
  const chats = await prisma.chat.findMany({
    where: { userId },
    include: { pdfs: true },
    orderBy: { chatId: "desc" },
  });

  const cacheKey = `user:${userId}:chats`;
  const cacheString = chats
    .map(chat => {
      return `chatId:${chat.chatId};userId:${chat.userId};persona:${chat.persona || ""};job:${chat.job || ""};insights:${chat.insights || ""}`;
    })
    .join("\n---\n");

  await redis.set(cacheKey, cacheString, { EX: 60 * 5 });
  console.log(`📝 Cache updated for user ${userId} at ${new Date().toISOString()}`);
}

/* ------------------ PARSE CACHE STRING ------------------ */
function parseChatsString(cachedString) {
  if (!cachedString) return [];
  return cachedString.split("\n---\n").map(chatStr => {
    const chatObj = {};
    chatStr.split(";").forEach(part => {
      const [key, ...rest] = part.split(":");
      chatObj[key.trim()] = rest.join(":").trim();
    });
    return chatObj;
  });
}

/* ------------------ EMAIL/PASSWORD SIGNUP ------------------ */
exports.signup = async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User with same email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, name, phoneNumber },
    });

    const chat = await prisma.chat.create({ data: { userId: user.userId } });

    // Write-through cache update
    await updateUserCache(user.userId);

    console.log(`🟢 Signup | User: ${email} | Time: ${new Date().toISOString()}`);

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

/* ------------------ EMAIL/PASSWORD LOGIN ------------------ */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.password) return res.status(400).json({ error: "This account uses Google login only" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: "Invalid credentials" });

    const chat = await prisma.chat.create({ data: { userId: user.userId } });

    // Write-through cache update
    await updateUserCache(user.userId);

    console.log(`🟢 Login | User: ${email} | Time: ${new Date().toISOString()}`);

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

/* ------------------ LOGOUT ------------------ */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Remove cache immediately (write-through)
    const cacheKey = `user:${userId}:chats`;
    await redis.del(cacheKey);

    res.clearCookie("token", COOKIE_OPTIONS);
    console.log(`🔴 Logout | User: ${user.email || user.name} | Time: ${new Date().toISOString()}`);

    return res.json({ message: "Logged out successfully, cache flushed." });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ GOOGLE LOGIN ------------------ */
exports.googleSuccess = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Google auth failed" });

  let chat = await prisma.chat.findFirst({ where: { userId: user.userId } });
  if (!chat) {
    chat = await prisma.chat.create({ data: { userId: user.userId } });
  }

  // Write-through cache update
  await updateUserCache(user.userId);

  console.log(`🟢 Google Login | User: ${user.email || user.name} | Time: ${new Date().toISOString()}`);

  const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.status(200).json({
    message: "Google login successful",
    user: { id: user.userId, name: user.name, email: user.email },
    chatId: chat.chatId,
  });
};

exports.googleFailure = async (_req, res) => {
  return res.status(400).json({ error: "Google login failed" });
};

exports.googleCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
  }

  const user = req.user;
  const chat = await prisma.chat.create({ data: { userId: user.userId } });

  // Write-through cache update
  await updateUserCache(user.userId);

  console.log(`🟢 Google OAuth Callback | User: ${user.email || user.name} | Time: ${new Date().toISOString()}`);

  const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);

  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-success?name=${encodeURIComponent(user.name)}&chatId=${chat.chatId}`
  );
};
