# wacrm-multi-ling

> Fork of [wacrm](https://github.com/ArnasDon/wacrm) with full internationalization (i18n) via **next-intl**.
> Self-hostable WhatsApp CRM — shared inbox, contacts, pipelines, broadcasts, and automations — in three languages.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![CI](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?logo=supabase)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-lc1868%2Fwacrm--multi--ling-2496ed?logo=docker)](https://hub.docker.com/r/lc1868/wacrm-multi-ling)

**Read this in:** [Português](./README.pt-BR.md) · [Español](./README.es.md)

---

## What is it

Self-hostable WhatsApp CRM built on Next.js 16 + Supabase Cloud. This fork adds complete UI internationalization — every screen, every label, every message — across three languages.

| Language | Locale | URL prefix |
|----------|--------|------------|
| 🇺🇸 English | `en` | `/en/...` |
| 🇪🇸 Spanish | `es` | `/es/...` |
| 🇧🇷 Portuguese (Brazil) | `pt-BR` | `/pt-BR/...` |

Users switch language via the sidebar switcher; preference persists in `localStorage`.

---

## What you get

- **Shared inbox** — multiple agents on one WhatsApp number, assignment, status, notes
- **Contacts** — tags, custom fields, CSV import, deduplication
- **Sales pipelines** — Kanban with deals linked to conversations
- **Broadcasts** — Meta-approved templates, delivery + read tracking, variable substitution
- **No-code automations** — triggers (messages, keywords, schedule), conditions, waits, webhooks
- **Real-time dashboard** — response times, daily volume, pipeline value, activity feed
- **Full i18n** — auth, inbox, contacts, pipelines, broadcasts, automations, flows, settings

---

## What is translated

Authentication · Dashboard · Inbox (conversations, messages, composer, templates, contact sidebar) · Contacts · Pipelines · Broadcasts wizard · Automations builder · Flows editor · Settings (profile, password, appearance, WhatsApp config, templates, tags, members, sessions) · Navigation · Role-gated UI elements

---

## Stack

- **App** — Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- **Database** — Supabase Cloud (Postgres + Auth + Realtime + RLS)
- **WhatsApp** — Meta Cloud API (official WhatsApp Business API)
- **i18n** — next-intl 4.x

---

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
