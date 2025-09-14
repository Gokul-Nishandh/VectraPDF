const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');

// ------------------ Upload PDFs ------------------
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
    const parsed = typeof item === "string" ? JSON.parse(item) : item;
    text = parsed.page_content || "";
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


// ------------------ Get Chats by User ------------------
exports.getChatsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await prisma.chat.findMany({
      where: { userId },
      include: { pdfs: true },
    });
    if (!chats || chats.length === 0) {
      // Return 200 with empty chats array
      return res.status(200).json({ chats: [], message: 'No chat history found.' });
    }
    return res.status(200).json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// ------------------ Delete Chat ------------------
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    // 1. Get PDFs associated with this chat
    const pdfs = await prisma.pdf.findMany({
      where: { chatId: Number(chatId) },
    });

    // 2. Delete local PDF files (if you are saving them in filesystem with fileName)
    
    // 3. Delete from Postgres (cascade removes PDFs too)
    // 3. Delete from Postgres (cascade removes PDFs too)
const chat = await prisma.chat.findUnique({
  where: { chatId: Number(chatId) },
});

if (!chat) {
  return res.status(404).json({ error: `Chat ${chatId} not found.` });
}

await prisma.chat.delete({
  where: { chatId: Number(chatId) },
});

    // 4. Call FastAPI to delete from Pinecone
    await axios.delete(process.env.FAST_API_URL+'/delete-chat', {
      params: { chat_id: chatId },
    });

    return res.status(200).json({
      message: `Chat ${chatId} deleted from Postgres, Pinecone, and local storage.`,
    });

  } catch (error) {
    console.error("Error in deleteChat:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
