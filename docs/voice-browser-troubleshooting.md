# Voice Browser Troubleshooting

Use this when microphone recording or audio playback fails in the web app.

## Quick Checks

- Use HTTPS in production. Mobile browsers usually block microphone access on plain HTTP.
- Confirm voice journaling is enabled in `/settings`.
- Confirm the browser permission prompt was accepted.
- Close other apps or browser tabs that may be using the microphone.
- Try a short recording first; empty or near-empty recordings are rejected before upload.
- If transcription fails after recording, tap the mic again to retry the last captured recording. The recording is kept in memory only and is not stored.
- If playback fails, use the `Retry` state on the audio control.

## iPhone And iPad Safari

- Safari requires HTTPS for microphone access outside localhost.
- Check `Settings -> Safari -> Camera & Microphone` and allow access when prompted.
- If the prompt does not appear, open the `AA` or site settings menu in Safari and reset website permissions.
- iOS Safari may prefer MP4/AAC recording. The app already chooses the first supported format and sends the matching file extension.
- Low Power Mode, Bluetooth routing, or active phone calls can interfere with recording.

## Chrome On Android

- Chrome requires HTTPS for microphone access outside localhost.
- Open the lock icon beside the address bar and confirm microphone permission is allowed.
- Android system permissions can override browser permissions. Check `Settings -> Apps -> Chrome -> Permissions -> Microphone`.
- If recording starts but no text appears, try disabling Bluetooth headphones temporarily and record directly through the phone microphone.

## Desktop Chrome And Edge

- Open the lock icon in the address bar and allow microphone access.
- Confirm the correct microphone is selected in browser site settings.
- macOS users should also check `System Settings -> Privacy & Security -> Microphone`.
- Windows users should check `Settings -> Privacy & security -> Microphone` and allow desktop/browser access.
- Corporate device policies can block microphone permissions even when the browser UI appears to allow them.

## Desktop Safari

- Use `Safari -> Settings -> Websites -> Microphone` and allow the app hostname.
- macOS privacy settings can still block Safari microphone access.
- If recording fails immediately, quit and reopen Safari after changing permissions.

## Firefox

- Open the site permission icon near the address bar and allow microphone access.
- Firefox may remember a denied permission. Clear the blocked microphone permission and reload.
- If playback is silent, check Firefox autoplay/audio permissions and system output device selection.

## Local Development

- `http://localhost:3000` can access the microphone in most desktop browsers.
- `http://127.0.0.1:3000` usually works on desktop.
- Local network URLs such as `http://192.168.x.x:3000` usually do not work for mobile microphone capture because they are not secure contexts.
- For mobile-device testing against a local machine, use HTTPS tunneling or a deployed preview URL.

## Support Notes

- The app does not store uploaded audio.
- Transcription requests are limited to 20 per signed-in user per hour through shared database-backed usage buckets.
- Speech playback requests are limited to 60 per signed-in user per hour through shared database-backed usage buckets.
- High-severity safety responses skip audio playback by design.
