# wacrm-multi-ling

> Fork of [wacrm](https://github.com/ArnasDon/wacrm) with full internationalization (i18n) via **next-intl**.
> Self-hostable WhatsApp CRM — shared inbox, contacts, pipelines, broadcasts, and automations — in three languages.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![CI](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)](https://supabase.com)
[![Stars](https://img.shields.io/github/stars/ArnasDon/wacrm?style=social)](https://github.com/ArnasDon/wacrm/stargazers)

The marketing site and self-host docs live in a separate repo:
[ArnasDon/wacrm-site](https://github.com/ArnasDon/wacrm-site)
([wacrm.tech](https://wacrm.tech)). This repo is the product —
clone or fork it to run your own CRM.

## What you get out of the box

- **Shared inbox** on the official WhatsApp Business API — multiple
  agents working one number, per-conversation assignment, status, and
  notes.
- **Contacts + tags + custom fields**, CSV import, deduplication.
- **Sales pipelines** (Kanban) with deals linked to conversations.
- **Broadcasts** with Meta-approved templates, delivery + read
  tracking, per-recipient variable substitution.
- **No-code automations** — triggers on inbound messages, new
  contacts, keywords, or schedule; conditional branches, waits,
  tags, webhooks. Visual builder.
- **AI reply assistant** — bring your own OpenAI or Anthropic key
  (stored encrypted; no per-seat AI fee, your data stays yours).
  One-click AI-drafted replies in the inbox, plus an optional
  auto-reply bot with a per-conversation cap and clean human handoff.
  Add a **knowledge base** (FAQs, policies, product docs) and it
  answers from your own content — hybrid retrieval (Postgres full-text,
  or semantic pgvector when an embeddings key is set).
- **Real-time dashboard** — response times, daily volume, pipeline
  value, cross-module activity feed.
- **Team accounts** — invite teammates by link, role-based access
  (owner / admin / agent / viewer), ownership transfer. Every install
  is account-scoped, so one shared inbox can be staffed by a whole
  team. Solo use stays single-user with zero setup.
- **Account management** — email, password, avatar, global sign-out.
- **Public REST API** (`/api/v1`) with scoped, revocable API keys —
  build your own automations on top of your CRM. See
  [docs/public-api.md](./docs/public-api.md).
- **MCP server** — drive your CRM from Claude, Cursor, and other AI
  assistants over the [Model Context Protocol](https://modelcontextprotocol.io).
  Read-only by default, opt-in writes. See [docs/mcp.md](./docs/mcp.md)
  (server in [`mcp-server/`](./mcp-server)).

## Why fork this?

This is a **template**, not a product. Forking means you get:

- **Full ownership** — your code, your Supabase project, your domain,
  your data. No SaaS lock-in, no seat pricing, no trust dance.
- **Full customisation** — add the fields your team needs, remove the
  modules you don't, redesign anything. The stack is boring on
  purpose (Next.js + Supabase + Tailwind) so the learning curve is
  short.
- **Zero ops to start** — [Hostinger](https://www.hostinger.com/web-apps-hosting)
  Managed Node.js deploys a fork in a few clicks. No Docker, no
  Kubernetes, no infra team needed.
  ([See below ↓](#-deploy-on-hostinger-recommended))
- **Real security primitives** — token encryption (AES-256-GCM), RLS
  on every table, HMAC-verified webhooks, CSP, rate limiting, CI
  typecheck/build on every PR.

Not a framework. Not an SDK. A concrete, working CRM you can stand up
in an afternoon and make yours.

## Quick start

```bash
git clone https://github.com/Luizcc87/wacrm-multi-ling.git
cd wacrm-multi-ling
npm install
cp .env.local.example .env.local   # fill in Supabase + Meta credentials
npm run dev
```

Open <http://localhost:3000>.

---

## Docker

```bash
docker pull lc1868/wacrm-multi-ling:latest
```

Multi-arch: `linux/amd64` + `linux/arm64`

- Docker Hub: [hub.docker.com/r/lc1868/wacrm-multi-ling](https://hub.docker.com/r/lc1868/wacrm-multi-ling)
- Docker Swarm guide: [specs/001-docker-swarm-aarch64/quickstart.md](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## Deploy

Any Node.js host works. Recommended for getting started without managing a server:

[![Deploy on Hostinger](https://img.shields.io/badge/Deploy_on-Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)

**[Hostinger Managed Node.js](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)** — connect your fork, push to `main`, automatic build and deploy. Free SSL, logs in the panel, no SSH needed.

### 60-second deploy

1. Fork this repo on GitHub
2. In **hPanel → Websites → Create**, pick **Node.js** and connect your fork
3. Paste your Supabase + Meta env vars into hPanel
4. Push to `main` — Hostinger builds and serves it

> wacrm is MIT-licensed and runs anywhere Node.js does (Vercel, Railway, your own VPS). Hostinger is recommended, not required.

---

## Upstream sync

This fork tracks [wacrm](https://github.com/ArnasDon/wacrm). To pull upstream patches:

```bash
git remote add upstream https://github.com/ArnasDon/wacrm.git
git fetch upstream
git merge upstream/main --no-ff
```

Full workflow: [docs/git-workflow.md](./docs/git-workflow.md)

---

## Related repositories

| Repo | Description |
|------|-------------|
| [wacrm](https://github.com/ArnasDon/wacrm) | Original upstream project |
| [wacrm-multi-api](https://github.com/Luizcc87/wacrm-multi-api) | Next fork: Evolution API v2/Go + N8N bidirectional integration |
| wacrm-ai-agents | Upcoming: AI agents + Nango OAuth |

---

## Documentation

- [Supabase setup](https://wacrm.tech/docs/supabase-setup)
- [WhatsApp setup](https://wacrm.tech/docs/whatsapp-setup)
- [Environment variables](https://wacrm.tech/docs/environment-variables)
- [Git Workflow Guide](./docs/git-workflow.md)
- [Database docs](./supabase/README.md)
- [Docker Swarm deployment](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## License

[MIT](./LICENSE). Fork it, brand it, host it.
