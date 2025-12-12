const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// IMPORTANT: set this in Render → Environment
const OPENAI_API_KEY = process.env.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 || "";

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

  // Node 18+ has global FormData & Blob via undici (Render uses Node 22)
  const form = new FormData();
  form.append("file", new Blob([audioBuffer]), "audio.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "json");

  const resp = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Whisper error response:", text);
    throw new Error(`Whisper error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const text = typeof data.text === "string" ? data.text : "";
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