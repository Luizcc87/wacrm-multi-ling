# Story 1.3: Limpeza do Campo Legado `profiles.role`

## Status: ready-for-dev

## Story

**Como** desenvolvedor do wacrm,  
**Quero** remover o campo `profiles.role TEXT` obsoleto e corrigir o único arquivo que ainda o usa indevidamente,  
**Para que** o schema e o código de autorização sejam inequívocos: somente `account_role` (enum) é a fonte da verdade.

---

## Acceptance Criteria

- **AC1:** Migration `021_cleanup_profiles_legacy_role.sql` criada, idempotente, aplica sem erro
- **AC2:** `conversations/start/route.ts` corrigido para usar `account_role` (via `getCurrentAccount` ou select explícito de `account_role`) em vez do campo `role` legado
- **AC3:** Nenhum arquivo em `src/` faz `SELECT` do campo `profiles.role` após a correção
- **AC4:** TypeScript compila sem erros: `npm run typecheck` passa
- **AC5:** `npm run lint` passa sem warnings novos
- **AC6:** Testes existentes passam (se houver testes cobrindo `conversations/start`)

---

## Tasks / Subtasks

- [ ] **Task 1** — Auditar todos os usos do campo legado `profiles.role`
  - [ ] 1a: Confirmar lista completa com: `grep -rn "select.*'role'\|\.role\b" src/ --include='*.ts' --include='*.tsx'`
  - [ ] 1b: Verificar se `conversations/start/route.ts` é o **único** arquivo que faz `SELECT` de `role` da tabela `profiles` (outros resultados do grep são `account_role` ou role de convite — OK)
  - [ ] 1c: Documentar qualquer outro uso inesperado antes de prosseguir

- [ ] **Task 2** — Corrigir `src/app/api/conversations/start/route.ts`
  - [ ] 2a: Substituir o select manual de `profiles` por `getCurrentAccount()` de `src/lib/auth/account.ts` — retorna `ctx.role` (que é `account_role`) já validado
  - [ ] 2b: Remover o `supabase.from('profiles').select('account_id, role')` manual das linhas 50–54
  - [ ] 2c: Usar `ctx.accountId` e `ctx.role` do context retornado por `getCurrentAccount()`
  - [ ] 2d: Manter o guard `canSendMessages(ctx.role)` — a lógica de autorização é a mesma, apenas a fonte muda
  - [ ] 2e: Tratar `UnauthorizedError` e `ForbiddenError` lançados por `getCurrentAccount()` — mapeá-los para 401/403 com `toErrorResponse(err)` (padrão já usado em outros routes)

- [ ] **Task 3** — Criar migration
  - [ ] 3a: Criar `wacrm-multi-ling/supabase/migrations/021_cleanup_profiles_legacy_role.sql`
  - [ ] 3b: Incluir comentário explicativo sobre por que o campo está sendo removido
  - [ ] 3c: Usar `ALTER TABLE profiles DROP COLUMN IF EXISTS role;` (idempotente)

- [ ] **Task 4** — Verificar TypeScript e testes
  - [ ] 4a: `npm run typecheck` em `wacrm-multi-ling/`
  - [ ] 4b: `npm run lint` em `wacrm-multi-ling/`
  - [ ] 4c: Verificar se há testes para `conversations/start` e executá-los

---

## Dev Notes

### Bug confirmado em `conversations/start/route.ts`

```typescript
// ESTADO ATUAL — BUGADO (linhas 50–67):
const { data: profile } = await supabase
  .from('profiles')
  .select('account_id, role')   // ← 'role' é campo TEXT legado, não o enum 'account_role'
  .eq('user_id', user.id)
  .maybeSingle()

const accountId = profile?.account_id as string | undefined
// ...
const role = profile?.role      // ← lê campo TEXT 'role' (valor: 'user' ou null)
if (!isAccountRole(role) || !canSendMessages(role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
// isAccountRole('user') === false → sempre retorna 403!
// Isto significa que canSendMessages() NUNCA é avaliada — todo pedido de
// iniciar conversa retorna 403 para qualquer usuário que não tenha o campo
// legado preenchido corretamente.
```

**Impacto do bug:** Qualquer instância que passou pela migration 017 (que reescreveu `handle_new_user` para criar `account_role`) mas tem `profiles.role = 'user'` (o default da migration 001) tem `isAccountRole('user') === false`, então a rota retorna 403 para todos os agentes tentando iniciar conversas.

### Correção usando `getCurrentAccount()` (padrão do projeto)

```typescript
// DEPOIS — correto:
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';
import { canSendMessages } from '@/lib/auth/roles';

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentAccount();
    
    if (!canSendMessages(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // ctx.accountId substitui accountId
    // ctx.role é account_role_enum corretamente tipado
    
    const body: StartConversationBody = await request.json();
    // ... resto do handler sem mudanças
    
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', ctx.accountId)   // ← usar ctx.accountId
      .maybeSingle()
    
    // ...
  } catch (err) {
    return toErrorResponse(err);  // trata UnauthorizedError → 401, ForbiddenError → 403
  }
}
```

**Atenção:** `getCurrentAccount()` já faz `supabase.auth.getUser()` internamente. Verificar se a rota faz esse check também — se sim, remover o duplicado para evitar duas chamadas ao Supabase Auth.

### Migration SQL

```sql
-- ============================================================
-- 021_cleanup_profiles_legacy_role.sql
--
-- Remove o campo `profiles.role TEXT` introduzido em 001_initial_schema.
--
-- Contexto: desde a migration 017_account_sharing, a coluna
-- `account_role account_role_enum` é a única fonte de verdade para
-- autorização. O campo `role TEXT` foi mantido por precaução mas
-- nunca foi usado por nenhuma lógica de autorização — apenas por
-- código legado em conversations/start/route.ts (corrigido junto
-- com esta migration).
--
-- Idempotente — safe to run multiple times.
-- ============================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS role;
```

### Verificação de usos residuais antes de aplicar

Executar antes de criar a migration:

```bash
# Na raiz do wacrm-multi-ling
grep -rn "select.*['\"]role['\"]" src/ --include='*.ts' --include='*.tsx' | grep -v account_role
grep -rn "\.role\b" src/ --include='*.ts' --include='*.tsx' | grep -v account_role | grep -v AccountRole | grep -v roleRank
```

Resultado esperado: **somente** `conversations/start/route.ts` (que será corrigido na Task 2).

### Usos que são OK (não são o campo legado)

Os seguintes usos **não** referenciam `profiles.role` — são roles de convites, account_role ou role de membros:

- `account/invitations/route.ts:185` — `body?.role` → role de um convite
- `account/members/[userId]/route.ts:63` — `body?.role` → novo role ao mudar membro
- `account/route.ts:32` — `ctx.role` → account_role do context
- `join/[token]/page.tsx:299` — `peek.role` → role do convite
- `members-tab.tsx` (múltiplas linhas) — roles do AccountRole enum
- `invite-member-dialog.tsx` — role de convite sendo criado

### Ordem de execução recomendada

1. Corrigir `conversations/start/route.ts` (Task 2) **primeiro**
2. Verificar com `typecheck` e `lint`
3. Criar e aplicar migration (Task 3) **depois**

Se a migration for aplicada antes da correção do código e o código ainda referenciar `profiles.role`, o TypeScript não vai reclamar (a query é string-typed pelo Supabase client genérico), mas a query retornará null para `role` em todos os rows.

### Project Structure Notes

- **Arquivo a corrigir:** `wacrm-multi-ling/src/app/api/conversations/start/route.ts` — MODIFICAR
- **Migration nova:** `wacrm-multi-ling/supabase/migrations/021_cleanup_profiles_legacy_role.sql` — CRIAR
- **Não alterar** nenhum outro arquivo de src/ (outros usos de `.role` já são corretos)
- **Não alterar** `src/lib/auth/account.ts` ou `src/lib/auth/roles.ts` — já corretos
- Numeração de migration: confirmar que 021 é o próximo com `find supabase/migrations -name '*.sql' | sort | tail -3`

### References

- `wacrm-multi-ling/src/app/api/conversations/start/route.ts` — arquivo com bug
- `wacrm-multi-ling/src/lib/auth/account.ts` — `getCurrentAccount`, `toErrorResponse`
- `wacrm-multi-ling/src/lib/auth/roles.ts` — `canSendMessages`
- `wacrm-multi-ling/supabase/migrations/001_initial_schema.sql` — onde `role TEXT` foi criado
- `wacrm-multi-ling/supabase/migrations/017_account_sharing.sql` — onde `account_role` foi introduzido

---

## Dev Agent Record

### Agent Model Used
_[preencher após implementação]_

### Debug Log References
_[preencher se necessário]_

### Completion Notes List
_[preencher após implementação]_

### File List
- `wacrm-multi-ling/src/app/api/conversations/start/route.ts` — MODIFIED
- `wacrm-multi-ling/supabase/migrations/021_cleanup_profiles_legacy_role.sql` — CREATED
