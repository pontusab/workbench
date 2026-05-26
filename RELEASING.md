# Releasing

Releases are cut manually by maintainers. No Changesets, no automation — just a short checklist.

## Prerequisites

- You are logged in to npm as an owner of `@getworkbench` (`npm whoami`).
- 2FA device available for `npm publish` OTP prompts.
- `bun` installed locally.

## 0.1.0-alpha.0 (first publish)

One-time: create the scope if it doesn't exist yet.

```bash
npm org create getworkbench --scope=@getworkbench
```

Then, from the repo root:

```bash
# 1. Clean build
bun i
bun run build
bun run typecheck
bun run lint

# 2. Bump all publishable packages to the alpha version
for p in core hono cli; do
  (cd packages/$p && npm version 0.1.0-alpha.0 --no-git-tag-version)
done

# 3. Publish core first (hono depends on it)
(cd packages/core && npm publish --access public --tag alpha)
(cd packages/hono && npm publish --access public --tag alpha)
(cd packages/cli  && npm publish --access public --tag alpha)

# 4. Commit + tag
git commit -am "release: 0.1.0-alpha.0"
git tag v0.1.0-alpha.0
git push && git push --tags

# 5. Smoke test in a scratch project
mkdir -p /tmp/wb-smoke && cd /tmp/wb-smoke
bun init -y
bun add hono bullmq
bunx @getworkbench/cli@alpha init --yes --no-docker
```

## Stable release (0.1.x, 0.2.x, 0.3.x…)

Same flow, swap `--tag alpha` for the default latest tag. **All adapter
packages must bump together** because they share `@getworkbench/core` via
`workspace:*`, and the published tarballs need a real version range.

```bash
# 1. Bump core + every adapter in lockstep. `npm version` does not handle
#    `workspace:*` deps, so edit the `"version"` field in each package.json
#    directly (or use a tiny sed script).
for p in core express fastify next nestjs elysia hono; do
  sed -i.bak -E "s/(\"version\": )\"[^\"]+\"/\\1\"0.3.0\"/" "packages/$p/package.json"
  rm "packages/$p/package.json.bak"
done

# 2. CLI bumps independently — only if its code changed.
# (cd packages/cli && sed -i.bak -E "s/(\"version\": )\"[^\"]+\"/\\1\"0.3.0\"/" package.json && rm package.json.bak)

# 3. Clean rebuild and verify.
bun run --filter '@getworkbench/*' build
bun run typecheck

# 4. Publish in dependency order. `bun publish` rewrites `workspace:*` to a
#    real caret range based on the in-workspace version.
(cd packages/core    && bun publish --access public)
(cd packages/express && bun publish --access public)
(cd packages/fastify && bun publish --access public)
(cd packages/hono    && bun publish --access public)
(cd packages/elysia  && bun publish --access public)
(cd packages/next    && bun publish --access public)
(cd packages/nestjs  && bun publish --access public)  # depends on express + fastify, publish last
# (cd packages/cli   && bun publish --access public)  # only if you bumped it

# 5. Commit, tag, push.
git commit -am "release: 0.3.0"
git tag v0.3.0
git push && git push --tags
```

Then cut a GitHub Release from `v0.3.0` using the `CHANGELOG.md` entry as the body.

## Versioning rules

- Keep `@getworkbench/core` and every framework adapter (`hono`, `express`, `fastify`, `next`, `nestjs`, `elysia`) in **lockstep** (same version). They all consume `core` via `workspace:*` and need the same caret range at publish time.
- `@getworkbench/cli` versions **independently** — its public surface is the command-line flags, not the API. Only bump it when its own code changed.
- Breaking changes (including removing or relocating any export from a package's published surface): bump the minor until 1.0 (`0.2.0`, `0.3.0`...). Patch bumps (`0.x.Y`) are only for non-breaking fixes.

## Vercel

`apps/web` auto-deploys on every push to `main` via the Vercel GitHub integration. No workflow needed in this repo.
