# Voice Features

## Overview

Voice is optional and controlled per user in settings. It includes:

- microphone input for journal transcription
- text-to-speech playback for guide responses
- voice preferences for gender, style, speed, default input mode, and autoplay

Preferences are stored on `User`.

## User Preferences

Fields:

- `voiceEnabled`
- `voiceAutoPlay`
- `voiceInputDefault`
- `voiceGender`
- `voiceStyle`
- `voiceSpeed`

Users edit these on `/settings` through `VoiceSettingsSection`.

## Transcription

Route: `POST /api/voice/transcribe`

Input:

- multipart form data with an `audio` blob
- max size: 25 MB

Backend:

- requires auth
- calls `transcribeAudio()`
- uses OpenAI `whisper-1`
- returns `{ text }`
- limits each signed-in user to 20 transcription requests per hour through shared database-backed usage buckets

The current implementation does not store uploaded audio.

Mobile notes:

- Microphone capture requires HTTPS on phones and tablets. Local network HTTP URLs such as `http://192.168.x.x:3000` usually cannot access the microphone.
- The recorder chooses the first browser-supported format from WebM/Opus, WebM, MP4, AAC, and MP3. This is important for iOS Safari, which may not support WebM recording.
- The upload filename extension is matched to the recorded MIME type before sending audio to OpenAI transcription.
- If upload/transcription fails after audio is captured, the mic control keeps the last recording in memory and lets the user retry from the same button. The recording is not persisted.

Browser-specific permission notes live in [Voice Browser Troubleshooting](voice-browser-troubleshooting.md).

## Text-To-Speech

Route: `POST /api/voice/speak`

Input:

```json
{
  "text": "string",
  "gender": "female",
  "style": "warm",
  "speed": 1
}
```

Backend:

- requires auth
- calls `synthesizeSpeech()`
- uses OpenAI `tts-1`
- returns `audio/mpeg`
- limits each signed-in user to 60 speech requests per hour through shared database-backed usage buckets
- rejects speech text over 4,096 characters

The journal UI builds speakable response text with `buildSpeakText()` and skips audio playback for high-severity safety responses.

If speech generation or playback fails, the audio control shows the provider/app error where available and keeps the button in a retry state.

## Voice Mapping

`resolveVoice()` maps user preferences to OpenAI voice names:

- female warm: `nova`
- female neutral: `shimmer`
- female deep: `sage`
- female soft: `alloy`
- male warm: `fable`
- male neutral/deep: `onyx`
- male soft: `echo`

## Usage Metering

Voice limits are stored in `VoiceUsageBucket` rows keyed by user, voice scope, and hourly window. This keeps metering consistent across Vercel/serverless instances and future horizontally scaled containers. Admin `/health` shows recent voice usage pressure by scope and user. A very high-volume deployment may still add provider-side budget alerts or edge-level quotas, but app-level metering no longer depends on a single process.
