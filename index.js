const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// IMPORTANT: set this in Render → Environment as OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ---------- Helpers ----------

// Download video/audio from a URL into a Buffer
async function downloadMediaToBuffer(url) {
  console.log("Downloading media from:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `Failed to download media: ${resp.status} ${resp.statusText}`,
    );
  }

  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Call OpenAI Whisper to transcribe the audio buffer
async function transcribeWithWhisper(audioBuffer) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Use the official OpenAI SDK instead of manual multipart
  const result = await openai.audio.transcriptions.create({
    file: {
      // Provide buffer and filename; SDK handles multipart details
      data: audioBuffer,
      name: "audio.mp3",
    },
    model: "whisper-1",
    response_format: "json",
  });

  const text = typeof result.text === "string" ? result.text : "";
  console.log("Whisper transcript length:", text.length);
  return text;
}

// ---------- Routes ----------

// Simple health check
app.get("/", (req, res) => {
  res.send("makeupai media-analysis service is running");
});

/**
 * POST /media-analysis
 * Body: { videoUrl: string }
 *
 * - Downloads the video/audio from videoUrl
 * - Sends audio to OpenAI Whisper for transcription
 * - Returns { transcript, visualNotes, caption }
 */
app.post("/media-analysis", async (req, res) => {
  const { videoUrl } = req.body || {};
  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl is required" });
  }

  console.log("media-analysis called for", videoUrl);

  try {
    // 1) Download media
    const audioBuffer = await downloadMediaToBuffer(videoUrl);

    // 2) Transcribe with Whisper
    const transcript = await transcribeWithWhisper(audioBuffer);

    // 3) For now, visualNotes are still stubbed
    const visualNotes = `
      Visual analysis is not implemented yet. This text is a placeholder.
      Real visual product detection will be added with GPT-4o vision later.
    `;

    return res.json({
      transcript,
      visualNotes,
      caption: null,
    });
  } catch (err) {
    console.error("media-analysis error:", err);
    return res.status(500).json({
      error: "media-analysis-failed",
      message: err.message || "Unknown error",
      transcript: "",
      visualNotes: "",
      caption: null,
    });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`media-analysis service listening on port ${PORT}`);
});
