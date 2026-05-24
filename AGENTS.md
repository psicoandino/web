# AGENTS.md — psicoandino

**Language:** English for commits and agent chat. User-facing UI copy MUST stay in Spanish.

**Context:** `~/dev/vault/Projects/psicoandino.md`

## Project
Minimalist OLED black website optimized for mobile-first views. It features a continuous horizontal gesture navigation layout (Cinta Continua) and a custom mathematical synthesizer radio.

## Commands
- `pnpm dev` — local development server
- `pnpm build` — production build verification
- `pnpm lint` — linter check

## Rules
- Strict OLED aesthetic: background MUST be solid `#000000` across all views.
- Typography: monospace (`font-mono`). Text colors should be clean white or muted tech grays (`#555555`).
- No heavy external animation frameworks; rely strictly on native Tailwind transitions or standard React hooks for state.
- Layout must be completely protected against device notches using CSS safe-area variables.
