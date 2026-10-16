# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Frontend Architecture

The frontend lives in [`apps/frontend/`](apps/frontend/) — a single mobile-first screen with four tabs (Belajar, Latihan, Akses, Profil), built with React 19 + Vite + Tailwind v4 and packaged as a PWA and Tauri v2 app (`apps/frontend/src-tauri`). It talks to the backend through the tRPC client in `apps/frontend/src/lib/trpc.ts`, with contract adapters in `apps/frontend/src/lib/api/` and React Query hooks in `apps/frontend/src/lib/hooks/`. Never call AI providers directly from this client — all AI goes through `ai.*` tRPC procedures.

**There are no user accounts.** All learner data (accessibility settings, material library, quiz scores, XP/streak, voice-practice history) lives locally on the device and is keyed server-side by a random per-device `deviceId`. Every device therefore starts from zero; the only way to continue elsewhere is the cross-device backup code on the Profil tab (`backup.save`/`backup.load` + `data.export`/`data.import`, driven by `apps/frontend/src/lib/hooks/use-device-backup.ts`). Keep new persisted state inside that backup snapshot (`packages/api/src/backup.ts`) so nothing is silently left behind on restore.

**Gamification & voice history** persist server-side in `gamification_state` (`progress.reward` / `progress.gamification`) and `voice_attempts` (`progress.recordVoiceAttempt` / `progress.voiceHistory`), mirrored locally by `apps/frontend/src/lib/stores/gamification-store.ts`. XP and the daily streak must never move backwards — merging/restoring takes the maximum (`mergeGamification`). Voice answers are graded deterministically by keyword match in `packages/api/src/voice.ts` (no AI call, so it costs no quota and works offline); a correct answer awards XP like any other practice, while replaying from Riwayat Latihan records the attempt but gives **no** XP.

**Speech fallback.** TTS/STT prefer the device Web Speech API but fall back to the server (`speech.synthesize`/`speech.transcribe` via Gemini) when the platform lacks it or its engine is silent. `shouldPreferServerStt` (in `apps/frontend/src/lib/speech-stt.ts`) forces the recorder path on Android WebView/Tauri shells, where `SpeechRecognition` can exist yet never return results. Gate voice buttons with `canRecordSpeech` (microphone), **not** `canSpeakText`/`hasSpeechSynthesis` — they are different capabilities.

**Device identity rules.** `apps/frontend/src/lib/offline/device-identity.ts` is the single source for `deviceId`. It resolves **synchronously** from `localStorage`, never throws, and guarantees a value ≥4 chars (matching `deviceIdSchema`). Do **not** move it into Zustand `persist`: that middleware calls `window.localStorage` at store-creation time and disables persistence permanently if the access throws, which leaves `deviceId` empty and every device query pending forever. Because it always returns a value, query `enabled`-gates on `deviceId` are unnecessary — start queries on first render.

UI components live in `apps/frontend/src/components/`; **non-UI features** (offline IndexedDB, materials cache, Zustand stores, haptics, motion, TTS/STT, shared hooks) live in `apps/frontend/src/lib/`. Keep UI thin and put reusable logic in `lib/`. The backend lives in `apps/server` (Hono + tRPC) with shared contracts in `packages/api`.

## Quick Reference

- **Format code**: `bunx ultracite fix`
- **Check for issues**: `bunx ultracite check`
- **Diagnose setup**: `bunx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bunx ultracite fix` before committing to ensure compliance.
