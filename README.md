# Michael Spencer's Tools

Small, single-purpose browser tools, live at **[tools.mspencer.io](https://tools.mspencer.io)**. It's inspired by Simon Willison's [tools.simonwillison.net](https://tools.simonwillison.net).

## Tools

- [Username Generator](https://tools.mspencer.io/username-generator): random, friendly usernames like `BraveOtter42`.

## Development

You'll need Node 24 or later and pnpm (the exact version is pinned in `package.json`).

```sh
pnpm install
pnpm dev      # start the dev server
pnpm check    # typecheck, lint, format check and tests
```

The site is built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui and TanStack Router. Cloudflare Workers deploys it automatically on every push to `master`.
