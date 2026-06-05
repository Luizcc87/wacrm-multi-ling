# Épicos — wacrm-multi-ling: Usuários, Permissões e Auth

**Projeto:** wacrm-multi-ling  
**Data:** 2026-06-04  
**Origem:** Investigação `users-permissions-auth-investigation.md` + Plano Arquitetural Winston

---

## Épico 1: Graduação do Sistema de Equipe e Controle de Registro

**Objetivo:** Tornar a gestão de equipe (tab Members) acessível por padrão para todos os usuários do sistema, e introduzir controle operador para desabilitar o registro público de novas contas.

**Valor de negócio:** Operadores que fazem deploy self-hosted do wacrm precisam controlar quem pode criar contas (modelo invite-only) e seus usuários precisam acessar a gestão de equipe sem intervenção manual no banco de dados.

**Escopo:** wacrm-multi-ling apenas. Será replicado para wacrm-multi-api em épico separado.

**Dependências técnicas:**
- Migrations 017–020 já aplicadas (accounts, account_role_enum, RPCs de membro/convite)
- MembersTab component já implementado
- APIs `/api/account/members` e `/api/account/invitations` já funcionando
- `/join/[token]` page já implementada

---

### História 1.1: Graduar Tab de Equipe (Remover Beta Gate)

**Como** administrador do sistema,  
**Quero** ver a aba "Equipe" em Configurações sem precisar ativar uma feature flag manual no banco de dados,  
**Para que** eu possa gerenciar minha equipe imediatamente após o deploy.

**Critérios de Aceite:**
- AC1: Tab "Equipe" (members) visível em Settings para todos os usuários autenticados sem necessidade de `beta_features = ['account_sharing']`
- AC2: Usuários com role `viewer` ou `agent` veem a aba mas sem botões de ação (read-only) — comportamento já existente no MembersTab
- AC3: Usuários com role `admin` ou `owner` veem botões de convidar, mudar role, remover membro
- AC4: Fallback de URL `?tab=members` funciona diretamente sem redirecionar para `profile`
- AC5: Nenhuma regressão nas outras tabs (profile, whatsapp, templates, tags, appearance)
- AC6: Nenhuma referência a `ACCOUNT_SHARING_FLAG` ou `beta_features` permanece no arquivo

---

### História 1.2: Controle de Registro Público via Variável de Ambiente

**Como** operador de deploy do wacrm,  
**Quero** definir `ALLOW_PUBLIC_SIGNUP=false` no meu `.env` para desabilitar o auto-cadastro público,  
**Para que** meu sistema funcione no modelo invite-only onde apenas admins convidam novos usuários.

**Critérios de Aceite:**
- AC1: Com `ALLOW_PUBLIC_SIGNUP=false`, acessar `/signup` redireciona para `/login?reason=invite_only`
- AC2: Com `ALLOW_PUBLIC_SIGNUP=false`, o link "Criar conta" na página de login é ocultado
- AC3: Com `ALLOW_PUBLIC_SIGNUP=false` e parâmetro `?invite=<token>` na URL, o link "Criar conta" permanece visível (convite em andamento)
- AC4: Com `ALLOW_PUBLIC_SIGNUP` ausente ou qualquer valor diferente de `'false'`, comportamento atual é preservado (signup público habilitado)
- AC5: Mensagem informativa é exibida na tela de login quando `?reason=invite_only` está presente
- AC6: Chaves i18n adicionadas nos 3 idiomas (pt-BR, en, es)
- AC7: Variável documentada no `.env.example` com comentário explicativo

---

### História 1.3: Limpeza do Campo Legado `profiles.role`

**Como** desenvolvedor do wacrm,  
**Quero** remover o campo `profiles.role TEXT` que não é mais utilizado por nenhuma lógica de autorização,  
**Para que** o schema de banco de dados seja claro e sem ambiguidade entre `role` (legado) e `account_role` (ativo).

**Critérios de Aceite:**
- AC1: Migration `021_cleanup_profiles_legacy_role.sql` criada e aplicável sem erro
- AC2: Nenhum arquivo TypeScript no `src/` referencia o campo `role` do perfil como campo de autorização
- AC3: TypeScript compila sem erros após a migration
- AC4: Testes existentes passam após a remoção
