# Criar agendamento manualmente pelo admin (Fase A)

## Contexto

Segunda fase do material de referência (vídeo/foto em `referencias/WhatsApp Video/Image 2026-07-12 *`), decomposto em `docs/superpowers/specs/2026-07-14-admin-agenda-day-grid-design.md`. Cobre o recurso que hoje não existe: o admin registrar um agendamento manualmente (walk-in, telefone) sem passar pelo link público `/agendar`.

## Decisão chave — reaproveitar, não duplicar

`POST /api/appointments` (usado por `/agendar`) já resolve praticamente toda a lógica de negócio necessária: valida o slot, valida o serviço e complementos, cria ou reaproveita o cliente pelo WhatsApp, gera o código de referência via sequence, cria o agendamento, marca o slot como `booked`, vincula complementos e envia o e-mail de confirmação. Só há dois pontos onde o admin precisa de um caminho próprio:

1. **"Atendimento Exclusivo"** — a rota pública bloqueia esse serviço (é combinado só por WhatsApp); o admin deve poder registrá-lo, já que estaria documentando um horário já combinado por fora.
2. **Nota interna** — a rota pública não aceita `notes`; o formulário do admin precisa salvar a nota já na criação, em vez de exigir um segundo passo.

Por isso, criar uma nova Server Action `createManualAppointment` em `src/app/admin/actions.ts`, seguindo o mesmo padrão de auth das outras ações admin (`getSessionUser()` + `adminDb()` + `logAction()` + `revalidatePath('/admin/agenda')`), reaproveitando a mesma sequência de passos da rota pública mas sem o bloqueio de `is_whatsapp_only` e aceitando `notes`. Cupom fica de fora (não faz sentido para agendamento manual).

## Reaproveitamento de UI

- **Calendário e horários**: os mesmos `MiniCalendar`/`SlotGrid` já usados em `/agendar` e `/reagendar` (`src/components/booking/MiniCalendar.tsx`) — não recriar.
- **Serviços e complementos**: mesmos endpoints públicos `GET /api/services` e `GET /api/complements?serviceId=`, sem o filtro `is_whatsapp_only` (o admin vê o Atendimento Exclusivo na lista também).
- **Cliente**: campo de busca que consulta um novo endpoint leve `GET /api/admin/clients/search?q=` (gated por sessão admin) e mostra até 8 resultados por nome/WhatsApp; selecionar um preenche nome+WhatsApp. Se não encontrar, o admin digita nome+WhatsApp normalmente — o find-or-create da action cuida do resto (evita duplicar cliente por erro de digitação, o mesmo cuidado documentado no `formatWhatsApp`).

## Fluxo e gatilho

Botão "+ Novo agendamento" no cabeçalho da visão Dia de `/admin/agenda` (mesmo lugar do "+" no vídeo de referência). Abre um painel modal (reaproveita o padrão visual de `ComplementsOverlay` em `AgendarFlow.tsx`: `fixed inset-0` com card centralizado) com os passos citados acima em uma coluna só (não um wizard de múltiplas telas como o público — é um formulário único, já que quem preenche é o próprio admin, não precisa da cerimônia de guiar um cliente). Ordem dos campos: serviço → complementos → data/hora → cliente (buscar ou novo) → nota → salvar.

Ao salvar com sucesso: fecha o modal e atualiza a agenda (o novo agendamento aparece na grade).

## Fora de escopo aqui

- Fase C (atalho de bloqueio de horário pela agenda).
- Edição de um agendamento já existente (já é possível via `AppointmentDetailSheet` → ações existentes).
- Cupom de desconto no fluxo manual.
