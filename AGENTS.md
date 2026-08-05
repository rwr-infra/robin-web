# AGENTS.md

Guide for coding agents in `rwrs-another-page-v2`.

## Project

- Framework: SvelteKit 2 + Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Language: TypeScript (`strict: true`)
- Styling: Tailwind CSS 4 + DaisyUI
- i18n: `@inlang/paraglide-js`
- Package manager: `pnpm`
- Testing: Vitest (unit) + Playwright (e2e)

## Build / Lint / Test Commands

```bash
pnpm run dev
pnpm run build
pnpm run build:cdn
pnpm run preview
pnpm run check
pnpm run check:watch
pnpm run lint
pnpm run format
pnpm run test:unit
pnpm run test:e2e
pnpm run test
pnpm run coverage
```

Command notes:

- `build` runs `scripts/build-sveltekit.ts`
- `build:cdn` runs `scripts/build-cdn-sveltekit.ts`
- CDN vars: `CDN_URL`, optional `CDN_IMAGE_URL`
- `test` runs unit (`--run`) and then e2e
- `check` type-checks with TypeScript 7 (`tsgo`) via `svelte-check --tsgo`

TypeScript setup:

- `typescript` is pinned to 6.x because `svelte-check`, `@sveltejs/kit` and
  `typescript-eslint` peer-require a 5.x/6.x API
- TypeScript 7 is installed alongside as the alias `@typescript/native`
  (`npm:typescript@^7`), which is what `svelte-check --tsgo` drives
- drop `--tsgo` to fall back to the classic 6.x checker (slower, same results)

## Single-Test Commands (Use These)

Single unit file:

```bash
pnpm exec vitest run tests/unit/services/servers.test.ts
```

Single unit test by name:

```bash
pnpm exec vitest run tests/unit/services/servers.test.ts -t "should fetch"
```

Single Svelte component test:

```bash
pnpm exec vitest run tests/unit/components/ControlBar.svelte.test.ts
```

Only one Vitest project:

```bash
pnpm exec vitest run --project client
pnpm exec vitest run --project server
```

Single e2e file or grep title:

```bash
pnpm exec playwright test tests/e2e/smoke.spec.ts
pnpm exec playwright test -g "loads page"
```

Playwright runtime behavior:

- starts `node tests/e2e/mock-server.cjs` on `5800`
- starts `E2E_TEST=true npm run dev` on `5173`

## Import and Path Conventions

- Prefer aliases to deep relative imports:
  - `$lib/*` shared modules
  - `$app/*` SvelteKit internals
  - `@/*` maps to `src/*` (configured in `svelte.config.js` and `vite.config.ts`)
- Use `import type` for type-only imports.
- Common import order:
  1. framework/runtime
  2. aliased app imports (`$lib`, `$app`, `@`)
  3. components
  4. type imports

## Formatting Rules

From `.prettierrc`:

- tabs
- single quotes
- no trailing commas
- `printWidth: 100`
- plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
  Let formatter plugins handle Tailwind class ordering.

## Lint + Type Rules

From `eslint.config.js` and `tsconfig.json`:

- JS/TS/Svelte recommended config sets are enabled
- `@typescript-eslint/no-explicit-any`: warning
- `no-undef`: off
- `strict: true`
- `allowJs: true`, `checkJs: true`
- `moduleResolution: bundler`

Practical guidance:

- avoid introducing new `any`
- prefer explicit unions/generics and narrowed types

## Svelte 5 Coding Style in This Repo

- mutable state: `$state(...)`
- derived values: `$derived(...)`
- side effects: `$effect(...)`
- component props: typed `interface Props` + `$props()` destructuring

Observed architecture patterns:

- state composables in `src/lib/stores/*.svelte.ts` expose getters + methods
- API/network logic is centralized under `src/lib/services/*`
- request wrapper is `src/lib/request.ts` (fetch + AbortController timeout)

## Naming Conventions

- components: `PascalCase.svelte`
- route files: SvelteKit defaults (`+page.svelte`, `+layout.ts`, etc.)
- variables/functions: `camelCase`
- interfaces/types: `PascalCase`; many existing models use `I*`
  Match nearby files before introducing a different naming pattern.

## Error Handling Conventions

- wrap network/IO boundaries in `try/catch`
- set user-facing error state for failed request flows
- log context via `console.error` / `console.warn`
- prefer graceful fallback for non-critical failures
- do not silently swallow errors

## Testing Conventions

- Vitest + `@testing-library/svelte/svelte5`
- common style: `describe` + `it/test`
- common mocks: `vi.mock`, `vi.fn`, `vi.clearAllMocks`
- shared test setup: `vitest-setup-client.ts` (`matchMedia`, `localStorage`)

## CI Baseline

Current CI coverage job runs:

```bash
pnpm install
pnpm run coverage
```

Keep coverage-compatible tests green when changing shared logic.

## Cursor / Copilot Rules

Checked:

- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`
  Result: none of these files exist currently.

Update this file when scripts/configs/conventions change.
