// Fish Audio <-> Vapi Custom TTS Bridge
// Vapi POSTs text here, this calls Fish Audio, returns audio in the format Vapi expects.

const express = require("express");
const fetch = require("node-fetch");
const msgpack = require("msgpack-lite");

const app = express();
app.use(express.json());

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY; // set this in your host's env vars
const FISH_VOICE_ID = process.env.FISH_VOICE_ID;           // your cloned voice's reference_id

// Simple auth check so random people can't hit your endpoint and burn your Fish Audio credits.
// Set this same value as a header/secret in Vapi's Custom Credentials.
const BRIDGE_SECRET = process.env.BRIDGE_SECRET;

app.post("/tts", async (req, res) => {
  try {
    // Optional shared-secret check
    if (BRIDGE_SECRET && req.headers["x-bridge-secret"] !== BRIDGE_SECRET) {
      return res.status(401).send("Unauthorized");
    }

    // Vapi sends the text to speak in the request body.
    // Exact field name can vary by Vapi's custom TTS payload — check the payload you actually receive
    // by logging req.body once during testing, then adjust this line if needed.
    const textToSpeak = req.body.text || req.body.message || "";

    if (!textToSpeak) {
      return res.status(400).send("No text provided");
    }

    // Call Fish Audio's TTS endpoint
    // Fish Audio's /v1/tts endpoint expects a MessagePack-encoded body, not plain JSON.
    const requestBody = msgpack.encode({
      text: textToSpeak,
      reference_id: FISH_VOICE_ID,
      format: "pcm",       // match Vapi's required format
      sample_rate: 16000,  // adjust to whatever Vapi's docs specify for your setup
      latency: "balanced", // use the lowest-latency option available for live calls
    });

    const fishResponse = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FISH_AUDIO_API_KEY}`,
        "Content-Type": "application/msgpack",
      },
      body: requestBody,
    });

    if (!fishResponse.ok) {
      const errText = await fishResponse.text();
      console.error("Fish Audio error:", errText);
      return res.status(502).send("TTS provider error");
    }

    // Stream the raw PCM audio bytes straight back to Vapi
    res.set("Content-Type", "audio/pcm");
    fishResponse.body.pipe(res);

  } catch (err) {
    console.error("Bridge error:", err);
    res.status(500).send("Internal error");
  }
});

app.get("/", (req, res) => res.send("Fish Audio <-> Vapi bridge is running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge listening on port ${PORT}`));
