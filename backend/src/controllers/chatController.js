// controllers/chatController.js
const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');
const redis = require("../config/redis");

/* ------------------ CACHE HELPERS ------------------ */
async function writeUserCache(userId, chats) {
  const cacheKey = `user:${userId}:chats`;

  // Convert each chat to a string manually (write-through)
  const cacheString = chats
    .map(chat => {
      return `chatId:${chat.chatId};userId:${chat.userId};persona:${chat.persona || ""};job:${chat.job || ""};insights:${chat.insights || ""}`;
    })
    .join("\n---\n"); // separator between chats

  await redis.set(cacheKey, cacheString, { EX: 60 * 5 });
  console.log(`📝 User ${userId} cache updated with ${chats.length} chats`);
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

/* ------------------ GET CHATS BY USER ------------------ */


exports.getChatsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}:chats`;

    const startTime = process.hrtime(); // start timer
    const cachedChats = await redis.get(cacheKey);

    if (cachedChats) {
      const elapsed = process.hrtime(startTime);
      const latencyMs = (elapsed[0] * 1e3 + elapsed[1] / 1e6).toFixed(2);
      console.log(`🟢 Cache HIT | User: ${userId} | Latency: ${latencyMs} ms`);
      const chats = parseChatsString(cachedChats);
      return res.status(200).json({ chats, fromCache: true, latencyMs });
    }

    const dbStartTime = process.hrtime();
    const chats = await prisma.chat.findMany({
      where: { userId },
      include: { pdfs: true },
      orderBy: { chatId: "desc" },
    });
    await writeUserCache(userId, chats);
    const dbElapsed = process.hrtime(dbStartTime);
    const dbLatencyMs = (dbElapsed[0] * 1e3 + dbElapsed[1] / 1e6).toFixed(2);
    console.log(`🟡 Cache MISS | User: ${userId} | DB Latency: ${dbLatencyMs} ms`);
    return res.status(200).json({ chats, fromCache: false, latencyMs: dbLatencyMs });
  } catch (error) {
    console.error("Error in getChatsByUser:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ UPDATE CACHE AFTER DB WRITE ------------------ */
async function updateChatAndCache(chatId, data) {
  const chat = await prisma.chat.update({
    where: { chatId: Number(chatId) },
    data,
  });

  // Update full user cache immediately (write-through)
  const updatedChats = await prisma.chat.findMany({
    where: { userId: chat.userId },
    include: { pdfs: true },
    orderBy: { chatId: "desc" },
  });
  await writeUserCache(chat.userId, updatedChats);
  return chat;
}

/* ------------------ UPLOAD PDF ------------------ */
exports.uploadPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.body;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: "No PDF files uploaded" });

    let chat = chatId
      ? await prisma.chat.findUnique({
          where: { chatId: Number(chatId) },
          include: { pdfs: true },
        })
      : await prisma.chat.create({ data: { userId }, include: { pdfs: true } });

    if (!chat) return res.status(404).json({ error: `Chat ${chatId} not found.` });

    const existingFiles = chat.pdfs.map(pdf => pdf.fileName);
    const newFiles = req.files.map(file => file.originalname);

    // Delete removed files
    const filesToDelete = existingFiles.filter(f => !newFiles.includes(f));
    if (filesToDelete.length > 0) {
      await prisma.pdf.deleteMany({
        where: { chatId: chat.chatId, fileName: { in: filesToDelete } },
      });

      await axios.delete(`${process.env.FAST_API_URL}/delete-files`, {
        params: { chat_id: chat.chatId, filenames: filesToDelete },
        paramsSerializer: params =>
          Object.entries(params)
            .map(([key, value]) =>
              Array.isArray(value)
                ? value.map(v => `${key}=${encodeURIComponent(v)}`).join("&")
                : `${key}=${encodeURIComponent(value)}`
            )
            .join("&"),
      });
    }

    const filesToAdd = req.files.filter(file => !existingFiles.includes(file.originalname));
    if (filesToAdd.length > 0) {
      const pdfData = filesToAdd.map(file => ({ chatId: chat.chatId, fileName: file.originalname }));
      await prisma.pdf.createMany({ data: pdfData });

      const updatedChats = await prisma.chat.findMany({
        where: { userId },
        include: { pdfs: true },
        orderBy: { chatId: "desc" },
      });
      await writeUserCache(userId, updatedChats);

      const formData = new FormData();
      formData.append("chat_id", String(chat.chatId));
      filesToAdd.forEach(file =>
        formData.append("files", file.buffer, { filename: file.originalname, contentType: "application/pdf" })
      );

      await axios.post(`${process.env.FAST_API_URL}/upload-pdfs`, formData, {
        headers: formData.getHeaders(),
      });
    }

    return res.status(201).json({ message: "PDFs synced successfully", chatId: chat.chatId });
  } catch (error) {
    console.error("Error in uploadPdf:", error.response?.data || error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ START NEW CHAT ------------------ */
exports.startNewChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const newChat = await prisma.chat.create({ data: { userId } });

    const chats = await prisma.chat.findMany({
      where: { userId },
      include: { pdfs: { select: { pdfId: true, fileName: true } } },
      orderBy: { chatId: "desc" },
    });
    await writeUserCache(userId, chats);

    return res.status(201).json({ message: "New chat started", chatId: newChat.chatId });
  } catch (error) {
    console.error("Error in startNewChat:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ SEARCH CHAT ------------------ */
exports.searchChat = async (req, res) => {
  try {
    const { chatId, persona } = req.query;
    if (!chatId || !persona) return res.status(400).json({ error: "chatId and persona are required" });

    const fastApiSearchResponse = await axios.get(`${process.env.FAST_API_URL}/search-chat`, {
      params: { chat_id: chatId, query: persona },
    });

    const searchResults = fastApiSearchResponse.data;
    const formattedResults = searchResults.map((item, idx) => {
      let text = "";
      try {
        if (typeof item === "string" && item.trim().startsWith("{")) {
          text = JSON.parse(item).page_content || "";
        } else if (typeof item === "object") {
          text = item.page_content || "";
        } else {
          text = String(item);
        }
      } catch (err) {
        console.error("Failed to parse search result:", item, err);
      }
      return { id: idx + 1, text: text.replace(/\n+/g, "\n").trim() };
    });

    const mergedText = formattedResults.map(r => r.text).join("\n\n");

    // Write-through: update DB + cache immediately
    const updatedChat = await updateChatAndCache(chatId, { persona, insights: mergedText });

    return res.status(200).json({ chatId, persona, searchResults: formattedResults, mergedText });
  } catch (error) {
    console.error("Error in searchChat:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ DELETE CHAT ------------------ */
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const chat = await prisma.chat.findUnique({ where: { chatId: Number(chatId) } });
    if (!chat) return res.status(404).json({ error: `Chat ${chatId} not found.` });

    await prisma.chat.delete({ where: { chatId: Number(chatId) } });

    const chats = await prisma.chat.findMany({
      where: { userId: chat.userId },
      include: { pdfs: true },
      orderBy: { chatId: "desc" },
    });
    await writeUserCache(chat.userId, chats);

    return res.status(200).json({ message: `Chat ${chatId} deleted and cache updated.` });
  } catch (error) {
    console.error("Error in deleteChat:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

/* ------------------ LOGIN/LOGOUT LOGS ------------------ */
exports.logUserAction = (action, user) => {
  console.log(`🟢 ${action} | User: ${user.email || user.name} | Time: ${new Date().toISOString()}`);
};
