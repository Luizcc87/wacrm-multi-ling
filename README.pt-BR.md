# wacrm-multi-ling

> Fork do [wacrm](https://github.com/ArnasDon/wacrm) com internacionalização (i18n) completa via **next-intl**.
> CRM WhatsApp self-hostable — inbox compartilhado, contatos, pipelines, broadcasts e automações — em três idiomas.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![CI](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?logo=supabase)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-lc1868%2Fwacrm--multi--ling-2496ed?logo=docker)](https://hub.docker.com/r/lc1868/wacrm-multi-ling)

**Leia em:** [English](./README.md) · [Español](./README.es.md)

---

## O que é

CRM WhatsApp self-hostable construído em Next.js 16 + Supabase Cloud. Este fork adiciona internacionalização completa da UI — cada tela, cada label, cada mensagem — em três idiomas.

| Idioma | Locale | Prefixo de URL |
|--------|--------|----------------|
| 🇺🇸 Inglês | `en` | `/en/...` |
| 🇪🇸 Espanhol | `es` | `/es/...` |
| 🇧🇷 Português (Brasil) | `pt-BR` | `/pt-BR/...` |

O usuário troca de idioma pelo seletor na barra lateral; a preferência persiste em `localStorage`.

---

## O que você tem

- **Inbox compartilhado** — múltiplos agentes em um número WhatsApp, atribuição, status, notas
- **Contatos** — tags, campos personalizados, importação CSV, deduplicação
- **Pipelines de vendas** — Kanban com deals vinculados a conversas
- **Broadcasts** — templates aprovados pela Meta, rastreamento de entrega + leitura, substituição de variáveis
- **Automações sem código** — gatilhos (mensagens, palavras-chave, horário), condições, esperas, webhooks
- **Dashboard em tempo real** — tempos de resposta, volume diário, valor do pipeline, feed de atividades
- **i18n completo** — autenticação, inbox, contatos, pipelines, broadcasts, automações, flows, configurações

---

## O que está traduzido

Autenticação · Dashboard · Inbox (conversas, mensagens, compositor, templates, sidebar de contato) · Contatos · Pipelines · Wizard de broadcasts · Editor de automações · Editor de flows · Configurações (perfil, senha, aparência, WhatsApp, templates, tags, membros, sessões) · Navegação · Elementos de UI com controle de papel

---

## Stack

- **App** — Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- **Banco** — Supabase Cloud (Postgres + Auth + Realtime + RLS)
- **WhatsApp** — Meta Cloud API (API oficial do WhatsApp Business)
- **i18n** — next-intl 4.x

---

## Quick start

```bash
git clone https://github.com/Luizcc87/wacrm-multi-ling.git
cd wacrm-multi-ling
npm install
cp .env.local.example .env.local   # preencher Supabase + credenciais Meta
npm run dev
```

Abra <http://localhost:3000>.

---

## Docker

```bash
docker pull lc1868/wacrm-multi-ling:latest
```

Multi-arch: `linux/amd64` + `linux/arm64`

- Docker Hub: [hub.docker.com/r/lc1868/wacrm-multi-ling](https://hub.docker.com/r/lc1868/wacrm-multi-ling)
- Guia Docker Swarm: [specs/001-docker-swarm-aarch64/quickstart.md](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## Deploy

Qualquer host Node.js funciona. Recomendado para começar sem gerenciar servidor:

[![Deploy on Hostinger](https://img.shields.io/badge/Deploy_on-Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)

**[Hostinger Managed Node.js](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)** — conecta o fork, push para `main`, build e deploy automático. SSL gratuito, logs no painel, sem SSH.

### Deploy em 60 segundos

1. Faça fork deste repositório no GitHub
2. Em **hPanel → Sites → Criar**, escolha **Node.js** e conecte o fork
3. Cole as variáveis de ambiente Supabase + Meta no hPanel
4. Push para `main` — Hostinger builda e sobe

> wacrm tem licença MIT e roda em qualquer lugar que suporte Node.js (Vercel, Railway, seu próprio VPS). Hostinger é recomendado, não obrigatório.

---

## Sync com upstream

Este fork acompanha o [wacrm](https://github.com/ArnasDon/wacrm). Para receber patches do upstream:

```bash
git remote add upstream https://github.com/ArnasDon/wacrm.git
git fetch upstream
git merge upstream/main --no-ff
```

Guia completo: [docs/git-workflow.md](./docs/git-workflow.md)

---

## Repositórios relacionados

| Repo | Descrição |
|------|-----------|
| [wacrm](https://github.com/ArnasDon/wacrm) | Projeto upstream original |
| [wacrm-multi-api](https://github.com/Luizcc87/wacrm-multi-api) | Próximo fork: Evolution API v2/Go + integração N8N bidirecional |
| wacrm-ai-agents | Em breve: agentes IA + Nango OAuth |

---

## Documentação

- [Configuração Supabase](https://wacrm.tech/docs/supabase-setup)
- [Configuração WhatsApp](https://wacrm.tech/docs/whatsapp-setup)
- [Variáveis de ambiente](https://wacrm.tech/docs/environment-variables)
- [Guia Git Workflow](./docs/git-workflow.md)
- [Docs do banco](./supabase/README.md)
- [Deploy Docker Swarm](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## Licença

[MIT](./LICENSE). Fork it, brand it, host it.
