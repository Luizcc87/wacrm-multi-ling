# Registro de implementação — correções WhatsApp, contatos, templates e i18n

**Projeto:** wacrm-multi-ling
**Data:** 2026-06-04
**Tipo:** Artefato de implementação BMAD
**Status:** Implementado e publicado em Docker Hub
**Imagem:** `lc1868/wacrm-multi-ling:latest`
**Digest publicado:** `sha256:3ed785fcc9c135bdf7d40d621a48dbad669325a596beb7bdb989d2c67ba79990`

---

## Resumo

Esta rodada corrigiu problemas operacionais encontrados durante a configuração da Meta Cloud API, criação de contatos e uso da UI multilíngue. As mudanças cobrem:

- correção de schema Supabase para salvar configuração WhatsApp;
- correção de RLS ao criar/importar contatos;
- correção de mojibake no locale `en`;
- internacionalização da página de contatos;
- melhoria de diagnóstico do sync de templates da Meta;
- ajuste do build Docker para publicar a imagem correta.

---

## Problemas corrigidos

### 1. WhatsApp config retornava erro 500 ao salvar

**Sintoma:** o container registrava erro `PGRST204` informando ausência da coluna `last_registration_error` em `whatsapp_config`.

**Causa:** a imagem estava mais nova que o schema Supabase aplicado.

**Correção operacional aplicada no Supabase:**

```sql
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscribed_apps_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_registration_error TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_registered_at
  ON whatsapp_config (registered_at)
  WHERE registered_at IS NULL;
```

**Resultado:** configuração WhatsApp passou a salvar e o webhook Meta validou corretamente:

```text
GET /api/whatsapp/webhook?...hub.challenge=teste123
teste123
```

### 2. Novo contato retornava 403 no Supabase REST

**Sintoma:** `POST /rest/v1/contacts?select=id` retornava `403`.

**Causa:** após `017_account_sharing`, a política RLS `contacts_insert` exige `account_id`, mas o formulário de contato e o importador CSV ainda inseriam apenas `user_id`.

**Correção:**

- `src/components/contacts/contact-form.tsx`
- `src/components/contacts/import-modal.tsx`

Ambos agora carregam `profiles.account_id` do usuário autenticado e incluem `account_id` no insert de `contacts`.

### 3. Mojibake no locale inglês

**Sintoma:** textos em `/en/settings` e outras telas apareciam como `WhatsAppÂ®`, `â€”`, `â€¦`, `â†’`.

**Causa:** `messages/en.json` continha sequências UTF-8 mal decodificadas gravadas no arquivo.

**Correção:**

- normalização das strings afetadas em `messages/en.json`;
- restauração de `WhatsApp®` correto;
- criação de `scripts/check-mojibake.mjs`;
- adição do script `npm run check:mojibake`.

**Validação esperada:**

```bash
npm run check:mojibake
```

### 4. Página `/contacts` não respeitava locale

**Sintoma:** `/en/contacts`, `/es/contacts` e `/pt-BR/contacts` exibiam textos em inglês:

- `Contacts`
- `Manage your contact list`
- `Add Contact`
- labels da tabela, busca, paginação, modal de exclusão.

**Correção:**

- `src/app/[locale]/(dashboard)/contacts/page.tsx` agora usa `useTranslations('contacts')`;
- datas usam `useLocale()` em vez de `en-US` fixo;
- novas chaves foram adicionadas em:
  - `messages/en.json`
  - `messages/es.json`
  - `messages/pt-BR.json`

**Observação:** a varredura encontrou outros pontos de i18n incompleto fora de contatos, principalmente em `broadcasts`, `flows`, `automations` e partes de `pipelines`. Esses pontos ficaram como backlog.

### 5. Sync de templates da Meta mostrava erro pouco acionável

**Sintoma:** o toast exibia apenas:

```text
Failed to sync: 3p_direct_integration_test_template (en_US), hello_world (en_US)
```

**Correções:**

- `src/components/settings/template-manager.tsx` agora inclui a mensagem técnica por template;
- `src/app/api/whatsapp/templates/sync/route.ts` ficou mais tolerante a linhas locais antigas duplicadas, buscando a linha mais recente por `(account_id, name, language)`.

**Migration criada:**

- `supabase/migrations/022_message_templates_account_unique.sql`

Ela troca a unicidade legada de templates de `user_id` para `account_id`:

```sql
DROP INDEX IF EXISTS message_templates_user_name_language_key;

CREATE UNIQUE INDEX IF NOT EXISTS message_templates_account_name_language_key
  ON message_templates (account_id, name, language);
```

**Ação operacional necessária:** aplicar a migration no Supabase antes de depender do novo comportamento em produção.

### 6. Script de build Docker publicava imagem errada

**Sintoma:** `deploy/build.sh` apontava para `lc1868/wacrm:latest`, enquanto o stack usa `lc1868/wacrm-multi-ling:latest`.

**Correção:**

- `deploy/build.sh` agora publica `lc1868/wacrm-multi-ling:latest`.

---

## Arquivos alterados

### Código

- `src/components/contacts/contact-form.tsx`
- `src/components/contacts/import-modal.tsx`
- `src/app/[locale]/(dashboard)/contacts/page.tsx`
- `src/app/[locale]/(dashboard)/dashboard-shell.tsx`
- `src/app/api/whatsapp/templates/sync/route.ts`
- `src/components/settings/template-manager.tsx`

### Mensagens i18n

- `messages/en.json`
- `messages/es.json`
- `messages/pt-BR.json`

### Infra e validação

- `deploy/build.sh`
- `package.json`
- `scripts/check-mojibake.mjs`
- `supabase/migrations/022_message_templates_account_unique.sql`

---

## Validações executadas

```bash
npm run check:mojibake
npm run typecheck
npm run build
docker buildx build --builder evo-multiarch --platform linux/amd64,linux/arm64 -t lc1868/wacrm-multi-ling:latest -f Dockerfile --push .
docker buildx imagetools inspect lc1868/wacrm-multi-ling:latest
```

Resultado: todas as validações passaram e a imagem multi-arch foi publicada.

---

## Deploy

Imagem publicada:

```text
lc1868/wacrm-multi-ling:latest
sha256:3ed785fcc9c135bdf7d40d621a48dbad669325a596beb7bdb989d2c67ba79990
```

Plataformas:

- `linux/amd64`
- `linux/arm64`

Para atualizar produção via Portainer:

1. Aplicar migrations pendentes no Supabase, especialmente `022_message_templates_account_unique.sql`.
2. Fazer redeploy/force update do serviço `wacrm_web`.
3. Confirmar que o serviço puxou o digest acima.
4. Testar:
   - salvar configuração WhatsApp;
   - validar webhook Meta;
   - criar contato manualmente;
   - importar contatos CSV;
   - abrir `/en/contacts`, `/es/contacts`, `/pt-BR/contacts`;
   - sincronizar templates Meta e verificar mensagens de erro detalhadas.

---

## Backlog identificado

Durante a varredura de textos visíveis, ainda foram encontrados elementos hardcoded em inglês nas áreas:

- broadcasts;
- flows;
- automations;
- pipelines;
- alguns placeholders/aria-labels em componentes compartilhados.

Recomendação: abrir uma rodada dedicada de i18n hardening para converter essas páginas para `next-intl` e ampliar a validação automatizada para strings JSX visíveis.
