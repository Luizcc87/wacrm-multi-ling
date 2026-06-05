# Story 1.1: Graduar Tab de Equipe (Remover Beta Gate)

## Status: done

## Story

**Como** administrador do sistema,  
**Quero** ver a aba "Equipe" em Configurações sem precisar ativar uma feature flag manual no banco de dados,  
**Para que** eu possa gerenciar minha equipe imediatamente após o deploy.

---

## Acceptance Criteria

- **AC1:** Tab "Equipe" (value `members`) visível em Settings para todos os usuários autenticados, sem checar `profile.beta_features`
- **AC2:** Usuários `viewer` e `agent` veem a aba no menu mas sem botões de mutação (read-only) — comportamento já garantido pelo `MembersTab` existente
- **AC3:** Usuários `admin` e `owner` veem botões de convidar, mudar role, remover membro
- **AC4:** URL `?tab=members` funciona diretamente sem fallback para `profile`
- **AC5:** Nenhuma regressão nas tabs: `profile`, `whatsapp`, `templates`, `tags`, `appearance`
- **AC6:** Zero referências a `ACCOUNT_SHARING_FLAG` ou ao check `accountSharingEnabled` no arquivo após a mudança

---

## Tasks / Subtasks

- [x] **Task 1** — Editar `wacrm-multi-ling/src/app/[locale]/(dashboard)/settings/page.tsx`
  - [x] 1a: Mover `'members'` de `FLAGGED_TAB_VALUES` para `BASE_TAB_VALUES`
  - [x] 1b: Remover const `ACCOUNT_SHARING_FLAG = 'account_sharing'`
  - [x] 1c: Remover `const accountSharingEnabled = ...` (depende de `profile` e `profileLoading`)
  - [x] 1d: Remover a guarda `{accountSharingEnabled && (...)` no `<TabsContent value="members">`
  - [x] 1e: Remover a lógica de fallback `tab = requestedTab === 'members' && !accountSharingEnabled ? 'profile' : requestedTab`
  - [x] 1f: Se `profile` e `profileLoading` do `useAuth()` não forem usados em nenhum outro lugar no arquivo após a mudança, remover o destructure do `useAuth()` e o import se ficar sem uso
  - [x] 1g: Adicionar `UsersRound` (ícone) ao `TabsTrigger` da tab members — verificar se já está presente no JSX existente
- [x] **Task 2** — Verificar que `AccountSettingsForm` (também dentro do tab members) não depende da flag
- [x] **Task 3** — Rodar `npm run typecheck` e `npm run lint` dentro de `wacrm-multi-ling/`
- [x] **Task 4** — Verificar manualmente que Settings abre na tab `profile` por default e que `?tab=members` carrega a tab corretamente

---

## Dev Notes

### Contexto crítico: o arquivo atual

**Arquivo alvo:** `wacrm-multi-ling/src/app/[locale]/(dashboard)/settings/page.tsx`

É um **Client Component** (`'use client'`). Usa `useSearchParams`, `useRouter`, `useTranslations`, `useAuth`.

**Estado atual do arquivo (pontos de mudança):**

```typescript
// ANTES — o que existe hoje:
const BASE_TAB_VALUES = [
  'profile', 'whatsapp', 'templates', 'tags', 'appearance',
] as const;
const FLAGGED_TAB_VALUES = ['members'] as const;           // ← REMOVER esta const
const TAB_VALUES = [...BASE_TAB_VALUES, ...FLAGGED_TAB_VALUES] as const;

const ACCOUNT_SHARING_FLAG = 'account_sharing';            // ← REMOVER

const accountSharingEnabled =                              // ← REMOVER
  !profileLoading &&
  !!profile?.beta_features?.includes(ACCOUNT_SHARING_FLAG);

const tab: TabValue =
  requestedTab === 'members' && !accountSharingEnabled     // ← simplificar
    ? 'profile'
    : requestedTab;

// No JSX:
{accountSharingEnabled && (                                // ← REMOVER wrapper
  <TabsContent value="members">
    <MembersTab />
  </TabsContent>
)}
```

```typescript
// DEPOIS — estado alvo:
const BASE_TAB_VALUES = [
  'profile', 'whatsapp', 'templates', 'tags', 'appearance', 'members',  // ← members aqui
] as const;
// FLAGGED_TAB_VALUES removida
const TAB_VALUES = BASE_TAB_VALUES;                        // ← simplificar ou manter spread

// ACCOUNT_SHARING_FLAG removido

// accountSharingEnabled removido

const tab: TabValue = requestedTab;                        // ← simplificado (isTabValue já valida)

// No JSX:
<TabsContent value="members">                              // ← sem wrapper condicional
  <MembersTab />
</TabsContent>
```

### Atenção: useAuth ainda necessário?

Verificar se `profile` e `profileLoading` são usados em algum outro lugar do arquivo além do check de `accountSharingEnabled`. Se não, remover o destructure e possivelmente o import de `useAuth`. **Não remover se outros campos do `profile` forem usados no arquivo.**

### Comportamento já garantido pelo MembersTab (não precisa reimplementar)

O `MembersTab` (`src/components/settings/members-tab.tsx`) já tem:
- `<RequireRole min="admin">` envolvendo botões de mutação
- `useCan` para guards de UI inline
- RPCs server-side que rejeitam calls não-autorizados

**Não adicionar nenhuma lógica de gate no `settings/page.tsx`** — o MembersTab gerencia isso internamente.

### Tab `AccountSettingsForm`

Dentro do tab `members`, o `AccountSettingsForm` (para editar nome da conta) já está renderizado. Verificar se ele também tem alguma guarda baseada em `accountSharingEnabled` — se tiver, remover junto.

### Project Structure Notes

- **Arquivo:** `wacrm-multi-ling/src/app/[locale]/(dashboard)/settings/page.tsx` — MODIFICAR
- **Não criar arquivos novos** nesta história
- **Não tocar** em `src/components/settings/members-tab.tsx` — já correto
- **Não tocar** em migrations — nenhuma migration necessária nesta história

### References

- Investigação completa: `_bmad-output/implementation-artifacts/investigations/users-permissions-auth-investigation.md` (raiz do workspace)
- Plano arquitetural: conversa com Winston (2026-06-04)
- Settings page atual: `wacrm-multi-ling/src/app/[locale]/(dashboard)/settings/page.tsx`
- MembersTab: `wacrm-multi-ling/src/components/settings/members-tab.tsx`

---

## Dev Agent Record

### Agent Model Used
Codex GPT-5

### Debug Log References
`npm run typecheck` concluído sem erros.
`npm run lint` executado; falhou por erros preexistentes fora do arquivo desta story.

### Completion Notes List
- `members` foi graduada para tab base em `settings/page.tsx`.
- Removi o gate por `account_sharing` e a lógica de fallback para `profile`.
- `MembersTab` e `AccountSettingsForm` permanecem renderizados diretamente no tab `members`.
- `typecheck` passou; `lint` ainda tem erros preexistentes em outros arquivos do projeto.

### File List
- `wacrm-multi-ling/src/app/[locale]/(dashboard)/settings/page.tsx` — MODIFIED
