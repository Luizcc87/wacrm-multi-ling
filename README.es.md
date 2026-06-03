# wacrm-multi-ling

> Fork de [wacrm](https://github.com/ArnasDon/wacrm) con internacionalización (i18n) completa vía **next-intl**.
> CRM de WhatsApp auto-hospedable — bandeja de entrada compartida, contactos, pipelines, difusiones y automatizaciones — en tres idiomas.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![CI](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?logo=supabase)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-lc1868%2Fwacrm--multi--ling-2496ed?logo=docker)](https://hub.docker.com/r/lc1868/wacrm-multi-ling)

**Leer en:** [English](./README.md) · [Português](./README.pt-BR.md)

---

## Qué es

CRM de WhatsApp auto-hospedable construido sobre Next.js 16 + Supabase Cloud. Este fork agrega internacionalización completa de la UI — cada pantalla, cada etiqueta, cada mensaje — en tres idiomas.

| Idioma | Locale | Prefijo de URL |
|--------|--------|----------------|
| 🇺🇸 Inglés | `en` | `/en/...` |
| 🇪🇸 Español | `es` | `/es/...` |
| 🇧🇷 Portugués (Brasil) | `pt-BR` | `/pt-BR/...` |

Los usuarios cambian de idioma desde el selector en la barra lateral; la preferencia persiste en `localStorage`.

---

## Qué obtienes

- **Bandeja compartida** — múltiples agentes en un número de WhatsApp, asignación, estado, notas
- **Contactos** — etiquetas, campos personalizados, importación CSV, deduplicación
- **Pipelines de ventas** — Kanban con deals vinculados a conversaciones
- **Difusiones** — plantillas aprobadas por Meta, seguimiento de entrega + lectura, sustitución de variables
- **Automatizaciones sin código** — disparadores (mensajes, palabras clave, horario), condiciones, esperas, webhooks
- **Dashboard en tiempo real** — tiempos de respuesta, volumen diario, valor del pipeline, feed de actividad
- **i18n completo** — autenticación, inbox, contactos, pipelines, difusiones, automatizaciones, flows, configuración

---

## Qué está traducido

Autenticación · Dashboard · Inbox (conversaciones, mensajes, compositor, plantillas, sidebar de contacto) · Contactos · Pipelines · Asistente de difusiones · Editor de automatizaciones · Editor de flows · Configuración (perfil, contraseña, apariencia, WhatsApp, plantillas, etiquetas, miembros, sesiones) · Navegación · Elementos de UI con control de roles

---

## Stack

- **App** — Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- **Base de datos** — Supabase Cloud (Postgres + Auth + Realtime + RLS)
- **WhatsApp** — Meta Cloud API (API oficial de WhatsApp Business)
- **i18n** — next-intl 4.x

---

## Quick start

```bash
git clone https://github.com/Luizcc87/wacrm-multi-ling.git
cd wacrm-multi-ling
npm install
cp .env.local.example .env.local   # completar Supabase + credenciales Meta
npm run dev
```

Abrir <http://localhost:3000>.

---

## Docker

```bash
docker pull lc1868/wacrm-multi-ling:latest
```

Multi-arch: `linux/amd64` + `linux/arm64`

- Docker Hub: [hub.docker.com/r/lc1868/wacrm-multi-ling](https://hub.docker.com/r/lc1868/wacrm-multi-ling)
- Guía Docker Swarm: [specs/001-docker-swarm-aarch64/quickstart.md](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## Deploy

Cualquier host Node.js funciona. Recomendado para empezar sin gestionar un servidor:

[![Deploy on Hostinger](https://img.shields.io/badge/Deploy_on-Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)

**[Hostinger Managed Node.js](https://www.hostinger.com/br?REFERRALCODE=PHGLUIZCCVNL)** — conecta tu fork, push a `main`, build y deploy automático. SSL gratuito, logs en el panel, sin SSH.

### Deploy en 60 segundos

1. Haz fork de este repositorio en GitHub
2. En **hPanel → Sitios web → Crear**, elige **Node.js** y conecta tu fork
3. Pega tus variables de entorno Supabase + Meta en hPanel
4. Push a `main` — Hostinger construye y publica

> wacrm tiene licencia MIT y funciona en cualquier lugar que soporte Node.js (Vercel, Railway, tu propio VPS). Hostinger es recomendado, no requerido.

---

## Sync con upstream

Este fork sigue a [wacrm](https://github.com/ArnasDon/wacrm). Para recibir parches del upstream:

```bash
git remote add upstream https://github.com/ArnasDon/wacrm.git
git fetch upstream
git merge upstream/main --no-ff
```

Guía completa: [docs/git-workflow.md](./docs/git-workflow.md)

---

## Repositorios relacionados

| Repo | Descripción |
|------|-------------|
| [wacrm](https://github.com/ArnasDon/wacrm) | Proyecto upstream original |
| [wacrm-multi-api](https://github.com/Luizcc87/wacrm-multi-api) | Siguiente fork: Evolution API v2/Go + integración N8N bidireccional |
| wacrm-ai-agents | Próximamente: agentes IA + Nango OAuth |

---

## Documentación

- [Configuración Supabase](https://wacrm.tech/docs/supabase-setup)
- [Configuración WhatsApp](https://wacrm.tech/docs/whatsapp-setup)
- [Variables de entorno](https://wacrm.tech/docs/environment-variables)
- [Guía Git Workflow](./docs/git-workflow.md)
- [Docs de base de datos](./supabase/README.md)
- [Deploy Docker Swarm](./specs/001-docker-swarm-aarch64/quickstart.md)

---

## Licencia

[MIT](./LICENSE). Fork it, brand it, host it.
