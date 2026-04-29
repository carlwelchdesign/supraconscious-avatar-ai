# Voice Features

## Overview

Voice is optional and controlled per user in settings. It includes:

- microphone input for journal transcription
- text-to-speech playback for Avatar responses
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

The current implementation does not store uploaded audio.

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

The journal UI builds speakable response text with `buildSpeakText()` and skips audio playback for high-severity safety responses.

## Voice Mapping

`resolveVoice()` maps user preferences to OpenAI voice names:

- female warm: `nova`
- female neutral: `shimmer`
- female deep: `sage`
- female soft: `alloy`
- male warm: `fable`
- male neutral/deep: `onyx`
- male soft: `echo`

## Known Gaps

- No usage limits or cost controls yet.
- No retry UI for failed transcription/speech.
- No browser compatibility documentation for microphone permissions yet.
