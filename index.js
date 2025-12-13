const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// IMPORTANT: set this in Render → Environment as OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ---------- Helpers ----------

// Download video/audio from a URL into a temp file on disk
async function downloadMediaToFile(url, filePath) {
  console.log("Downloading media from:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `Failed to download media: ${resp.status} ${resp.statusText}`,
    );
  }

  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    resp.body.pipe(fileStream);
    resp.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

// Call OpenAI Whisper to transcribe the audio file at filePath
async function transcribeWithWhisper(filePath) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const result = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
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

  // Choose a temp file path
  const tmpPath = path.join(
    "/tmp",
    `audio-${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`,
  );

  try {
    let mediaUrl = videoUrl;

    // If this is a TikTok URL, resolve it to a direct video URL first
    if (mediaUrl.includes("tiktok.com")) {
      const resolved = await resolveTikTokVideoUrl(mediaUrl);
      if (!resolved) {
        throw new Error("Failed to resolve TikTok URL to a direct video URL");
      }
      mediaUrl = resolved;
      console.log("Resolved TikTok URL to direct media URL:", mediaUrl);
    }

    // 1) Download media to temp file
    await downloadMediaToFile(mediaUrl, tmpPath);

    // 2) Transcribe with Whisper
    const transcript = await transcribeWithWhisper(tmpPath);

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
  } finally {
    // Clean up temp file (best-effort)
    fs.unlink(tmpPath, () => {});
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`media-analysis service listening on port ${PORT}`);
});