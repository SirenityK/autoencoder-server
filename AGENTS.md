# AGENTS.md

## Stack

Vike + SolidJS + Hono (SSR), TailwindCSS v4 + DaisyUI, Telefunc for RPC, BullMQ + Redis for job queues, S3-compatible storage for file I/O, ffmpeg for encoding.

## Commands

| Command | Runtime | Purpose |
|---------|---------|---------|
| `bun run dev` | Bun | Dev server (Vite HMR) |
| `bun run build` | Bun | Production build to `dist/` |
| `bun run prod` | **Node** | Build + start production (`node ./dist/server/index.mjs`) |
| `bun run worker` | Bun | Start BullMQ worker (separate process) |
| `bun run worker:dev` | Bun | Worker with `--watch` |
| `bun run test` | Bun | Bun test suite (local ffmpeg + live S3/Redis/worker integration tests) |
| `bun run lint` | Bun | Biome lint + auto-fix |
| `bun run format` | Bun | Biome format + auto-fix |

**Always lint after editing files.** Run `bun run lint && bun run format` and fix any warnings before declaring work done. Run `bun run test` when touching encoding, S3, queue, worker, or Telefunc flow code. Do not consider work complete unless tests pass — if the full test environment (S3 + worker) is not available, halt and ask the user to start it before adding more code. When building new features, write corresponding tests alongside them so they are verified from the start.

### Biome

Biome is configured with strict lint rules. Common things it will reject:

- TypeScript non-null assertions (`!`) — use proper null checks or optional chaining instead.
- `any` types — use `unknown` and narrow with type guards.
- Unused variables/imports — clean up before linting.
- Missing exhaustive switch cases — add a `default` branch or handle all enum members.
- `console.log` statements (use a proper logger where needed).

Biome auto-fixes formatting on save. Lint violations must be resolved manually — the agent should run `bun run lint` and address every warning before considering work complete.

## Tests

Tests live in `tests/` and use Bun's built-in test runner. They generate tiny ffmpeg media files at runtime instead of relying on checked-in fixtures.

The production-path suite in `tests/integration/bundle-b.test.ts` covers:

- S3 presigned PUT upload and presigned GET download of a generated source video.
- Direct local ffmpeg encode success, asserting playable H264/AAC output with `ffprobe`.
- Direct local ffmpeg encode failure for missing input files.
- Live BullMQ worker integration: upload source to S3, enqueue `"encode"`, wait for completion, fetch encoded output from S3, and inspect it with `ffprobe`.
- Worker failure semantics: missing source objects must mark the BullMQ job as `failed`.
- Telefunc flow: unsupported upload MIME rejection, upload URL creation, missing job status, encode enqueue, completed status, and download URL creation.

Live S3/worker tests require:

- Valid `.env` values for S3 and Redis.
- The configured S3-compatible endpoint reachable from the test process.
- Redis reachable at `REDIS_HOST`.
- A worker already running in a separate process via `bun run worker` or `bun run worker:dev`.
- `ffmpeg` and `ffprobe` on PATH.

The suite includes an S3 endpoint preflight. If S3 is unreachable, that preflight fails clearly and live S3/worker tests are skipped so local encoder tests can still report useful signal.

## Package manager

**Use Bun** for all install and run commands. The lockfile is `bun.lock`.

## Environment

Copy `.env.example` to `.env` and fill in values. All vars are required — validated with valibot in `server/env.ts` on startup.

| Variable | Description |
|----------|-------------|
| `BUCKET_KEY_ID` | S3 access key |
| `BUCKET_SECRET_KEY` | S3 secret key |
| `BUCKET_REGION` | S3 region |
| `BUCKET_NAME` | S3 bucket name |
| `BUCKET_ENDPOINT` | S3 endpoint (must be a valid URL) |
| `REDIS_HOST` | Redis host for BullMQ |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Server-side env is loaded via Vite's `import.meta.env`. Client env vars require a `PUBLIC_ENV__` prefix.

## Architecture

**Two separate processes:**
- **Web server** — Vike + Hono serving the SolidJS SPA + Telefunc RPC handler (`+server.ts` → `server/hono.ts`). Telefunc functions live in `+Page.telefunc.ts` files next to their pages.
- **Worker** — standalone BullMQ worker (`server/worker.ts`) that pulls jobs from Redis, downloads files from S3, runs ffmpeg, and uploads results back to S3. Requires `ffmpeg` and `ffprobe` on PATH.

**Flow:** Client uploads to presigned S3 URL → server enqueues `"encode"` job → worker picks it up, encodes, uploads output → client polls job status and downloads the result via presigned GET URL.

## Conventions

- **`verbatimModuleSyntax: true`** — all type-only imports must use `import type`.
- **Path aliases** (configured in both `tsconfig.json` and `vite.config.ts`):
  - `@lib/*` → `lib/*`
  - `@server/*` → `server/*`
  - `@components/*` → `components/*`
- **CSS classes**: use the `cn()` helper from `@lib/utils` to merge Tailwind classes. Biome enforces sorted classes with `cn`.
- **Do NOT export anything from `server/worker.ts`** — it's a side-effect entry point for the worker process.
- **Validation** uses valibot schemas defined in `@lib/utils/ffmpeg.ts` and `@lib/utils/env.ts`.
- **Encoding settings** descriptors for each codec (H264, H265, AV1, etc.) are in `@lib/utils/ffmpeg.ts` — add new codecs there alongside the existing pattern.
- **Maximum type-safety** is a first-class goal. Follow these patterns everywhere:
  - **Derive types from valibot schemas** with `v.InferOutput` / `v.InferInput` — never write types by hand when a schema exists. See `lib/utils/ffmpeg.ts` for examples.
  - **Const descriptors** use `Object.freeze({...}) satisfies SomeDescriptorType` to get exact literal types and immutability at runtime. Descriptor *types* wrap with `ReadonlyDeep` from `type-fest` to propagate readonly through the type system.
  - **Discriminated unions with `satisfies`** on every Telefunc return value — see `pages/index/+Page.telefunc.ts`. Each return is annotated with `satisfies ServerResponse` so the compiler verifies it against the full discriminated union (`ErroredServerResponse | OkServerResponse`). Errors include an `errorVariant` enum member, non-errors never do. This lets the frontend exhaustively handle every error variant without manual switch/case or type assertions.
  - **Prefer `satisfies` over type annotations** for return expressions — it preserves the narrowest possible types (exact literal values) while still checking against the target type. This gives the frontend the most precise auto-completion and narrows discriminated unions correctly.
