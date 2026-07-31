# Fish Audio <-> Vapi Bridge

This small server lets your Vapi assistant use Fish Audio as its voice, since Fish Audio
isn't a native one-click provider in Vapi yet.

## How it works
Vapi -> POSTs text to this server -> this server calls Fish Audio -> returns audio -> Vapi -> caller hears it.

## Setup

1. **Get your Fish Audio API key** from fish.audio dashboard.
2. **Get your Fish Audio voice ID** — clone a voice on Fish Audio (or use a preset one) and copy its `reference_id`.
3. **Deploy this server** somewhere with a public URL. Easiest options:
   - Railway.app (recommended — connect this folder as a repo, add env vars, deploy)
   - Render.com (free tier works for testing)
   - Fly.io

4. **Set these environment variables** on your host:
   - `FISH_AUDIO_API_KEY` — your Fish Audio key
   - `FISH_VOICE_ID` — your cloned voice's reference_id
   - `BRIDGE_SECRET` — any random string you make up, used to keep randoms from hitting your endpoint

5. **Copy the public URL** your host gives you (e.g. `https://your-app.up.railway.app`).

6. **In the Vapi dashboard**, on your assistant's Voice Settings panel (the one you're already looking at):
   - Provider: Custom voice (already selected)
   - Server URL: `https://your-app.up.railway.app/tts`
   - Voice ID: your Fish Audio reference_id (also set as FISH_VOICE_ID above)
   - If Vapi's custom credentials support a header, add `x-bridge-secret: <your BRIDGE_SECRET value>`

7. **Test**: Save, then use the "Talk" button in the Vapi dashboard to test the assistant in-browser
   before calling your real Twilio number. Check your server logs (Railway/Render dashboard) if it fails —
   the console.error lines will show you exactly what Vapi sent and what Fish Audio said back.

## Important note on the request format

Vapi's exact custom-TTS request body field name (what the incoming text is called) can vary.
The first time you test, log `req.body` to see the exact shape Vapi sends, then adjust
the `textToSpeak` line in server.js if it's not `text` or `message`.

## Local testing before deploying

```
npm install
FISH_AUDIO_API_KEY=xxx FISH_VOICE_ID=xxx BRIDGE_SECRET=xxx npm start
```

Then use ngrok to get a temporary public URL for testing with Vapi before you deploy for real:
```
ngrok http 3000
```
