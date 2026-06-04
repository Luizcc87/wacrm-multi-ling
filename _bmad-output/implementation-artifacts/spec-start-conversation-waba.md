---
title: 'Iniciar conversa via Meta Cloud API (WABA)'
type: 'feature'
created: '2026-06-04'
status: 'in-review'
context:
  - '_bmad-output/planning-artifacts/start-conversations-waba-plan.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** Não existe forma de iniciar uma conversa proativamente no wacrm-multi-ling — conversas só surgem via inbound. Agentes precisam contatar clientes novos ou retomar contatos fora da janela de 24h usando templates WABA aprovados.

**Abordagem:** Criar `POST /api/conversations/start`, integrar modal "Nova conversa" no Inbox e CTA contextual na sidebar de contato, respeitando a regra de janela de 24h da Meta Cloud API.

## Boundaries & Constraints

**Always:**
- Usar apenas Meta Cloud API — nenhuma API não oficial
- Validar janela WABA no backend: `sender_type = 'customer'` mais recente das últimas 24h define se texto livre é permitido; caso contrário, exigir template aprovado
- Backend valida permissão via `canSendMessages(role)` antes de qualquer ação
- Mensagens outbound não reabrem janela de 24h — só inbound do cliente conta
- Todo texto visível ao usuário em `messages/pt-BR.json`, `messages/en.json`, `messages/es.json`
- Se `initial_message` ausente: apenas localizar/criar contato e conversa, retornar metadados (`free_text_allowed`, `last_inbound_message_at`)
- Reutilizar lógica existente: `findOrCreateContact`, `sendTextMessage`, `sendTemplateMessage`, `normalizePhone`, `sanitizePhoneForMeta` de `phone-utils.ts` e `meta-api.ts`

**Ask First:**
- Se não existir coluna `last_inbound_message_at` em `conversations` no schema real do Supabase: perguntar ao Luiz se adiciona migration ou faz query direta em `messages`
- Se a página de contatos dedicada não existir: confirmar se o CTA vai apenas na `contact-sidebar.tsx` do Inbox

**Never:**
- Evolution API, Baileys, Evolution Go
- Redis, BullMQ, Nango
- Armazenar credenciais em plaintext
- Viewer pode iniciar conversa ou enviar mensagem

## I/O & Edge-Case Matrix

| Cenário | Input / State | Saída Esperada | Tratamento de Erro |
|---------|--------------|----------------|-------------------|
| Telefone novo, sem `initial_message` | `{to: "+5511..."}` | 201 `{conversation_id, free_text_allowed: false, last_inbound_message_at: null}` | 400 se telefone inválido |
| Telefone existente dentro de 24h, sem `initial_message` | `{contact_id}` | 200 `{conversation_id, free_text_allowed: true, last_inbound_message_at: "..."}` | 404 se contact não pertence à conta |
| Envio de texto livre dentro da janela | `{contact_id, initial_message: {type:"text", text:"..."}}` | 200, mensagem salva, conversa atualizada | 422 se fora da janela |
| Envio de template fora da janela | `{contact_id, initial_message: {type:"template", template_name, template_language, template_params}}` | 200, mensagem salva | 422 se template não aprovado; 502 se erro Meta API |
| Template obrigatório mas nenhum aprovado | `{to: "+55..."}` sem template | 200 com `free_text_allowed: false, templates_available: []` | UI mostra estado "sem templates" |
| Viewer tenta iniciar | qualquer body | 403 | — |
| WhatsApp não configurado na conta | qualquer body | 422 `"whatsapp_not_configured"` | — |

</frozen-after-approval>

## Code Map

- `src/app/api/conversations/start/route.ts` — novo endpoint POST (criar)
- `src/app/api/whatsapp/send/route.ts` — referência: padrão de auth, envio Meta, insert message
- `src/app/api/whatsapp/webhook/route.ts` — referência: `findOrCreateContact`, lógica de conversa
- `src/lib/whatsapp/meta-api.ts` — `sendTextMessage`, `sendTemplateMessage` (reutilizar)
- `src/lib/whatsapp/phone-utils.ts` — `normalizePhone`, `sanitizePhoneForMeta`, `phonesMatch`
- `src/lib/auth/roles.ts` — `canSendMessages(role)` para guard de permissão
- `src/types/index.ts` — tipos `Conversation`, `Message`, `Contact`, `MessageTemplate`
- `src/components/inbox/conversation-list.tsx` — onde adicionar botão "Nova conversa"
- `src/components/inbox/contact-sidebar.tsx` — onde adicionar CTA contextual do contato
- `src/components/inbox/template-picker.tsx` — reutilizar no modal de template obrigatório
- `src/app/[locale]/(dashboard)/inbox/page.tsx` — página principal; suporta `?c=<id>`
- `messages/pt-BR.json` — chaves i18n PT
- `messages/en.json` — chaves i18n EN
- `messages/es.json` — chaves i18n ES

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/api/conversations/start/route.ts` -- CRIAR endpoint POST: auth + role guard (`canSendMessages`), resolução de contato por `contact_id` ou `to`, query de última mensagem inbound para decidir `free_text_allowed`, criar/reutilizar conversa, enviar mensagem se `initial_message` presente, retornar metadados -- núcleo da feature
- [ ] `src/components/inbox/new-conversation-modal.tsx` -- CRIAR modal: busca de contato por telefone, campo nome opcional, exibe `free_text_allowed`, mostra composer de texto ou `template-picker` conforme janela WABA, navega para `?c=<id>` no sucesso -- UX principal
- [ ] `src/components/inbox/conversation-list.tsx` -- ADICIONAR botão "Nova conversa" que abre `NewConversationModal` -- entry point no Inbox
- [ ] `src/components/inbox/contact-sidebar.tsx` -- ADICIONAR CTA contextual: "Abrir no Inbox" se conversa existe, "Iniciar conversa" se não existe, desabilitado se telefone inválido -- entry point no contato
- [ ] `messages/pt-BR.json` / `messages/en.json` / `messages/es.json` -- ADICIONAR chaves: `startConversation`, `openInInbox`, `newConversation`, `phoneInvalid`, `whatsappNotConfigured`, `templateRequired`, `noApprovedTemplates`, `freeTextAllowed`, `windowExpired` e variantes -- i18n obrigatório

**Acceptance Criteria:**
- Dado agente autenticado com WhatsApp configurado, quando POST `/api/conversations/start` com telefone novo e sem `initial_message`, então retorna 201 com `free_text_allowed: false`
- Dado contato existente com inbound nas últimas 24h, quando POST sem `initial_message`, então retorna `free_text_allowed: true`
- Dado contato fora da janela de 24h, quando `initial_message.type = "text"`, então retorna 422
- Dado template aprovado e contato fora da janela, quando `initial_message.type = "template"` com params válidos, então mensagem é salva e conversa atualizada
- Dado role `viewer`, quando qualquer POST, então retorna 403
- Dado modal aberto no Inbox, quando usuário informa telefone dentro da janela, então composer de texto livre é exibido
- Dado modal aberto, quando janela expirada ou contato novo, então `template-picker` é exibido com templates aprovados
- Dado sucesso no envio, quando navega para inbox, então conversa aparece selecionada via `?c=<id>`
- Dado `contact-sidebar` de contato sem conversa, quando clica CTA, então modal abre com telefone pré-preenchido

## Design Notes

**Janela WABA — query de decisão:**
```ts
// Sem coluna dedicada: query em messages
const { data: lastInbound } = await supabase
  .from('messages')
  .select('created_at')
  .eq('conversation_id', conversation.id)
  .eq('sender_type', 'customer')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

const freeTextAllowed = lastInbound
  ? Date.now() - new Date(lastInbound.created_at).getTime() < 24 * 60 * 60 * 1000
  : false
```

**Resposta do endpoint (sem `initial_message`):**
```json
{
  "conversation_id": "uuid",
  "contact_id": "uuid",
  "free_text_allowed": true,
  "last_inbound_message_at": "2026-06-04T10:00:00Z"
}
```

## Verification

**Commands:**
- `npm run typecheck` -- expected: zero erros TypeScript
- `npm run lint` -- expected: zero warnings/erros ESLint

**Manual checks:**
- Abrir Inbox → botão "Nova conversa" visível
- Informar telefone de contato com inbound recente → composer de texto aparece
- Informar telefone de contato sem inbound → template-picker aparece
- CTA no contact-sidebar muda conforme existência de conversa
- Strings exibidas nos 3 idiomas sem fallback para chave crua

## Spec Change Log

