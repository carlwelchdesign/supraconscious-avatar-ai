# AI Package Source Notes

The small `.js` files in this directory are compatibility shims that re-export the matching `.ts` source files.

They are intentional for now: several package-internal imports use Node-style `.js` specifiers, while the local Next/Turbopack apps consume TypeScript source directly from the workspace. Keep these shims until `@inner-avatar/ai` emits compiled JavaScript and its package exports point at a build output.
