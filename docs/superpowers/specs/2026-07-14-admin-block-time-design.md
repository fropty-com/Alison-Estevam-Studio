# Fase C — Bloqueio de horário / folga direto pela agenda

## Contexto

Terceira e última fase da réplica da mecânica do calendário de referência em `/admin/agenda` (Fase A: criação manual de agendamento — concluída; Fase B: grade de horas do dia — concluída).

Hoje, para bloquear um dia inteiro (folga) o admin precisa ir em `/admin/configuracoes` e usar `addBlockedPeriod`/`removeBlockedPeriod` (`src/app/admin/actions.ts:452-511`), que já têm toda a lógica de negócio pronta — só falta um atalho na própria agenda. Não existe nenhum jeito de bloquear uma faixa de horário específica dentro de um dia (ex: um intervalo de almoço) — isso precisa ser construído do zero.

## Decisão de arquitetura: onde vive o bloqueio de horário

A tabela `blocked_periods` só tem `date_start`/`date_end` (granularidade de dia inteiro) e é lida por `/api/availability` para decidir se um dia inteiro está disponível — qualquer linha que bata na data derruba o dia inteiro. Estender essa tabela com colunas de horário exigiria alterar essa checagem pública (risco para o calendário de reserva de clientes) para diferenciar bloqueio de dia inteiro vs. parcial.

Em vez disso, o bloqueio de faixa de horário opera diretamente sobre `time_slots`, que já tem `status IN ('available', 'blocked', 'booked')` por slot individual e já é respeitado pela disponibilidade pública (`/api/availability` já filtra `available: s.status === 'available'`). Isso significa:

- Nenhuma mudança de schema.
- Nenhum risco à lógica pública de disponibilidade — ela já se comporta corretamente assim que um slot vira `blocked`.
- Folga do dia inteiro continua usando `blocked_periods` exatamente como hoje (só ganha um atalho de UI).

## Ações no servidor (`src/app/admin/actions.ts`)

### `blockTimeRange(date, startTime, endTime, reason?, confirmed?)`

1. Autentica via `getSessionUser()` (mesmo padrão de `addBlockedPeriod`).
2. Garante que os slots de 1h daquele dia existem, chamando `ensureSlotsForDate` (nova função, ver abaixo).
3. Conta agendamentos `pending`/`confirmed` cujo slot cai dentro de `[startTime, endTime)` naquela data.
4. Se houver algum e `confirmed !== true`, retorna `{ needsConfirm: true, count: N }` sem bloquear nada.
5. Caso contrário, atualiza `time_slots` daquela data com `start_time >= startTime AND start_time < endTime AND status = 'available'` para `status = 'blocked'` (nunca toca em `booked`).
6. Chama `logAction('time_range.block', ...)` registrando data, faixa e motivo.
7. `revalidatePath('/admin/agenda')`.

### `unblockTimeRange(date, startTime, endTime)`

Mesma autenticação; atualiza os slots daquela faixa com `status = 'blocked'` de volta para `status = 'available'`; `logAction('time_range.unblock', ...)`; `revalidatePath('/admin/agenda')`.

### Folga do dia inteiro

Sem action nova — a página da agenda chama `addBlockedPeriod`/`removeBlockedPeriod` (já existentes) diretamente com `date_start = date_end = data visualizada`. A verificação de conflito com agendamentos existentes (contagem + confirmação) é replicada no lado cliente antes de chamar essas actions, do mesmo jeito que no bloqueio de faixa.

## Nova função auxiliar: `ensureSlotsForDate`

Local: `src/lib/schedule/ensureSlots.ts`.

Como a geração de `time_slots` hoje é *lazy* (só acontece quando `/api/availability` é chamado para o mês em questão), um dia futuro nunca visitado no calendário público pode não ter nenhuma linha em `time_slots` ainda. `blockTimeRange` precisa funcionar mesmo assim.

```ts
export async function ensureSlotsForDate(db: SupabaseClient, date: string): Promise<void>
```

Busca `availability_rules` ativas para o weekday da data, busca `time_slots` já existentes para a data, e insere (com `status: 'available'`) qualquer slot de 1h que ainda não exista dentro das janelas de horário do dia — mesmo passo de 1h (`BOOKING.slotDurationMinutes`) usado em `/api/availability`. Não mexe em slots que já existem (preserva `booked`/`blocked` atuais).

Essa função é standalone e não substitui a geração em lote de `/api/availability` (que gera um mês inteiro de uma vez e tem modo demo) — são dois caminhos separados por necessidade: um gera sob demanda para o mês visível no calendário público, o outro garante um único dia sob demanda quando o admin bloqueia algo pela agenda.

## Interface (`/admin/agenda`, view=day)

### Botões na barra de ações do dia

Ao lado de `NewAppointmentButton`, dois novos:

- **`DayOffToggleButton`** — mostra "Marcar folga" ou "Remover folga" dependendo de `blockedAllDay` (já calculado na página). Ao clicar, busca a contagem de agendamentos do dia (já disponível via `appointments.length` que a página já carrega) e, se > 0, mostra `window.confirm` com a contagem antes de chamar a server action correspondente.
- **`BlockTimeButton`** — abre `BlockTimeModal`. Desabilitado quando o dia não tem nenhuma `availability_rule` ativa (não há janela de horário para bloquear).

### `BlockTimeModal` (novo componente, `src/components/admin/BlockTimeModal.tsx`)

Mesmo padrão visual do `NewAppointmentModal`: overlay + card centralizado. Campos:

- Hora início / hora fim — dois `<select>` com opções de hora em hora, limitados a `gridStartMin`–`gridEndMin` do dia (já calculados na página a partir de `availability_rules`).
- Motivo (opcional) — texto livre, mesmo estilo do campo de nota do `NewAppointmentModal`.

Ao submeter, chama `blockTimeRange`. Se a resposta vier com `needsConfirm: true`, mostra a contagem e reenvia com `confirmed: true` ao aceitar. Fecha e `router.refresh()` ao concluir.

### `DayGrid` — renderizar faixas bloqueadas

Hoje o `DayGrid` só recebe `appointments` — não busca nem renderiza `time_slots`. A página da agenda passa a buscar também os `time_slots` da data (`status = 'blocked'`) e repassa como uma nova prop `blockedRanges: { startMin: number; endMin: number }[]` (slots `blocked` contíguos já agrupados em faixas antes de chegar no componente, para simplificar a renderização).

O `DayGrid` renderiza cada faixa como um bloco tracejado (mesmo padrão diagonal `repeating-linear-gradient` já usado no `blockedAllDay`, mas posicionado só naquela faixa de altura/tempo, com a mesma matemática de `minutesToPx` usada pelos agendamentos). Clicar no bloco abre uma confirmação simples (`window.confirm`) e, se aceito, chama `unblockTimeRange` com a faixa exata.

## Casos de borda

- **Fora do expediente**: os `<select>` do modal são limitados a `gridStartMin`–`gridEndMin`, então não dá pra selecionar um horário em que a barbearia já está fechada.
- **Granularidade**: sempre passos de 1h — sem horários quebrados (ex.: 12:30). Consistente com o grid de disponibilidade usado no resto do app.
- **Slots já bloqueados/reservados dentro da faixa**: `blockTimeRange` só marca `available → blocked`; slots já `booked` ficam intactos (agendamento existente nunca é cancelado automaticamente). Slots já `blocked` continuam `blocked` (idempotente).
- **Dia sem regra de expediente**: `BlockTimeButton` desabilitado; só "Marcar folga" fica disponível.
- **Views Semana/Mês**: sem mudanças — o escopo desta fase é só a view Dia, como as Fases A e B.

## Testes

Sem testes unitários novos — a lógica é simples o bastante para validação manual, seguindo o padrão das Fases A e B. Roteiro de teste manual:

1. Marcar folga num dia sem agendamentos — confirma que vira "Folga / fechado" no grid e que `/api/availability` reflete o dia como indisponível.
2. Marcar folga num dia com agendamento existente — confirma que aparece o aviso com contagem antes de bloquear, e que o agendamento não é cancelado.
3. Bloquear uma faixa de horário num dia que já tem `time_slots` gerados (visitado antes via `/api/availability`) — confirma que a faixa aparece tracejada no grid e que os horários bloqueados somem do calendário público.
4. Bloquear uma faixa de horário num dia futuro nunca visitado — confirma que `ensureSlotsForDate` gera os slots corretamente antes de bloquear.
5. Clicar numa faixa bloqueada para desbloquear — confirma que os slots voltam a `available` e reaparecem no calendário público.
6. Rodar `npm test` e `npm run build` antes de commitar.
7. Limpar todos os dados sintéticos de teste no Supabase ao final.
