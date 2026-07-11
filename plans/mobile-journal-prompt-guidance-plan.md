# Mobile Journal Prompt Guidance Plan

## Summary
Bring the mobile Journal tab closer to the web journal experience by adding a clear prompt/guidance layer before the input field. The mobile page should answer "what am I supposed to write?" before asking the user to type.

## Key Changes
- Add `GET /api/mobile/journal/prompt` using the same app calendar date and approved curriculum lookup as the web journal page.
- Return today label plus the current or fallback monthly Threshold prompt when available.
- Update the mobile Journal tab with clearer heading, helper copy, prompt card, practical placeholder, word count, privacy note, and short-entry guidance.
- Keep founder-calibration prompts and custom voice capture out of this slice.

## Test Plan
- Backend response-builder tests cover prompt and null-prompt cases.
- Flutter tests cover journal guidance copy, prompt card rendering, null prompt behavior, and prompt parsing.
- Verify with web tests/typecheck, Flutter analyze/test, Android debug build, iOS simulator build, and iOS simulator smoke.
