const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// TODO: put your real OpenAI key here, or use process.env.OPENAI_API_KEY on Render
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY_HERE";

// Simple health check
app.get("/", (req, res) => {
  res.send("makeupai media-analysis service is running");
});

/**
 * POST /media-analysis
 * Body: { videoUrl: string }
 *
 * For now this is a STUB that returns fake transcript + visualNotes,
 * so you can wire Supabase and see AI products change.
 * Later, you'll:
 * - Download the TikTok video
 * - Extract audio and call Whisper
 * - Sample frames and call gpt-4o vision
 */
app.post("/media-analysis", async (req, res) => {
  const { videoUrl } = req.body || {};
  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl is required" });
  }

  console.log("media-analysis called for", videoUrl);

  // TODO (future): implement real Whisper + gpt-4o vision here

  // For now, return a fake transcript + visual notes to test the pipeline
  const transcript = `
    Today I'm creating an everyday glowy base. I start with Milk Hydro Grip Primer
    to prep the skin, then I go in with NARS Sheer Glow foundation and a bit of
    NARS Radiant Creamy Concealer under the eyes. I set everything lightly with
    Laura Mercier Translucent Setting Powder.

    For cheeks I'm using Rare Beauty Soft Pinch Liquid Blush in Joy,
    Charlotte Tilbury Filmstar Bronze & Glow to bronze and highlight,
    and a touch of Hourglass Ambient Lighting Powder.

    On the eyes I'm using the Natasha Denona Glam Palette,
    a KVD Tattoo Liner for the wing and Too Faced Better Than Sex mascara.

    For brows I go in with Anastasia Brow Wiz and Benefit Gimme Brow gel.
    On the lips I'm using MAC Spice lip liner and Fenty Beauty Gloss Bomb in Fenty Glow.
  `;

  const visualNotes = `
    The frames show: Milk Hydro Grip Primer, NARS Sheer Glow Foundation,
    NARS Radiant Creamy Concealer, Laura Mercier Translucent Setting Powder,
    Rare Beauty Soft Pinch Liquid Blush, Charlotte Tilbury Filmstar Bronze & Glow,
    Hourglass Ambient Lighting Powder, Natasha Denona Glam Palette,
    KVD Tattoo Liner, Too Faced Better Than Sex Mascara,
    Anastasia Brow Wiz, Benefit Gimme Brow, MAC Spice Lip Pencil,
    Fenty Beauty Gloss Bomb.
  `;

  return res.json({
    transcript,
    visualNotes,
    caption: null,
  });
});

app.listen(PORT, () => {
  console.log(`media-analysis service listening on port ${PORT}`);
});
