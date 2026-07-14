# Grade de horas do dia — /admin/agenda (Fase B)

## Contexto

Referência: vídeos e fotos em `referencias/WhatsApp Video/Image 2026-07-12 *` (gravados em um app de agenda de barbearia concorrente, formato mobile). Mostram três recursos distintos que hoje não existem ou existem de forma diferente no admin:

- **(A)** Criar agendamento manualmente (cliente + serviço + complementos + horário) — não existe hoje.
- **(B)** Grade de horas do dia com blocos proporcionais à duração + troca de dia por swipe — hoje a visão Dia (`src/app/admin/agenda/page.tsx`) é uma lista vertical simples, sem grade visual.
- **(C)** Bloquear horário / adicionar folga direto pela agenda — já existe via `addBlockedPeriod`/`updateAvailabilityRule` em `src/app/admin/actions.ts` e a UI em `/admin/configuracoes`; falta só um atalho rápido.

Esta spec cobre **apenas a Fase B**, escolhida como primeira por ser a base visual sobre a qual (A) e (C) vão se encaixar depois, cada uma como sua própria spec/fase.

## Decisão de estilo

Replicar a **mecânica** do vídeo de referência (grade de horas, blocos proporcionais, swipe entre dias) mas **não** o visual literal (tema claro, blocos verdes). Usa a identidade já estabelecida do projeto: fundo `charcoal`, tipografia `font-display`/`font-body`, e a paleta de status já existente (`STATUS_LABEL`/`STATUS_DOT` em `agenda/page.tsx`) — pending=gold, confirmed=sage, checked_in/in_progress=gold preenchido, cancelled/no_show=error atenuado.

## Escopo

Substitui apenas a visão **Dia** de `/admin/agenda` (a lista vertical atual). As visões Semana e Mês, o `ViewSwitcher` e os `NavArrows` existentes não mudam.

## Estrutura da grade

- Régua de horas na coluna esquerda (início/fim conforme `availability_rules` do dia da semana, com fallback 07:00–20:00 se não houver regra).
- Cada agendamento vira um bloco posicionado por `top = (start_time - grid_start) em minutos × px_por_minuto` e `height = duration em minutos × px_por_minuto`.
- Bloco mostra hora, cliente e serviço quando a altura permitir; abaixo de um limiar (ex.: <30min) mostra só hora + cliente.
- Preenchimento translúcido pela cor do status (reaproveitando os tokens já usados no border-left da lista atual, agora como `bg-{cor}/15` com borda `border-{cor}/40`).

## Interação

- Tocar/clicar um bloco abre um painel com os detalhes e as ações já existentes (`AppointmentActions`: confirmar, check-in, checkout, cancelar, nota) — painel lateral no desktop, folha deslizante de baixo para cima no mobile. A grade permanece visível atrás.
- Mobile: arrastar a grade horizontalmente troca de dia (swipe), equivalente a `prevHref`/`nextHref` já existentes.
- Desktop: mantém as setas ‹/› e o botão "Hoje" já existentes; sem gesto de swipe (não faz sentido com mouse).

## Sobreposição e responsividade

- Agendamentos que se sobrepõem no tempo dividem a largura da coluna lado a lado (não empilham por cima).
- Desktop ganha mais respiro horizontal por bloco (texto menos truncado); a régua de horas, cores e mecânica de clique são idênticas entre mobile e desktop — só a densidade de informação por bloco aumenta em telas largas.

## Estados vazios

- Dia sem `availability_rules` ativa (ex.: domingo fechado) e sem agendamentos: grade mostra o intervalo padrão (07:00–20:00) vazio, sem mensagem de erro — mesmo comportamento atual da lista quando não há agendamentos, só que dentro da grade em vez de uma mensagem centralizada.
- Dia com `blocked_periods` cobrindo parte do horário: a faixa bloqueada aparece hachurada/atenuada na grade (mesmo tratamento visual já usado no calendário público em `MiniCalendar.tsx` para dias indisponíveis, adaptado para faixas de horário).

## Fora de escopo aqui

- Criar agendamento manualmente pelo admin (Fase A — spec própria depois).
- Atalho de bloquear horário/folga direto pela agenda (Fase C — spec própria depois).
- Mudanças nas visões Semana/Mês.
- Mudanças em `/admin/configuracoes` (gerenciamento de horários já existente, fora de escopo).
