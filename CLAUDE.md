# Michael Spencer's Tools

A collection of small, single-purpose browser tools at https://tools.mspencer.io, in the spirit of tools.simonwillison.net.

Stack: Vite, React 19, TypeScript, Tailwind v4, shadcn/ui (Base UI, `base-nova` style), and TanStack Router with file-based routes. It's a static SPA served by Cloudflare Workers static assets. There's no backend.

## Commands

- `pnpm dev` starts the dev server.
- `pnpm check` runs typecheck, ESLint, the Prettier check and Vitest. It must pass before committing.
- `pnpm format` runs Prettier.
- `pnpm build` writes the production build to `dist/`.

## Adding a tool

1. **Create one route file**, `src/routes/<tool-name>.tsx`. Use a kebab-case path with no `/tools/` prefix. The route generator picks it up automatically; never edit `src/routeTree.gen.ts`.
2. **Declare `staticData: { title, description }`.** The homepage lists every route that has a `title`, so there's no separate registry. Keep the description to one line.
3. **Set the page title** with `head: () => ({ meta: [{ title: pageTitle(TITLE) }] })` from `@/lib/site`.
4. **Put the tool's settings in the URL.**
   - Declare a Zod schema in `validateSearch`, with `.default(x).catch(x)` on each field so bad or missing values fall back to defaults.
   - Add `search: { middlewares: [stripSearchParams(defaults)] }` so default values stay out of the URL.
   - Update settings with `navigate({ search: (prev) => ({ ...prev, key }), replace: true })`.
   - Purely personal state, like history or favourites, goes in `localStorage`, not the URL.
5. **Keep the route options in TanStack's order** (`staticData`, `validateSearch`, `search`, `head`, `component`). The `@tanstack/router/create-route-property-order` lint rule enforces this, because type inference depends on it.
6. **Put pure logic in `src/lib/<tool-name>/`** with a `*.test.ts` file next to it. Components stay thin, and logic gets unit tests (there are no component or e2e tests).
7. **Use shadcn/ui components.** Add new ones with `pnpm dlx shadcn@latest add <name>`. Files in `src/components/ui/` are generated: don't hand-edit them (they're excluded from ESLint).

See `src/routes/username-generator.tsx` for a complete example.

## Conventions

- **Client-side only.** If a tool needs an API key, the user pastes it in and it's kept in `localStorage`.
- **Randomness** that matters uses `crypto.getRandomValues`, never `Math.random` (see `cryptoRandomInt` in `src/lib/username/username.ts`).
- **Imports** use the `@/` alias for `src/`.
- **Formatting** is Prettier: no semicolons, and Tailwind classes sorted by `prettier-plugin-tailwindcss`.

## Branch and deploy

- Work on `master`.
- Cloudflare Workers Builds deploys `master` to production. Other branches get preview URLs.
- The config is in `wrangler.jsonc`. `pnpm run deploy` is the manual fallback.
- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TypeScript 7 yet. Bump it once typescript-eslint does.
