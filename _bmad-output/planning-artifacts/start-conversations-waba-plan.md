# Plano: iniciar conversas via WABA

**Projeto:** wacrm-multi-ling  
**Versao:** multi-idiomas + Meta Cloud API / WABA  
**Data:** 2026-06-04  
**Status:** plano tecnico-funcional

---

## Escopo

Este projeto deve continuar focado em multi-idiomas e WhatsApp Business Platform oficial. Nao deve receber Evolution API, Baileys, Evolution Go ou qualquer API nao oficial.

A feature proposta permite iniciar ou retomar conversas por:

- **Inbox:** acao "Nova conversa".
- **Contato:** acao "Iniciar conversa" ou "Abrir no Inbox".

O envio deve usar apenas Meta Cloud API / WABA.

---

## Regra central da WABA

Na Meta Cloud API, texto livre so pode ser enviado dentro da janela de atendimento de 24h aberta por uma mensagem inbound do cliente.

Consequencias:

- Contato novo: primeira mensagem deve ser template aprovado.
- Contato existente sem inbound nas ultimas 24h: template aprovado obrigatorio.
- Conversa fechada no CRM, mas ainda dentro da janela de 24h física da Meta: texto livre pode ser permitido (o status de controle lógico do CRM não afeta a janela física de WABA).
- Conversa fora da janela: reabertura deve ser via template.
- Mensagens outbound (enviadas pela empresa) NÃO abrem ou renovam a janela de 24h. Somente mensagens inbound (do cliente) iniciam ou reiniciam o contador.
- UI deve impedir texto livre quando template e obrigatorio.
- Backend deve validar a regra mesmo que a UI bloqueie.

---

## Endpoint proposto

`POST /api/conversations/start`

Body:

```json
{
  "contact_id": "uuid-opcional",
  "to": "+5511999999999",
  "name": "Nome opcional",
  "initial_message": {
    "type": "template",
    "template_name": "appointment_reminder",
    "template_language": "pt_BR",
    "template_params": ["Maria"]
  }
}
```

Regras:

- Se `contact_id` for enviado, validar que pertence ao `account_id`.
- Se apenas `to` for enviado, normalizar telefone e localizar/criar contato.
- Reutilizar conversa existente do contato quando apropriado.
- Criar conversa se nao existir.
- Se houver `initial_message`, validar janela WABA:
  - dentro de 24h: permitir `text` ou `template`;
  - fora de 24h ou contato novo: exigir `template`.
- Se `initial_message` NÃO for enviado, o endpoint deve apenas criar/localizar o contato e a conversa, retornando os metadados necessários para a UI, incluindo se a janela de texto livre está aberta (`free_text_allowed: boolean` e `last_inbound_message_at`).
- Enviar usando a logica Meta atual.
- Persistir mensagem em `messages`.
- Atualizar `conversations.last_message_text`, `last_message_at`, `status` e `updated_at`.

---

## Dados necessarios

Para decidir se texto livre e permitido:

- ultima mensagem inbound do cliente na conversa;
- idealmente um campo derivado ou armazenado: `last_inbound_message_at`;
- fallback aceitavel: query em `messages` filtrando `sender_type = 'customer'` e `conversation_id`.

Para template:

- template sincronizado em `message_templates`;
- status aprovado;
- idioma selecionado entre os idiomas suportados;
- variaveis obrigatorias preenchidas;
- `phone_number_id` e `access_token` validos.

---

## UX no Inbox

Adicionar botao "Nova conversa".

Fluxo:

1. Buscar contato existente ou informar telefone.
2. Se telefone novo, pedir nome opcional.
3. Sistema informa se existe conversa reaproveitavel.
4. Sistema calcula janela WABA.
5. Se texto livre permitido, mostrar composer normal.
6. Se template obrigatorio, mostrar seletor de template aprovado.
7. Apos sucesso, navegar para `/inbox?c=<conversation_id>`.

Estados obrigatorios:

- telefone invalido;
- WhatsApp nao configurado;
- template obrigatorio;
- nenhum template aprovado disponivel;
- erro da Meta API;
- mensagem enviada mas falha ao salvar no banco.

---

## UX no Contato

Adicionar CTA contextual:

- contato com conversa existente: "Abrir no Inbox";
- contato sem conversa: "Iniciar conversa";
- contato sem telefone valido: CTA desabilitado com motivo;
- fora da janela WABA: abrir modal de template;
- dentro da janela: permitir texto livre.

Todas as strings novas devem existir em:

- `messages/pt-BR.json`;
- `messages/en.json`;
- `messages/es.json`.

---

## Permissoes

- `owner`, `admin`, `agent`: podem iniciar conversa e enviar mensagem.
- `viewer`: somente leitura.
- Configuracao WABA e templates: `owner` ou `admin`.

O backend deve validar permissao, conta, contato e conversa. A UI nao e controle suficiente.

---

## Plano de implementacao

1. Criar servico de dominio WABA-only para resolver contato/conversa.
2. Criar `POST /api/conversations/start`.
3. Implementar validador de janela 24h.
4. Implementar validador de template aprovado e parametros.
5. Integrar Inbox com modal "Nova conversa".
6. Integrar Contato com CTA contextual.
7. Adicionar i18n nos 3 idiomas.
8. Adicionar testes unitarios e de API.

---

## Testes minimos

- cria contato e conversa para telefone novo;
- reutiliza contato existente por telefone normalizado;
- reutiliza conversa existente quando aplicavel;
- bloqueia texto livre fora da janela WABA;
- permite texto livre dentro da janela WABA;
- exige template para contato novo;
- bloqueia template nao aprovado;
- envia template aprovado e grava mensagem;
- bloqueia `viewer`;
- retorna conversa navegavel sem enviar mensagem quando `initial_message` ausente.

---

## Fora de escopo

- Evolution API v2;
- Evolution Go;
- Baileys;
- grupos WhatsApp;
- proxy por instancia;
- N8N inbound dedicado;
- agentes de IA.
