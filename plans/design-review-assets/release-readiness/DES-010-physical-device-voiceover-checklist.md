# DES-010 physical-device VoiceOver release gate

Status: required before DES-010 can be marked complete
Deployment: prohibited until separate founder approval

Apple requires a physical device for a true VoiceOver pass. Accessibility Inspector and Simulator checks supplement this gate but do not replace it. See Apple's [accessibility testing guidance](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app) and [Accessibility Inspector documentation](https://developer.apple.com/documentation/accessibility/accessibility-inspector).

## Test setup

- Install the current redesign build on an iPhone with VoiceOver enabled.
- Use a synthetic design-review account and synthetic reflection content only.
- Test once at the default text size and once with an accessibility text size.
- Record device model, iOS version, build identifier, tester, and date below.

| Evidence | Result |
| --- | --- |
| Device / iOS | Pending |
| Build identifier | Pending |
| Tester / date | Pending |
| Default text size | Pending |
| Accessibility text size | Pending |

Device-build preflight completed 2026-08-25 PT: unsigned arm64 debug app built successfully for bundle identifier `co.supraconscious.innerCouncilMobile`. No valid local code-signing identity or connected iPhone is currently available. The final device/build row must record the signed build actually installed for testing.

## Five required tasks

For every task, verify spoken name, role, state, value, hint where useful, focus order, escape/recovery, and that decorative living-field imagery is ignored.

1. **Begin a reflection** — reach Journal, focus the editor, enter synthetic text, and locate the primary reflection action.
2. **Enable gentler handling** — locate the switch after the editor, hear its purpose and state, turn it on, and confirm the changed state is announced.
3. **Distinguish authorship** — in a completed reflection, distinguish member words, tentative Guide text, provenance, and member-authored carry-forward without relying on color or position.
4. **Correct an observation** — reach keep, reject, correct, and restore actions; complete a synthetic correction; confirm status and recovery feedback are announced.
5. **Save and delete** — save a synthetic entry, navigate to it, begin deletion, cancel once, then confirm deletion and hear the result.

## Cross-cutting checks

- Bottom navigation exposes selected state and a stable order.
- Headings and landmarks make each screen understandable when swiping sequentially.
- No focus lands on mineral artwork, particles, currents, or decorative separators.
- Controls remain operable with accessibility text without clipping or hidden actions.
- Errors, loading, autosave, success, and destructive confirmation are announced without repeated or competing speech.
- Focus returns to a logical control after dialogs, corrections, save, and deletion.

## Completion record

| Task | Default text | Accessibility text | Notes / evidence |
| --- | --- | --- | --- |
| Begin a reflection | Pending | Pending | |
| Enable gentler handling | Pending | Pending | |
| Distinguish authorship | Pending | Pending | |
| Correct an observation | Pending | Pending | |
| Save and delete | Pending | Pending | |

DES-010 may move to Complete only when every row passes or a documented exception is explicitly accepted by the founder. A failed row returns the ticket to implementation; it does not authorize deployment.
