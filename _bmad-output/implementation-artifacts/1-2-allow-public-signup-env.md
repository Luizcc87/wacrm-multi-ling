# Story 1.2: Controle de Registro Público via Variável de Ambiente

## Status: done

## Story

**Como** operador de deploy do wacrm,  
**Quero** definir `ALLOW_PUBLIC_SIGNUP=false` no meu `.env` para desabilitar o auto-cadastro público,  
**Para que** meu sistema opere no modelo invite-only onde somente admins/owners convidam novos usuários.

---

## Acceptance Criteria

- **AC1:** Com `ALLOW_PUBLIC_SIGNUP=false`, acessar `/[locale]/signup` redireciona para `/[locale]/login?reason=invite_only`
- **AC2:** Com `ALLOW_PUBLIC_SIGNUP=false`, o link "Criar conta" na página de login fica oculto
- **AC3:** Com `ALLOW_PUBLIC_SIGNUP=false` E parâmetro `?invite=<token>` na URL de login, o link "Criar conta" **permanece visível** (fluxo de convite em andamento)
- **AC4:** Com `ALLOW_PUBLIC_SIGNUP` ausente ou qualquer valor diferente de `'false'`, comportamento atual é 100% preservado (signup público habilitado, link visível)
- **AC5:** Mensagem informativa visível na tela de login quando `?reason=invite_only` presente no query string
- **AC6:** Chaves i18n adicionadas nos 3 arquivos: `messages/pt-BR.json`, `messages/en.json`, `messages/es.json`
- **AC7:** `.env.example` documenta `ALLOW_PUBLIC_SIGNUP` com comentário explicativo

---

## Tasks / Subtasks

- [x] **Task 1** — Criar Server Component wrapper para `signup/page.tsx`
  - [x] 1a: Criar `wacrm-multi-ling/src/app/[locale]/(auth)/signup/layout.tsx` **OU** converter o export default da página para um Server Component pai que faz o check e renderiza o Client Component interno — ver Dev Notes para a abordagem correta
  - [x] 1b: Lógica: `if (process.env.ALLOW_PUBLIC_SIGNUP === 'false') redirect(/${locale}/login?reason=invite_only)`
  - [x] 1c: Não remover nem alterar o `SignupPageInner` Client Component — só adicionar o guard no nível de Server Component

- [x] **Task 2** — Editar `wacrm-multi-ling/src/app/[locale]/(auth)/login/page.tsx`
  - [x] 2a: Adicionar leitura de `searchParams.get('reason')` (já usa `useSearchParams`)
  - [x] 2b: Renderizar bloco informativo quando `reason === 'invite_only'` — usar chave i18n `auth.login.inviteOnlyNotice`
  - [x] 2c: Controlar visibilidade do link "Criar conta" baseado em `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP !== 'false'` — **exceto** quando `inviteToken` presente (AC3)
  - [x] 2d: Adicionar `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP` como env var lida no Client Component (prefix `NEXT_PUBLIC_` obrigatório para Client Components)

- [x] **Task 3** — Adicionar chaves i18n
  - [x] 3a: `messages/pt-BR.json` → `auth.login.inviteOnlyNotice`
  - [x] 3b: `messages/en.json` → `auth.login.inviteOnlyNotice`
  - [x] 3c: `messages/es.json` → `auth.login.inviteOnlyNotice`

- [x] **Task 4** — Documentar no `.env.example`
  - [x] 4a: Adicionar bloco comentado com `# ALLOW_PUBLIC_SIGNUP=false` e explicação

- [x] **Task 5** — Verificar build
  - [x] 5a: `npm run typecheck` em `wacrm-multi-ling/`
  - [x] 5b: `npm run build` para confirmar que o Server Component não quebra o bundle

---

## Dev Notes

### Problema crítico: signup/page.tsx é Client Component

O arquivo atual `signup/page.tsx` começa com `"use client"`. **Não é possível** usar `redirect()` do Next.js ou ler `process.env.ALLOW_PUBLIC_SIGNUP` diretamente nele.

**Abordagem correta — duas opções:**

**Opção A (recomendada): Wrapper Server Component**

Renomear/reorganizar para que o export default seja um Server Component que lê o env e renderiza o Client Component:

```typescript
// signup/page.tsx — agora Server Component (sem "use client" no topo)
import { redirect } from 'next/navigation';
import { SignupClient } from './signup-client';  // Client Component extraído

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.ALLOW_PUBLIC_SIGNUP === 'false') {
    const { locale } = await params;
    redirect(`/${locale}/login?reason=invite_only`);
  }
  return <SignupClient />;
}
```

```typescript
// signup/signup-client.tsx — "use client" aqui
"use client";
// ... todo o conteúdo atual de SignupPage/SignupPageInner
```

**Opção B: Layout Server Component**

Criar `(auth)/signup/layout.tsx` como Server Component que faz o guard. Mais simples mas menos explícito.

**Use Opção A** — mais clara, mantém o guard co-localizado com a página.

### Env var: dois nomes, dois contextos

| Var | Contexto | Uso |
|---|---|---|
| `ALLOW_PUBLIC_SIGNUP` | Server-side only | Guard no Server Component `signup/page.tsx` |
| `NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP` | Client + Server | Controle de visibilidade do link em `login/page.tsx` (Client Component) |

Ambas devem ter o mesmo valor no `.env`. Documentar as **duas** no `.env.example`.

### Login page: dois controles distintos

```typescript
// login/page.tsx — LoginPageInner (Client Component)
const reason = searchParams.get('reason');
const signupLinkVisible =
  process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP !== 'false' || !!inviteToken;
// AC3: inviteToken sempre mostra o link, independente da flag

// Mostrar aviso:
{reason === 'invite_only' && (
  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
    {t('inviteOnlyNotice')}
  </div>
)}

// Controlar link:
{signupLinkVisible && (
  <p className="mt-6 text-center text-sm text-slate-400">
    {t("noAccount")}{" "}
    <Link href={inviteToken ? `/signup?invite=...` : "/signup"}>
      {t("createAccount")}
    </Link>
  </p>
)}
```

### Valores i18n a adicionar

**`messages/pt-BR.json`** — dentro de `auth.login`:
```json
"inviteOnlyNotice": "Este sistema usa convites. Peça um link ao administrador para criar sua conta."
```

**`messages/en.json`** — dentro de `auth.login`:
```json
"inviteOnlyNotice": "This system uses invitations. Ask an administrator for an invite link to create your account."
```

**`messages/es.json`** — dentro de `auth.login`:
```json
"inviteOnlyNotice": "Este sistema usa invitaciones. Pide a un administrador un enlace de invitación para crear tu cuenta."
```

### `.env.example` — bloco a adicionar

```bash
# ============================================================
# CONTROLE DE REGISTRO PÚBLICO
# ============================================================
# Quando definido como 'false', desabilita o auto-cadastro público.
# Novos usuários só entram via convite de um admin ou owner.
# O link "Criar conta" na tela de login também é ocultado.
# Padrão (ausente ou qualquer outro valor): signup público habilitado.
#
# IMPORTANTE: Defina AMBAS as variáveis com o mesmo valor.
#   ALLOW_PUBLIC_SIGNUP         → lida pelo servidor (guard na rota /signup)
#   NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP → lida pelo cliente (oculta link de login)
#
# ALLOW_PUBLIC_SIGNUP=false
# NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP=false
```

### Localização dos arquivos

- `wacrm-multi-ling/src/app/[locale]/(auth)/signup/page.tsx` — MODIFICAR (tornar Server Component wrapper)
- `wacrm-multi-ling/src/app/[locale]/(auth)/signup/signup-client.tsx` — CRIAR (Client Component extraído)
- `wacrm-multi-ling/src/app/[locale]/(auth)/login/page.tsx` — MODIFICAR (adicionar reason + signupLinkVisible)
- `wacrm-multi-ling/messages/pt-BR.json` — MODIFICAR
- `wacrm-multi-ling/messages/en.json` — MODIFICAR
- `wacrm-multi-ling/messages/es.json` — MODIFICAR
- `wacrm-multi-ling/.env.example` — MODIFICAR

### Regressões a prevenir

- Fluxo de convite via `?invite=<token>` na signup page deve continuar funcionando — o redirect não deve ocorrer quando `?invite=` está presente mesmo com `ALLOW_PUBLIC_SIGNUP=false` (usuário foi convidado explicitamente)
- **Atenção:** Com `ALLOW_PUBLIC_SIGNUP=false`, o convite redireciona para `/login?invite=<token>`, não para `/signup`. O `/signup` com flag `false` redireciona incondicionalmente. Isso é **correto** — o fluxo de convite passa por login → join/[token], não por signup direto.
- `emailRedirectTo` no signup continua funcionando para confirmação de email após criação de conta via convite — não remover essa lógica do `SignupClient`

### Stack e convenções relevantes

- Next.js 16.2.6 App Router — `params` é `Promise<{locale: string}>` em Server Components, usar `await params`
- `redirect()` de `'next/navigation'` funciona em Server Components
- `process.env.NEXT_PUBLIC_*` disponível em Client Components em build time
- `useTranslations('auth.login')` — namespace já existe, só adicionar chave `inviteOnlyNotice`

### Project Structure Notes

- Não alterar nenhuma migration
- Não alterar `src/middleware.ts` — o middleware já protege rotas autenticadas corretamente
- `signup/page.tsx` atual: Client Component com `Suspense` wrapper + `SignupPageInner` inner component — manter a estrutura Suspense no Client Component extraído

### References

- Login page: `wacrm-multi-ling/src/app/[locale]/(auth)/login/page.tsx`
- Signup page: `wacrm-multi-ling/src/app/[locale]/(auth)/signup/page.tsx`
- Middleware: `wacrm-multi-ling/src/middleware.ts`
- `.env.example`: `wacrm-multi-ling/.env.example`

---

## Dev Agent Record

### Agent Model Used
Codex GPT-5

### Debug Log References
`npm run typecheck` concluído sem erros.
`npm run build` concluído com sucesso; Next.js gerou todas as páginas sem falha.

### Completion Notes List
- Convertemos `/signup` para Server Component wrapper com redirect quando `ALLOW_PUBLIC_SIGNUP === 'false'`.
- Extraí o conteúdo atual para `src/app/[locale]/(auth)/signup/signup-client.tsx` com `Suspense` mantido no client.
- `login/page.tsx` agora oculta o link de cadastro quando a flag pública está desativada, exceto quando há `inviteToken`.
- Adicionei o aviso `invite_only` via i18n nos três arquivos de mensagens e documentei as duas variáveis no exemplo de ambiente.

### File List
- `wacrm-multi-ling/src/app/[locale]/(auth)/signup/page.tsx` — MODIFIED
- `wacrm-multi-ling/src/app/[locale]/(auth)/signup/signup-client.tsx` — CREATED
- `wacrm-multi-ling/src/app/[locale]/(auth)/login/page.tsx` — MODIFIED
- `wacrm-multi-ling/messages/pt-BR.json` — MODIFIED
- `wacrm-multi-ling/messages/en.json` — MODIFIED
- `wacrm-multi-ling/messages/es.json` — MODIFIED
- `wacrm-multi-ling/.env.example` — MODIFIED
