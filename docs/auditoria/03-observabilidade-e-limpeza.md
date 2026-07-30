# 03 — Observabilidade e Limpeza (Fase 6)

> Gerado em 2026-07-30.

## O que foi feito

### 1. Regeneração dos types do Supabase

`src/types/database.ts` era um placeholder manual desde antes do projeto Supabase existir — faltavam 15 das 21 tabelas reais (despesas, pagamentos, log de auditoria, lista de espera, avaliações, cupons, fidelidade, etc.) e colunas adicionadas depois (`clients.birth_date`, `receive_reminder_emails`, `consent_whatsapp`, `consent_terms`, `last_login_at`, `avatar_url`, `deleted_at`).

Regenerado via `generate_typescript_types` a partir do schema real do projeto (`mgzwmunzvtrwmhykyxcl`) e substituído por completo. `tsc --noEmit` confirma que a troca não quebra nada nos dois pontos onde o tipo `Database` é usado (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`).

Nota: a maioria das chamadas ao Supabase no projeto usa `as any` no client, então o type antigo nunca bloqueou builds — o valor da regeneração é ter uma fonte de verdade correta disponível para qualquer consumidor futuro. Remover esses `as any` em massa é um esforço maior e separado, fora do escopo desta fase.

### 2. Índices em foreign keys sem cobertura

Migration [039_fk_indexes.sql](../../supabase/migrations/039_fk_indexes.sql) adiciona índice às 9 foreign keys que o advisor de performance apontava sem índice: `appointment_complements.complement_id`, `appointments.service_id`, `audit_log.actor_id`, `coupon_redemptions.appointment_id`, `loyalty_redemptions.redeemed_by`, `reviews.service_id`, `service_complements.complement_id`, `time_slots.blocked_period_id`, `waitlist_entries.client_id`, `waitlist_entries.service_id`.

### 3. Políticas RLS duplicadas

6 tabelas (`availability_rules`, `blocked_periods`, `complements`, `service_complements`, `services`, `time_slots`) tinham duas políticas permissivas cobrindo SELECT para os mesmos papéis — uma `_admin_all` (`FOR ALL USING (auth.role() = 'service_role')`) e uma `_public_read` (`FOR SELECT`), ambas sem cláusula `TO`, então aplicavam a **todos** os papéis (`{public}`), inclusive `service_role`. Isso obrigava o Postgres a avaliar as duas em toda consulta SELECT.

Migration [040_consolidate_rls_policies.sql](../../supabase/migrations/040_consolidate_rls_policies.sql) restringe cada política ao papel que de fato precisa dela: `_admin_all` → `service_role` (usado nas server actions via `createServiceClient`), `_public_read` → `anon, authenticated` (usado no browser via chave anônima, confirmado em `src/lib/supabase/client.ts`). Confirmado no advisor de performance: os alertas de "multiple permissive policies" somem depois da migration.

### 4. Error boundaries

O app não tinha nenhum error boundary — um erro não tratado em qualquer página quebrava a renderização sem UI de recuperação. Adicionados:

- [`src/app/error.tsx`](../../src/app/error.tsx) — boundary de segmento (mantém nav/rodapé do `PublicShell`), com botão "Tentar novamente" e link para o início.
- [`src/app/not-found.tsx`](../../src/app/not-found.tsx) — página 404 no mesmo padrão visual (antes usava o 404 genérico do Next).
- [`src/app/global-error.tsx`](../../src/app/global-error.tsx) — cobre falhas no próprio root layout (ex.: erro de carregamento de fonte); precisa declarar `<html>`/`<body>` próprios porque substitui o layout inteiro.

### 5. Vercel Web Analytics

Verificado via API do Vercel: **não está habilitado** neste projeto (`404 Web Analytics not found`). Habilitar exige uma ação manual no painel do Vercel (Project Settings → Analytics) — não há uma API/MCP para ativar remotamente, e pode ter implicação de plano/custo, então não foi feito automaticamente. Recomendado como ação manual futura se houver interesse em métricas de tráfego.

## Não coberto nesta fase

- Remoção dos `as any` nas chamadas Supabase espalhadas pelo app (achado, mas decidido fora do escopo — ver seção 1).
- Habilitar Vercel Web Analytics (ação manual no painel, fora do alcance das ferramentas disponíveis).
- Os 3 avisos de segurança pré-existentes do advisor (`next_appointment_reference` executável por `anon`/`authenticated`, proteção de senha vazada desabilitada) já eram conhecidos da Fase 1 e não fazem parte do escopo desta fase — o app não usa senhas (login por código via WhatsApp), então o segundo item não se aplica.
