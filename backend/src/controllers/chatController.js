const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');
const redis=require("../config/redis");


// ---------------- Cache Helpers ----------------
async function invalidateUserCache(userId) {
  const cacheKey = `user:${userId}:chats`;
  await redis.del(cacheKey);
  await redis.set(`user:${userId}:dirty`, "true"); // mark dirty for write-back
}

// Write chats to cache and mark dirty
async function writeUserCache(userId, chats) {
  const cacheKey = `user:${userId}:chats`;
  await redis.set(cacheKey, JSON.stringify(chats), "EX", 60 * 5); // 5 min TTL
  await redis.set(`user:${userId}:dirty`, "true");
}
// ------------------ Upload PDFs ------------------
exports.uploadPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No PDF files uploaded" });
    }

    let chat;

    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { chatId: Number(chatId) },
        include: { pdfs: true }, 
      });

      if (!chat) {
        return res.status(404).json({ error: `Chat ${chatId} not found.` });
      }
    } else {
      chat = await prisma.chat.create({
        data: { userId },
        include: { pdfs: true },
      });
    }

    // Extract existing + new files
    const existingFiles = chat.pdfs.map((pdf) => pdf.fileName);
    const newFiles = req.files.map((file) => file.originalname);

    // ---------------- REMOVE OLD FILES ----------------
const filesToDelete = existingFiles.filter((f) => !newFiles.includes(f));

if (filesToDelete.length > 0) {
  // Remove from DB
  await prisma.pdf.deleteMany({
    where: {
      chatId: chat.chatId,
      fileName: { in: filesToDelete },
    },
  });

  // 🔥 Batch delete instead of multiple API calls
  await axios.delete(process.env.FAST_API_URL + "/delete-files", {
    params: {
      chat_id: chat.chatId,
      filenames: filesToDelete, // <-- List of filenames
    },
    paramsSerializer: (params) => {
      return Object.entries(params)
        .map(([key, value]) =>
          Array.isArray(value)
            ? value.map((v) => `${key}=${encodeURIComponent(v)}`).join("&")
            : `${key}=${encodeURIComponent(value)}`
        )
        .join("&");
    },
  });
}

    // ---------------- ADD NEW FILES ----------------
    const filesToAdd = req.files.filter(
      (file) => !existingFiles.includes(file.originalname)
    );

    if (filesToAdd.length > 0) {
      const pdfData = filesToAdd.map((file) => ({
        pdf: file.buffer,
        chatId: chat.chatId,
        fileName: file.originalname,
      }));
      await prisma.pdf.createMany({ data: pdfData });
      // After prisma.pdf.createMany(...)
const updatedChats = await prisma.chat.findMany({
  where: { userId },
  include: { pdfs: { select: { pdfId: true, fileName: true } } },
  orderBy: { chatId: "desc" },
});
await writeUserCache(userId, updatedChats);

      // Forward only new files to FastAPI
      const formData = new FormData();
      formData.append("chat_id", String(chat.chatId));

      filesToAdd.forEach((file) => {
        formData.append("files", file.buffer, {
          filename: file.originalname,
          contentType: "application/pdf",
        });
      });

      await axios.post(
        process.env.FAST_API_URL + "/upload-pdfs",
        formData,
        { headers: formData.getHeaders() }
      );
    }

    return res.status(201).json({
      message: "PDFs synced successfully",
      chatId: chat.chatId,
    });
  } catch (error) {
    console.error("Error in uploadPdf:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};


exports.startNewChat = async (req, res) => {
  try {
    const userId = req.user.id;

    const newChat = await prisma.chat.create({
      data: { userId }, // no need to pass chatId
    });

    console.log("New Chat ID:", newChat.chatId);

    return res.status(201).json({
      message: 'New chat started',
      chatId: newChat.chatId,
    });
  } catch (error) {
    console.error("Error in startNewChat:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// ------------------ Search Chat ------------------
exports.searchChat = async (req, res) => {
  try {
    // Read from query
    const { chatId, persona } = req.query;
    console.log(chatId,persona)
    if (!chatId || !persona) {
      return res.status(400).json({ error: 'chatId and persona are required' });
    }

    // 1. Send request to FastAPI with persona and chatId
    const fastApiSearchResponse = await axios.get(
      process.env.FAST_API_URL+'/search-chat',
      {
        params: { chat_id: chatId, query: persona },
      }
    );

    const searchResults = fastApiSearchResponse.data;
    console.log(searchResults);
   // 2. Format results
const formattedResults = searchResults.map((item, idx) => {
  let text = "";

  try {
    // ✅ only parse if item looks like JSON
    if (typeof item === "string" && item.trim().startsWith("{")) {
      const parsed = JSON.parse(item);
      text = parsed.page_content || "";
    } else if (typeof item === "object") {
      text = item.page_content || "";
    } else {
      text = String(item);
    }
  } catch (err) {
    console.error("Failed to parse search result:", item, err);
    text = typeof item === "string" ? item : "";
  }

  return {
    id: idx + 1,
    text: text.replace(/\n+/g, "\n").trim(),
  };
});


// 🔥 Merge results into one string for saving
const mergedText = formattedResults.map(r => r.text).join("\n\n");

// 4. Save the insights to the chat in DB
const chat = await prisma.chat.findUnique({
  where: { chatId: Number(chatId) },
});

if (!chat) {
  return res.status(404).json({ error: `Chat ${chatId} not found.` });
}

console.log("Trying to update the chat:", chatId);

await prisma.chat.update({
  where: { chatId: Number(chatId) },
  data: { insights: mergedText, persona },
});

// Update cache
const updatedChats = await prisma.chat.findMany({
  where: { userId: chat.userId },
  include: { pdfs: { select: { pdfId: true, fileName: true } } },
  orderBy: { chatId: "desc" },
});
await writeUserCache(chat.userId, updatedChats);

return res.status(200).json({
  chatId,
  persona,
  searchResults: formattedResults,
  mergedText,
});

  } catch (error) {
    console.error("Error in searchChat:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.getChatsByUser = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}:chats`;

    const cachedChats = await redis.get(cacheKey);
    if (cachedChats) {
      const endTime = Date.now();
      console.log(`✅ Cache hit | getChatsByUser: ${endTime - startTime} ms`);
      return res.status(200).json({ chats: JSON.parse(cachedChats), fromCache: true });
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      include: { pdfs: { select: { pdfId: true, fileName: true } } },
      orderBy: { chatId: "desc" },
    });

    await redis.set(cacheKey, JSON.stringify(chats), "EX", 60 * 5);
    await redis.set(`user:${userId}:dirty`, "false"); // cache is clean

    const endTime = Date.now();
    console.log(`❌ Cache miss | getChatsByUser: ${endTime - startTime} ms`);

    return res.status(200).json({ chats, fromCache: false });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

exports.startNewChat = async (req, res) => {
  try {
    const userId = req.user.id;

    const newChat = await prisma.chat.create({ data: { userId } });

    // Write latest chats to Redis + mark dirty
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

// ------------------ Delete Chat ------------------
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const chat = await prisma.chat.findUnique({ where: { chatId: Number(chatId) } });
    if (!chat) return res.status(404).json({ error: `Chat ${chatId} not found.` });

    await prisma.chat.delete({ where: { chatId: Number(chatId) } });

    // Update Redis cache + mark dirty
    const chats = await prisma.chat.findMany({
      where: { userId: chat.userId },
      include: { pdfs: { select: { pdfId: true, fileName: true } } },
      orderBy: { chatId: "desc" },
    });
    await writeUserCache(chat.userId, chats);

    return res.status(200).json({ message: `Chat ${chatId} deleted and cache invalidated.` });
  } catch (error) {
    console.error("Error in deleteChat:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
