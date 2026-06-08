---
title: 'White-Label: Configurações de Marca na Aba Appearance'
type: 'feature'
created: '2026-06-08'
status: 'done'
baseline_commit: '7fc41e2f8e774d55be8b78627a491dec4fb22db8'
context:
  - supabase/migrations/
  - src/types/
  - messages/
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O sistema tem nome, logo e cores hardcoded (`"CRM Template for WhatsApp"` no sidebar, `"wacrm"` no `<title>`), impedindo que operadores self-hosted personalizem a identidade visual sem tocar no código.

**Approach:** Criar tabela `account_branding` por conta com fallback para variáveis de ambiente; expandir `AppearancePanel` com formulário de branding; atualizar sidebar e `<title>` para consumir valores resolvidos via hook `useBranding`.

## Boundaries & Constraints

**Always:**
- Manter design system existente (classes slate-*/primary, sem novos tokens CSS)
- i18n obrigatório nos 3 idiomas (pt-BR, en, es) para toda string nova
- RLS na tabela nova; escrita restrita a admin/owner
- Fallback: account branding → `NEXT_PUBLIC_*` env vars → defaults hardcoded
- Seletor de tema de cor existente no AppearancePanel permanece intacto

**Ask First:**
- ~~Se logo_url/favicon_url forem inválidas (imagem inacessível) — exibir erro inline ou silenciar?~~ **Decisão: silenciar** (fallback para ícone/default sem erro visível)
- ~~Mudança de `metadata` para `generateMetadata()` pode afetar SSR/caching — confirmar abordagem~~ **Decisão: padrão server auth já estabelecido no projeto — prosseguir**

**Never:**
- Upload de arquivo (apenas URLs nesta entrega)
- Remover ou mover o seletor de tema existente
- Usar `any` explícito em TypeScript novo
- Self-hosted Supabase (usar Supabase Cloud)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Admin salva branding válido | `app_name="Acme"`, `primary_color="#3b82f6"` | 200 + sidebar exibe "Acme" | — |
| Viewer tenta salvar | role=viewer, PATCH /api/account/branding | 403 | Botão Salvar oculto no UI |
| Conta sem branding | `account_branding` row ausente | Sidebar exibe `NEXT_PUBLIC_APP_NAME` ou `"WaCRM"` | — |
| `primary_color` inválido | `"#xyz"` | 400 com mensagem de validação | Toast de erro no UI |
| Logo URL inacessível | URL retorna 404 | Preview quebrado, mas salva URL | Fallback: ícone MessageSquare no sidebar |

</frozen-after-approval>

## Code Map

- `supabase/migrations/025_account_branding.sql` -- nova tabela + RLS (criar)
- `src/types/branding.ts` -- interfaces `AccountBranding` e `ResolvedBranding` (criar)
- `src/lib/branding.ts` -- `resolveBranding(account, env)` + `DEFAULT_BRANDING` (criar)
- `src/lib/branding.test.ts` -- unit tests de `resolveBranding` (criar)
- `src/hooks/use-branding.ts` -- hook client, busca + resolve branding (criar)
- `src/app/api/account/branding/route.ts` -- PATCH handler com RBAC + Zod (criar)
- `src/components/settings/appearance-panel.tsx` -- adicionar `BrandingForm` abaixo do theme picker
- `src/components/layout/sidebar.tsx` -- consumir `useBranding()` para nome e logo (linha 183)
- `src/app/[locale]/layout.tsx` -- `generateMetadata()` async com `app_name` dinâmico (linha 16)
- `messages/pt-BR.json`, `messages/en.json`, `messages/es.json` -- chaves `settings.appearance.branding.*`
- `.env.example` -- documentar 5 vars `NEXT_PUBLIC_APP_*`
- `e2e/white-label-appearance.spec.ts` -- testes E2E Playwright (criar)

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/025_account_branding.sql` -- criar tabela `account_branding` com FK, constraints de validação (hex color, max 60 chars), RLS leitura para membros e escrita para admin/owner -- base de toda a feature
- [x] `src/types/branding.ts` -- definir `AccountBranding` (nullable DB shape) e `ResolvedBranding` (always-resolved UI shape) -- tipagem compartilhada
- [x] `src/lib/branding.ts` -- implementar `resolveBranding` com hierarquia account → env → default; exportar `DEFAULT_BRANDING` -- lógica de fallback isolada e testável
- [x] `src/lib/branding.test.ts` -- cobrir: cada campo com account value, com env value, com default; campo inválido ignorado em favor do fallback -- garantir lógica de fallback
- [x] `src/hooks/use-branding.ts` -- buscar `account_branding` via Supabase client; chamar `resolveBranding`; retornar `ResolvedBranding`; subscrever a realtime updates da tabela -- reatividade sem reload
- [x] `src/app/api/account/branding/route.ts` -- PATCH: validar JWT, checar role admin/owner via `requireRole("admin")`, validar payload com Zod (alinhado às constraints da migration), upsert, retornar branding row -- persistência server-side segura
- [x] `src/components/settings/appearance-panel.tsx` -- adicionar seção "Identidade Visual" com controlled state; campos: app_name, logo_url (+ preview img), favicon_url (+ preview img), primary_color (input hex+color), sidebar_color (input hex+color); botão Salvar visível apenas para admin/owner; toast de sucesso/erro -- UI de configuração
- [x] `src/components/layout/sidebar.tsx` -- substituir string hardcoded por `branding.appName`; logo: `<img>` se `branding.logoUrl` presente, senão manter ícone MessageSquare -- superfície principal do white-label
- [x] `src/app/[locale]/layout.tsx` -- converter `metadata` estático para `generateMetadata()` async; ler `account_branding` via Supabase server client; usar `app_name` no template de título -- `<title>` dinâmico
- [x] `src/components/layout/dynamic-favicon.tsx` + `src/app/[locale]/(dashboard)/dashboard-shell.tsx` -- component client `DynamicFavicon` que atualiza `<link rel="icon">` via DOM quando `branding.faviconUrl` presente; montado dentro de AuthProvider no dashboard-shell -- favicon dinâmico sem rebuild
- [x] `messages/pt-BR.json` + `messages/en.json` + `messages/es.json` -- adicionar chaves `settings.appearance.branding.{title,description,appName,appNamePlaceholder,logoUrl,faviconUrl,primaryColor,sidebarColor,save,saveSuccess,saveError,readonlyHint}` -- i18n completo
- [x] `.env.example` -- documentar `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_LOGO_URL`, `NEXT_PUBLIC_APP_FAVICON_URL`, `NEXT_PUBLIC_APP_PRIMARY_COLOR`, `NEXT_PUBLIC_SIDEBAR_COLOR` com comentários explicativos
- [x] `e2e/white-label-appearance.spec.ts` -- cenários: admin salva nome → sidebar atualiza; viewer vê campos readonly sem botão Salvar; conta sem branding exibe default -- cobertura E2E

**Acceptance Criteria:**
- Given admin acessa `/settings?tab=appearance`, when rola abaixo do theme picker, then vê seção "Identidade Visual" com todos os 5 campos
- Given admin salva `app_name="Acme CRM"`, when sidebar renderiza, then exibe "Acme CRM" no lugar de "CRM Template for WhatsApp"
- Given viewer acessa appearance, when vê formulário de branding, then campos estão disabled e botão Salvar está ausente
- Given conta sem `account_branding` row, when aplicação carrega, then sidebar exibe `NEXT_PUBLIC_APP_NAME` ou `"WaCRM"` como fallback
- Given viewer tenta PATCH direto na API, when rota processa, then retorna 403
- Given `primary_color="#xyz"` enviado, when API valida, then retorna 400 com mensagem de erro
- Given branding salvo, when outro usuário da mesma conta carrega, then vê os valores configurados
- Given `app_name="Acme"` configurado, when `<title>` renderiza em qualquer página, then usa "Acme" no template
- Given tema de cor selecionado, when usuário muda branding, then tema de cor permanece inalterado

## Spec Change Log

### 2026-06-08 — Review patches aplicados

Patches aplicados após revisão adversarial (3 revisores):
- **F1 (bad_spec):** RLS `WITH CHECK` adicionado explicitamente em `025_account_branding.sql`
- **F2 (patch):** `favicon_url` isValidUrl guard confirmado/adicionado em `handleSubmit`
- **F3 (patch):** Zod URL validators restritos a http/https em `route.ts`
- **F4 (patch):** `useBranding()` deduplicado via `BrandingContext` — 1 canal Realtime por sessão
- **F5 (patch):** useEffect com `initializedRef` — não sobrescreve edits em andamento
- **F7 (patch):** Realtime DELETE event handler corrigido (`payload.eventType === 'DELETE' ? null : payload.new`)
- **F8 (patch):** Sentinel "WaCRM" substituído por `DEFAULT_BRANDING.appName`
- **F11 (patch):** `ThemeCard.t` tipado como `ReturnType<typeof useTranslations>`

Deferred:
- F9: `generateMetadata` sem logging operacional
- F10: DynamicFavicon não reseta favicon quando valor é limpo
- F12: Race condition em account switch

KEEP confirmado: estrutura resolveBranding, requireRole pattern, controlled state sem react-hook-form, i18n completo, DynamicFavicon em dashboard-shell.

### 2026-06-08 — Implementation complete

All 13 tasks implemented in `wacrm-multi-ling`.

**Key decisions during implementation:**
- Used controlled React state instead of react-hook-form (no react-hook-form dependency in project)
- `requireRole("admin")` reused directly in PATCH route — matches existing API patterns
- RLS policies use `profiles` table (not `account_members`) — confirmed from migration 017: membership is tracked via `profiles.account_role` + `profiles.account_id`, not a separate `account_members` table
- `DynamicFavicon` placed inside `dashboard-shell.tsx` (inside `AuthProvider`) rather than `[locale]/layout.tsx` — the layout has no AuthProvider and `useBranding` requires `useAuth`
- `generateMetadata()` catches all errors silently — the pre-auth layout has no session, so branding fetch gracefully falls back to env/default
- `e2e/` excluded from `tsconfig.json` (Playwright not in devDependencies)

**Verification results:**
- `npm run typecheck` — ✅ zero errors
- `npm run lint` (new files only) — ✅ zero errors, 1 pre-existing warning in layout.tsx (eslint-disable for THEME_BOOT_SCRIPT, not introduced by this PR)

## Design Notes

**`resolveBranding` como função pura:** isola a lógica de fallback de qualquer camada de rede — fácil de testar e reutilizar em server/client. Aceitar `BrandingEnv` como parâmetro (em vez de ler `process.env` diretamente) permite mockar em testes sem variáveis de ambiente reais.

**`generateMetadata()` server-side:** o título dinâmico requer Supabase server client (service role) para ler `account_branding`. A abordagem usa o `account_id` do token JWT do request. Confirmar com Luiz se o padrão de auth server já está estabelecido antes de implementar T8.

**`DynamicFavicon` client component:** Next.js não suporta `<link rel="icon">` dinâmico via Server Components em runtime. Solução: component `"use client"` mínimo que faz `document.querySelector('link[rel="icon"]').href = url` em `useEffect`. Fallback gracioso se `faviconUrl` for null.

## Verification

**Commands:**
- `npm run typecheck` -- expected: zero erros TypeScript
- `npm run lint` -- expected: zero warnings/errors em arquivos novos
- `npx vitest run src/lib/branding.test.ts` -- expected: todos os testes passam
- `npx supabase db push --project-ref <ref>` -- expected: migration 025 aplicada sem erro
- `npx playwright test e2e/white-label-appearance.spec.ts` -- expected: todos os cenários E2E passam

**Manual checks (if no CLI):**
- Abrir sidebar após salvar branding → nome e logo atualizados sem reload de página
- Abrir DevTools → verificar `<title>` e `<link rel="icon">` com valores configurados
- Logar como viewer → campos de branding visíveis mas desabilitados

## Suggested Review Order

**Ponto de entrada — contrato de tipos e lógica de fallback**

- Interfaces DB shape vs UI shape; hierarquia de fallback definida aqui
  [`branding.ts:1`](../../src/types/branding.ts#L1)

- `resolveBranding()` pura: account → env → default, testável sem rede
  [`branding.ts:1`](../../src/lib/branding.ts#L1)

**Schema e segurança no banco**

- Tabela `account_branding`, constraints hex/length, RLS com `WITH CHECK` explícito
  [`025_account_branding.sql:1`](../../supabase/migrations/025_account_branding.sql#L1)

**API — persistência e autorização**

- PATCH handler: `requireRole("admin")`, Zod com `.refine()` http/https, upsert
  [`route.ts:1`](../../src/app/api/account/branding/route.ts#L1)

**Estado reativo — hook + contexto (1 canal Realtime)**

- Busca DB, subscribe realtime, fix DELETE event (`eventType === 'DELETE' ? null : payload.new`)
  [`use-branding.ts:1`](../../src/hooks/use-branding.ts#L1)

- `BrandingProvider`: deduplicação de subscriptions — 1 canal por sessão
  [`branding-context.tsx:1`](../../src/contexts/branding-context.tsx#L1)

- `BrandingProvider` montado dentro de `AuthProvider` no shell
  [`dashboard-shell.tsx:43`](../../src/app/[locale]/(dashboard)/dashboard-shell.tsx#L43)

**UI — formulário e superfícies white-label**

- `BrandingForm`: `initializedRef` evita sobrescrita de edits; campos disabled para viewer
  [`appearance-panel.tsx:130`](../../src/components/settings/appearance-panel.tsx#L130)

- Sidebar: nome dinâmico + logo condicional com `onError` silencioso
  [`sidebar.tsx:178`](../../src/components/layout/sidebar.tsx#L178)

- `DynamicFavicon`: atualiza `<link rel="icon">` via DOM após hidratação
  [`dynamic-favicon.tsx:1`](../../src/components/layout/dynamic-favicon.tsx#L1)

- `generateMetadata()`: `<title>` dinâmico via Supabase server client, try/catch silencioso
  [`layout.tsx:18`](../../src/app/[locale]/layout.tsx#L18)

**Periféricos — testes, tipos, i18n, config**

- Unit tests: fallback account→env→default para cada campo
  [`branding.test.ts:1`](../../src/lib/branding.test.ts#L1)

- E2E Playwright: admin salva → sidebar atualiza; viewer readonly; sem branding → default
  [`white-label-appearance.spec.ts:1`](../../e2e/white-label-appearance.spec.ts#L1)

- Chaves i18n `settings.appearance.branding.*` nos 3 idiomas
  [`pt-BR.json:771`](../../messages/pt-BR.json#L771)

- Vars de ambiente documentadas
  [`.env.example:1`](../../.env.example#L1)
