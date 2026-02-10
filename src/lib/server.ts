import express from "express";
import cors from "cors";
import { llm, getTraces } from "./agent";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

import fs from "node:fs/promises";
import path from "node:path";

const app = express();
app.use(cors());
app.use(express.json());

const port = 3001;
const TRACES_DIR = path.join(process.cwd(), "traces");

app.post("/save", async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ error: "chatId is required" });

  try {
    const traces = getTraces(chatId);
    if (traces.length === 0) {
      return res.status(404).json({ error: "No traces found for this chatId" });
    }

    await fs.mkdir(TRACES_DIR, { recursive: true });
    const filePath = path.join(TRACES_DIR, `trace_${chatId}.json`);
    await fs.writeFile(filePath, JSON.stringify(traces, null, 2));

    res.json({ success: true, path: filePath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/chat", async (req, res) => {
  const { messages, chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ error: "chatId is required" });
  }

  try {
    // map simple {role, content} objects
    const langchainMessages = (messages || []).map((m: any) => {
      if (m.role === "user") return new HumanMessage(m.content);
      if (m.role === "agent" || m.role === "ai")
        return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });

    const response = await llm.invoke(
      {
        messages: langchainMessages,
      },
      {
        context: { chatId },
      },
    );

    // convert back to {role, content}
    const resultMessages = response.messages
      .map((m: any) => {
        const type = m._getType();
        let role = "agent";
        if (type === "human") role = "user";
        else if (type === "ai") role = "agent";
        else if (type === "tool") role = "tool";
        return { role, content: m.content };
      })
      .filter((m) => m.role !== "tool" && m.content.trim() !== "");

    res.json({ messages: resultMessages });
  } catch (error: any) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/traces/:chatId", async (req, res) => {
  const { chatId } = req.params;
  try {
    const traces = getTraces(chatId);
    res.json(traces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
