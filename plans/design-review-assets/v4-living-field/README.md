# Living Field Motion Study

This artifact extends the Quiet Observatory × Inner Cosmos direction with an ambient particle field. It is a design and interaction prototype, not production UI and not a claim that the system is sentient or biologically alive.

Open `index.html` in a browser. Use the four state controls to compare how the same field behaves while resting, listening, reflecting, and grounding.

For repeatable review captures, the prototype accepts `?state=reflecting`, `?motion=0`, and `?seed=1408` query parameters.

## Motion thesis

The field should feel alive through coordinated behavior rather than visual noise:

- **Shared breath:** a slow ten-second rhythm subtly changes particle opacity, link distance, and scale.
- **Local currents:** particles drift through a continuous field rather than falling, orbiting a logo, or behaving like a star field.
- **Momentary coherence:** nearby particles form faint filaments, then separate without a central leader.
- **Gentle pressure:** pointer movement displaces the field locally. Particles do not chase the member or imply surveillance.
- **State restraint:** listening and reflection add coherence; grounding removes density, brightness, and energy.

## Interaction states

| State | Purpose | Field behavior |
|---|---|---|
| Resting | Ambient presence | Low-energy drift and loose connections |
| Listening | Member is composing | Currents lean softly toward the reflection surface |
| Reflecting | Interpretation is being formed | Slightly greater coherence and warmth |
| Grounding | Sensitive or high-distress experience | Motion, density, connections, and brightness recede |

The state changes are deliberately subtle. Motion communicates attention and system state without performing emotion or claiming consciousness.

## Accessibility and performance boundaries

- The canvas is decorative, `aria-hidden`, and cannot capture pointer input.
- `prefers-reduced-motion: reduce` stops continuous animation and renders a stable mineral field.
- The loop pauses while the document is hidden.
- Device pixel ratio is capped at `1.75` and particle count adapts to viewport area.
- Frame deltas are clamped so background-tab or slow-device recovery cannot create violent jumps.
- All state controls are real buttons with visible focus and live text feedback.
- No journal text, pointer path, or behavioral data is stored or transmitted.

## Review questions

1. Does the field read as quietly alive, or merely decorative?
2. Does it support the writing and reflection surfaces without competing with them?
3. Are the differences between listening, reflecting, and grounding perceptible but restrained?
4. Should the field react only to product state in production, or retain the local pressure response?
5. Does the static reduced-motion composition preserve enough material depth?

## Implementation boundary

If this direction is approved, production implementation should use design tokens and a reusable background-field component with explicit lifecycle, motion-preference, state, and performance contracts. It should not be copied into the product as an unowned page-level script.
