# 01 — Inventário Atual (Fase 0)

> Gerado em 2026-07-30. Cobre o estado real do repositório `Alison-Estevam-Studio` (branch `main`, commit `d66553f`) antes de qualquer alteração desta missão de auditoria.
>
> **Importante:** este não é um projeto greenfield. As últimas semanas de trabalho já cobriram boa parte do que os documentos em `referencias/md/` pedem como "auditoria inicial" — correções de segurança (IDOR, race conditions, rate limiting), painel completo de check-in/checkout, financeiro com DRE, exportação de relatórios, etc. Este inventário mapeia o que já existe para que o plano faseado (seção final) não repita trabalho.

---

## 1. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14.2.29 (App Router) |
| Linguagem | TypeScript 5, `strict: true` |
| Gerenciador de pacotes | npm |
| UI | React 18 + Tailwind CSS 3.4 (escala de espaçamento 100% customizada, sem classes padrão do Tailwind) |
| Ícones | SVG inline hand-rolled (nenhuma biblioteca de ícones) |
| Calendário/Agenda | Implementação própria (`DayGrid`, `WeekGrid`, `dayGridLayout.ts`) — nenhuma lib de terceiros |
| Gráficos | SVG/Canvas próprios (`FinanceCharts`, `RevenueTrendCharts`, `ServicoCharts`, `PeakHoursHeatmap`) — nenhuma lib de gráficos |
| Formulários | Nativos + Server Actions (`useTransition`), sem React Hook Form |
| Validação | Zod 3.23 |
| Autenticação admin | Supabase Auth + tabela `staff_members` (roles `owner`/`staff`), gate em `middleware.ts` |
| Autenticação cliente | OTP por WhatsApp (`otp_codes` + `src/lib/client-auth`), sessão via cookie assinado |
| Banco de dados | Supabase Postgres (projeto `mgzwmunzvtrwmhykyxcl`), RLS habilitado em 100% das tabelas |
| E-mail | Resend (`src/lib/email/*` — confirmação, recibo, boas-vindas, redefinição de senha) |
| PDF | Impressão via `window.print()` com CSS dedicado (`relatorios/[tipo]/imprimir`), sem lib de geração server-side |
| Excel/CSV | CSV nativo (`src/lib/csv.ts`) + rotas `/api/admin/relatorios/*/csv` |
| Deploy | Vercel (projeto `alison-estevam-studio`, produção em `alison-estevam-studio.vercel.app`) |
| Monitoramento | Nenhum (sem Sentry/LogRocket/equivalente) |
| Analytics | Nenhum instalado no código (Vercel Web Analytics disponível na plataforma, não verificado se ativo) |
| Testes | Vitest 4.1 — 48 testes em 5 arquivos, todos unitários |
| Lint | ESLint (`eslint-config-next`) |
| Formatação | Nenhum formatter automático configurado (sem Prettier) |
| CI/CD | Nenhum workflow de CI próprio — deploy automático via integração GitHub↔Vercel a cada push em `main` |

**Lacunas identificadas nesta seção:** sem monitoramento de erros em produção, sem CI que rode lint/typecheck/testes antes do deploy (o build da Vercel é o único gate), sem Prettier.

---

## 2. Arquitetura

### 2.1 Rotas (App Router)

**Público:**
`/` (home), `/agendar`, `/entrar`, `/confirmar/[code]`, `/cancelar/[code]`, `/reagendar/[code]`, `/conta`, `/perfil` (+ `/perfil/conta`, `/perfil/pagamentos`, `/perfil/pagamentos/[id]`, `/perfil/fidelidade`, `/perfil/avaliacoes`, `/perfil/sobre`), `/privacidade`, `/termos`, `/licencas`.

**Admin** (protegido por `middleware.ts`, gate `isStaffMember`):
`/admin` (dashboard), `/admin/agenda`, `/admin/espera`, `/admin/clientes` (+ `/admin/clientes/[id]` como fallback de deep-link), `/admin/servicos`, `/admin/faturamento`, `/admin/financeiro`, `/admin/operacional`, `/admin/relatorios` (+ `/admin/relatorios/[tipo]/imprimir`), `/admin/atividade`, `/admin/configuracoes`, `/admin/login`.

**API routes:** `appointments` (CRUD + `[code]/confirm|cancel|reschedule`), `availability`, `services`, `complements`, `coupons/validate`, `waitlist`, `admin/clients/[id]`, `admin/clients/search`, `admin/pending-count`, `admin/relatorios/*/csv` (4 rotas).

### 2.2 Camadas de código

- **Server Actions**: `src/app/admin/actions.ts` (arquivo central, ~50 funções — clientes, serviços, agendamentos, check-in/checkout, despesas, cupons, staff, configurações), `src/app/conta/actions.ts`, `src/app/entrar/actions.ts`, `src/app/perfil/actions.ts`.
- **Lib/serviços compartilhados**: `src/lib/admin-auth.ts` (staff/owner gate), `src/lib/client-auth/*` (OTP + sessão), `src/lib/coupons.ts`, `src/lib/loyalty.ts`, `src/lib/rate-limit.ts`, `src/lib/schedule/*` (geração de slots, layout da grade), `src/lib/whatsapp/messages.ts`, `src/lib/email/*`, `src/lib/csv.ts`, `src/lib/calendar/ics.ts`.
- **Componentes admin**: 40+ em `src/components/admin/`, organizados por módulo (agenda, clientes, financeiro, serviços).
- **Types**: `src/types/database.ts` (schema tipado manual, não gerado via `generate_typescript_types` — **lacuna**: types podem divergir do schema real sem regeneração automática).

### 2.3 Banco de dados (Supabase, projeto `mgzwmunzvtrwmhykyxcl`)

**34 migrations aplicadas** (`supabase/migrations/001` a `034`). Sem diretório `supabase/seed/` — não existe seed idempotente separado do ambiente real (o que os docs de auditoria pedem em `analise-critica.md` §7).

**21 tabelas em `public`, todas com RLS habilitado:**

`clients`, `services`, `complements`, `service_complements`, `appointments`, `appointment_complements`, `time_slots`, `availability_rules`, `blocked_periods`, `payments`, `payment_fee_settings`, `expenses`, `coupons`, `coupon_redemptions`, `waitlist_entries`, `reviews`, `staff_members`, `otp_codes`, `rate_limits`, `audit_log`, `loyalty_settings`, `loyalty_redemptions`.

**Volumetria atual (ambiente de produção real, não demonstração):**

| Tabela | Linhas |
|---|---|
| clients | 8 |
| appointments | 13 |
| payments | 0 |
| expenses | 0 |
| coupons | 0 |
| waitlist_entries | 0 |
| reviews | 0 |
| audit_log | 49 |
| time_slots | 472 |

Isso confirma diretamente a lacuna descrita em `analise-critica.md` §7: o sistema roda hoje com dados reais mínimos (8 clientes, 13 agendamentos, zero pagamentos/despesas registrados) — não os 25 clientes / 160+ agendamentos / 45+ despesas que os docs de auditoria pedem como massa de demonstração. **Não são dados de teste a limpar — são os únicos dados reais do negócio.** Qualquer seed de demonstração precisa ser isolado (ambiente separado ou flag clara), nunca misturado a essas linhas.

### 2.4 Segurança do banco (advisors Supabase, checados agora)

**Security (5 avisos, nenhum crítico):**
1. `update_updated_at()` sem `search_path` fixo (WARN) — hardening, não exploração conhecida.
2. Extensão `pg_net` ainda referenciada como instalável em `public` pelo linter, mas migration 092 já a moveu para schema dedicado — revalidar se o aviso é stale.
3–4. `next_appointment_reference()` é `SECURITY DEFINER` executável por `anon`/`authenticated` via RPC — intencional (gera código sequencial de agendamento), mas vale documentar explicitamente por quê é seguro (não vaza dados, só incrementa sequência).
5. Proteção de senha vazada (HaveIBeenPwned) desativada no Supabase Auth — ativar é 1 clique no painel, sem custo.

**Performance (INFO/WARN, não bloqueantes):** 9 foreign keys sem índice de cobertura (`appointment_complements`, `appointments.service_id`, `audit_log.actor_id`, etc.) e política RLS duplicada (`_admin_all` + `_public_read` ambas permissivas para `SELECT` em 6 tabelas públicas de leitura) — gera avaliação de 2 políticas por query em vez de 1. Ambos são otimizações de custo baixo, sem risco funcional.

### 2.5 Autenticação e RLS — modelo real

- Admin: Supabase Auth (e-mail/senha) → linha em `staff_members` com `role` (`owner`/`staff`) → `middleware.ts` bloqueia `/admin/*` para qualquer usuário autenticado que não esteja em `staff_members`. `requireOwner()` em `actions.ts` restringe ainda mais operações sensíveis (criar/excluir serviço, taxas, cupons) a `role = 'owner'`.
- Cliente: sem senha — OTP de 6 dígitos por WhatsApp, hash armazenado em `otp_codes`, rate-limited, sessão própria via cookie assinado (não é Supabase Auth).
- Não há papel "recepção" citado nos docs de auditoria — só `owner`/`staff` existem hoje. Se "recepção" for um requisito real, é lacuna a decidir com o usuário, não a inventar.

---

## 3. Mapa funcional por módulo

| Módulo | Rota | Fonte de dados | Operações | Indicadores mostrados | Estado |
|---|---|---|---|---|---|
| Dashboard | `/admin` | `appointments`, `clients`, `payments`, `services` (Promise.all direto na page) | Leitura | Hoje, Esta semana, Total clientes, Clientes novos, Receita do mês, Ticket médio, Comandas abertas, Serviços ativos | ✅ Completo, todos os cards navegáveis |
| Agenda | `/admin/agenda` | `appointments`, `time_slots`, `services`, `clients` | CRUD completo, check-in/checkout, bloqueio, folga, reagendamento | Views Dia/Semana Útil/Semana/Mês, cores por serviço/status, linha de "agora" | ✅ Completo (redesenhado estilo Outlook nesta sessão) |
| Fila de espera | `/admin/espera` | `waitlist_entries` | CRUD | Lista de espera com prioridade | ✅ Implementado; **0 registros reais hoje** |
| Clientes | `/admin/clientes` | `clients`, `appointments` (histórico) | CRUD, toggle VIP inline, drawer lateral | Tabela completa, aniversariantes do mês, retenção, ausentes | ✅ Redesenhado nesta sessão (tabela + drawer) |
| Serviços | `/admin/servicos` | `services`, `service_complements`, `appointments` (contagem) | Criar, editar, ativar/desativar, excluir (guardado) | Cards de estatística, ranking, receita/hora, ociosidade | ✅ Autonomia de criar/excluir adicionada hoje |
| Faturamento | `/admin/faturamento` | `payments` | Leitura + filtro de período | Bruto, líquido, por forma de pagamento, tendência, melhor dia | ✅ Implementado |
| Financeiro | `/admin/financeiro` | `payments`, `expenses` | CRUD de despesas | DRE simplificado, fluxo de caixa, categorias, aging | ✅ Implementado, regime caixa/competência selecionável |
| Operacional | `/admin/operacional` | `appointments` | Leitura | Taxa de cancelamento, canal (`source`: online/presencial), mapa de pico | ✅ Implementado; nomenclatura "online/presencial" já reflete origem do agendamento, não modalidade — ponto do doc de auditoria já resolvido |
| Relatórios | `/admin/relatorios` | Todas as tabelas acima | Exportação | Excel/CSV real, PDF via impressão | ✅ Implementado |
| Atividade | `/admin/atividade` | `audit_log` | Leitura | Timeline + Top serviços do mês | ✅ Renomeado de "Auditoria" hoje |
| Configurações | `/admin/configuracoes` | `availability_rules`, `blocked_periods`, `payment_fee_settings`, `loyalty_settings`, `coupons`, `staff_members` | CRUD por seção | Cards com ícone, grid de acesso rápido | ✅ Redesenhado hoje |
| Área do cliente | `/perfil/*` | `clients`, `appointments`, `payments`, `reviews` | Leitura + ações (cancelar, avaliar, editar conta) | Histórico, fidelidade, avaliações, pagamentos | ✅ Implementado |

**Módulos citados nos docs de auditoria que não existem hoje:** notificações centralizadas (painel), matriz de eventos → canal, templates de e-mail reutilizáveis (existem 4 e-mails hard-coded, não um motor de templates), sistema de mensagens WhatsApp automatizado além da confirmação inicial (lembretes de 24h/2h não implementados), command palette, busca global, breadcrumb.

---

## 4. Mapa de dependências dos indicadores (checklist de consistência)

Respondendo diretamente às perguntas de `checklist.md`:

| Pergunta | Resposta técnica atual |
|---|---|
| Por que Dashboard pode mostrar receita zero enquanto Serviços mostra receita? | Não deveria acontecer hoje: ambos leem de `payments.gross_amount`/`net_amount`. Serviços usa preço de tabela (`services.price`) para ranking, não pagamento real — **essa é a distinção a documentar explicitamente na UI**, não um bug. |
| Qual evento faz um agendamento entrar no faturamento? | `checkOutAppointment()` — cria linha em `payments` só quando o status vira `completed`. Antes disso, nenhum valor é contado em Faturamento. |
| Qual evento faz o valor entrar no caixa? | O mesmo checkout: `paid_at = now()` no momento da criação da linha de `payments`. Não há distinção hoje entre "pago" e "confirmado mas não pago" — todo pagamento é registrado como já efetivado. |
| Um serviço concluído sem pagamento aparece onde? | Não é possível hoje: `checkOutAppointment` cria `appointments.status='completed'` e a linha de `payments` na mesma chamada `Promise.all`. Não há caminho de UI para concluir sem passar pelo checkout. |
| Um pagamento pendente aparece em Faturamento/Financeiro? | Não existe "pagamento pendente" como conceito no schema — `payments` só armazena pagamentos já efetivados. "Contas a receber" em Financeiro refere-se a **despesas** com `paid_date IS NULL` (contas a pagar), não a receitas pendentes. |
| Como são calculadas as taxas? | `feeAmount = round((gross - discount) * fee_percentage/100, 2)`, com `fee_percentage` vindo de `payment_fee_settings` por método de pagamento. |
| Como são tratados descontos? | Subtraídos do bruto **antes** do cálculo da taxa: `netBeforeFee = max(0, gross - discount)`. |
| Como são tratadas gorjetas? | Somadas **depois** da taxa, não sofrem desconto de taxa: `netAmount = (netBeforeFee - feeAmount) + tipAmount`. |
| Como são tratadas cortesias? | Método de pagamento `courtesy`; `payment_fee_settings` permite taxa própria (normalmente 0%) para esse método. |
| O que ocorre ao cancelar um atendimento pago? | Não pode ocorrer no fluxo atual: pagamento só existe após `completed`, e cancelamento (`api/appointments/[code]/cancel`) é bloqueado para agendamentos já com `checked_in`+ (migration 088). Não há fluxo de estorno implementado — **lacuna real** se um pagamento precisar ser revertido depois de registrado. |
| O que ocorre ao excluir um serviço com histórico? | `deleteService()` verifica `count` em `appointments.service_id` antes de excluir; se > 0, retorna erro pedindo para desativar em vez de excluir. Implementado hoje. |
| Como funciona o regime de caixa vs competência? | Financeiro tem toggle explícito (`regime === 'caixa'`); modo caixa usa `paid_date`, competência usa `due_date` — implementado, mas o rótulo/explicação ao usuário do que muda entre os dois pode ser mais claro (oportunidade de UX). |
| Como é calculada a taxa de cancelamento? | Em `/admin/operacional`: `cancelados / total_agendamentos` no período. |
| Como é calculado o ticket médio? | `receita_bruta_pagamentos_do_mês / quantidade_de_pagamentos_do_mês` (Dashboard) — mesma fórmula em Faturamento. |
| Como o timezone é tratado? | Datas armazenadas como `date`/`time` sem timezone (assume-se America/Sao_Paulo implicitamente); `format(new Date(), 'yyyy-MM-dd')` roda no timezone do servidor Vercel (UTC), o que pode gerar off-by-one perto da meia-noite — **risco real a validar em Fase 1**, mesma classe de bug já corrigida uma vez para aniversariantes (uso de string slicing em vez de `Date.getMonth()`). |
| Como conflitos de agenda são impedidos? | `time_slots.status` (`available`/`blocked`/`booked`) com constraint de unicidade por slot; corrigida race condition de double-booking nesta sessão (tarefa #81). |
| Como alterações são auditadas? | `logAction()` grava em `audit_log` para toda ação de escrita relevante em `actions.ts` — cobertura ampla, não 100% verificada linha a linha. |

---

## 5. Confronto com os critérios de aceite dos documentos de auditoria

Itens que **já estão prontos** hoje (não repetir):
- Autenticação, RLS, rate limiting, proteção contra IDOR e race conditions já corrigidos.
- Financeiro com DRE, regime de caixa/competência, categorias, aging.
- Exportação real (CSV/Excel/PDF via impressão).
- Tema claro/escuro já implementado e persistente (`ThemeToggle`).
- Testes unitários existentes (48, cobrindo cupons, fidelidade, layout da agenda, utils, validações) — mas **zero testes de integração ou E2E**.

Itens **pedidos nos documentos e ainda não implementados** (candidatos reais ao plano faseado):
1. Massa de dados de demonstração isolada (25 clientes, 160+ agendamentos, 45+ despesas) sem contaminar os 8 clientes/13 agendamentos reais.
2. Motor de notificações (lembretes 24h/2h, matriz evento→canal, templates de e-mail reutilizáveis, preferências de consentimento por cliente).
3. Testes de integração e E2E (hoje só unitários).
4. Auditoria formal de responsividade/temas com matriz de dispositivos.
5. Monitoramento/observabilidade em produção (zero hoje).
6. Design system documentado formalmente (existe consistência de fato no código, mas não um `docs/design-system.md`).
7. Fluxo de estorno de pagamento.
8. Regeneração automática de types do Supabase (hoje mantidos manualmente em `database.ts`).

---

## 6. Proposta de plano faseado (ajustado à realidade encontrada)

O plano genérico dos documentos (Fase 0 a Fase 7) assume um projeto no início. Como grande parte já está pronta, proponho um plano mais enxuto, focado no que falta de fato:

| Fase | Foco | Esforço estimado |
|---|---|---|
| **0** (esta) | Inventário — concluído | — |
| **1** | Timezone/edge cases financeiros + fluxo de estorno + revisão de RLS advisors (5 itens) | S |
| **2** | Massa de dados de demonstração isolada e idempotente (não mexe nos 8 clientes reais) | M |
| **3** | Motor de notificações: lembretes automáticos, templates de e-mail reutilizáveis, preferências/consentimento por cliente | L |
| **4** | Testes de integração + E2E dos fluxos críticos (agendamento completo, checkout, cancelamento) | L |
| **5** | Auditoria de responsividade/temas com evidências (matriz de dispositivos) | M |
| **6** | Observabilidade (erros em produção) + regeneração automática de types + limpeza de performance advisors | S |
| **7** | Validação final e relatório de fechamento | S |

Isso evita redigitar dezenas de páginas de documentação sobre módulos que já funcionam bem, e foca energia nas lacunas reais confirmadas acima.

**Próximo passo recomendado:** começar pela Fase 1 (menor esforço, maior risco se ignorada — bugs de timezone e ausência de estorno são os únicos itens desta lista com potencial de causar dado financeiro incorreto).
