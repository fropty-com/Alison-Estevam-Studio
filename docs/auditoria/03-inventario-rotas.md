# Inventário de páginas — Alison Estevam Studio

> Entregável do PDF de auditoria de UX/UI (§27, "inventário de páginas e componentes"). Complementa `docs/design-audit.md`, que cobre os problemas/melhorias por área — aqui o foco é mapear as 37 rotas do projeto.
>
> **Status**: ✅ auditado nesta rodada de sessões · ⚪ não testado ao vivo (login/dado semeado fora do escopo desta sessão, ver `docs/design-audit.md` §10) · — não aplicável.

## Site público (não autenticado)

| Rota | Objetivo | Componentes principais | Status |
|---|---|---|---|
| `/` | Página institucional — apresentação, portfólio, serviços, cuidados, depoimentos, CTA de agendamento | `HeroSection`, `SobreSection`, `GaleriaSection`, `ServicosSection`, `CuidadosSection`, `DepoimentosSection`, `Nav`, `Footer` | ✅ |
| `/sobre` | Texto institucional sobre o barbeiro/estúdio | conteúdo estático | ⚪ |
| `/termos` | Termos de serviço | conteúdo estático | ⚪ |
| `/privacidade` | Política de privacidade | conteúdo estático | ⚪ |
| `/licencas` | Licenças de terceiros | conteúdo estático | ⚪ |
| `/produtos` | Vitrine de produtos da loja (grade filtrável por categoria) | `ProductsPage`, grade `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | ✅ |
| `/produtos/[slug]` | Página de detalhe de um produto — foto, descrição, preço, adicionar ao carrinho | detalhe do produto, `CartButton` | ✅ |

## Fluxo de agendamento (público, sem login obrigatório)

| Rota | Objetivo | Componentes principais | Status |
|---|---|---|---|
| `/agendar` | Fluxo completo de novo agendamento — serviço → complementos/cuidados → data/horário → dados do cliente → resumo → confirmação | `AgendarFlow` (1200+ linhas), `StepHeader`/`DetailCard`/`ResultCard` (`BookingChrome`), `MiniCalendar`/`SlotGrid` | ✅ |
| `/cancelar/[code]` | Cancelamento de um agendamento existente via código de referência | `CancelForm`, `StepHeader`, `ResultCard` | ✅ |
| `/confirmar/[code]` | Confirmação de presença (lembrete 2h antes) | `ConfirmForm`, `ConfirmAttendanceButton` | ✅ |
| `/reagendar/[code]` | Reagendamento — escolher nova data/horário para um agendamento existente | `RescheduleFlow`, `MiniCalendar`/`SlotGrid` | ✅ |
| `/entrar` | Login do cliente por WhatsApp (telefone + código OTP) | `EntrarFlow` | ✅ |

## Loja / checkout (público)

| Rota | Objetivo | Componentes principais | Status |
|---|---|---|---|
| `/checkout` | Retirada/envio, endereço, cupom, resumo, pagamento (Pix/cartão via Mercado Pago) | `CheckoutClient`, `PaymentBrick`, `ShippingRateSelect` | ✅ |
| `/pedido/[code]` | Confirmação de pedido de produto (pós-pagamento) | detalhe do pedido, mapa de status (`src/lib/orders.ts`) | ⚪ |

## Área do cliente (login por WhatsApp obrigatório)

| Rota | Objetivo | Componentes principais | Status |
|---|---|---|---|
| `/conta` | Dashboard do cliente — saudação, fidelidade, próximo agendamento, histórico recente | `ClientHeader`, `ClientAccountMenu`, `AppointmentCard` | ✅ |
| `/perfil` | Tela única com dados de cadastro + accordion (fidelidade/conta/avaliações/pagamentos/pedidos) | `EditClientProfileForm`, `AccordionSection` × 5 | ✅ |
| `/perfil/conta` | Detalhes da conta — consentimento de WhatsApp, lembretes por e-mail, exclusão de conta | `AccountSettingsSection` | ✅ |
| `/perfil/avaliacoes` | Avaliar atendimentos concluídos + histórico de avaliações | `ReviewsSection`, `ReviewForm` | ✅ |
| `/perfil/fidelidade` | Cartão fidelidade isolado | `LoyaltyCard` | ✅ |
| `/perfil/pagamentos` | Histórico de pagamentos de atendimentos | `PaymentsListSection` | ✅ |
| `/perfil/pagamentos/[id]` | Recibo detalhado de um pagamento (com opção de reenvio por e-mail) | recibo, `ReceiptEmailButton` | ✅ |
| `/perfil/pedidos` | Histórico de pedidos de produto do cliente | `OrdersListSection` | ✅ |

## Área administrativa (login de equipe — `Admin (legado)` / `Alison Estevam`)

| Rota | Objetivo | Componentes principais | Status |
|---|---|---|---|
| `/admin/login` | Login da equipe | formulário de login | — (fora do escopo de segurança) |
| `/admin` | Dashboard — agenda de hoje, métricas do mês, aniversariantes | `AgendaSummaryCards`, `AppointmentDetailSheet` | ⚪ |
| `/admin/agenda` | Agenda/calendário do barbeiro — visões dia/semana útil/semana/mês, bloqueio de horários, novo agendamento manual | `DayGrid`, `WeekGrid`, `AgendaStrip`, `AgendaViewSegmented`, `AgendaDatePicker`, `BlockTimeModal`, `NewAppointmentModal` | ⚪ |
| `/admin/espera` | Fila de espera de clientes sem horário disponível | `WaitlistEntryRow`, `AddWaitlistModal` | ⚪ |
| `/admin/clientes` | Tabela/lista de clientes, toggle VIP, busca, aniversariantes, clientes ausentes | `ClientsTable`, `AbsentClientsCard` | ⚪ |
| `/admin/clientes/[id]` | Detalhe de um cliente (histórico, fidelidade, dados) | equivalente de página do `ClientDetailDrawer` | ⚪ |
| `/admin/servicos` | Gestão de serviços/cuidados — preço, duração, ativo/inativo, métricas e insights | `ServiceRow`, cards de estatística e insight, gráficos | ⚪ |
| `/admin/produtos` | Gestão de produtos da loja (abas: produtos, frete, pedidos) | `ProductCard`, `ProductFormModal`, `ShippingRateRow`, `OrderRow` | ⚪ |
| `/admin/faturamento` | Relatórios de faturamento (serviços + produtos) | cards de receita, gráficos de tendência | ⚪ |
| `/admin/financeiro` | Financeiro — DRE, despesas, fluxo de caixa | `ExpenseList`, `ExpenseForm`, `FinanceCharts` | ⚪ |
| `/admin/operacional` | Indicadores operacionais (fonte do agendamento, etc.) | cards operacionais | ⚪ |
| `/admin/relatorios` | Hub de exportação de relatórios (Excel/PDF) | seletor de relatório | ⚪ |
| `/admin/relatorios/[tipo]/imprimir` | Versão para impressão/exportação de um relatório específico | layout de impressão | ⚪ |
| `/admin/atividade` | Log de atividade da equipe | lista de eventos | ⚪ |
| `/admin/configuracoes` | Configurações — equipe, horários de funcionamento, períodos bloqueados, taxas de pagamento, cupons, fidelidade | `StaffMemberRow`, `AvailabilityRuleRow`, `PaymentFeeSettingRow`, `CouponRow`, `LoyaltySettingsForm` | ⚪ |
| `/admin/perfil` | Perfil da equipe — dados, foto, papel (proprietário/funcionário) | `EditStaffProfileForm` | ⚪ |

## Chrome compartilhado (não são rotas, mas fazem parte de toda navegação)

| Componente | Onde aparece | Status |
|---|---|---|
| `Nav` | Todas as páginas públicas | ✅ (bug crítico de tablet corrigido nesta sessão) |
| `ClientHeader` | Toda a área do cliente | ✅ |
| `AdminNav` + `AdminTopBar` | Toda a área administrativa | ✅ (mobile corrigido nesta sessão; oportunidade de tablet documentada) |
| `Footer` | Páginas públicas de conteúdo | ⚪ |
| `CartDrawer` | Site público + loja | ✅ |
| `FloatingWhatsapp` | Fluxos de agendamento/checkout (oculto na área logada do cliente) | ✅ |

---

**Legenda de "Status"**: ✅ significa que a rota (ou seu chrome/fluxo compartilhado) recebeu verificação ativa nesta rodada de auditoria — via código + verificação ao vivo no browser onde possível. ⚪ significa que a rota não foi clicada/inspecionada ao vivo nesta sessão (login administrativo e dados semeados estão fora do escopo de segurança desta sessão, conforme `docs/design-audit.md`), mas não há indício de problema conhecido nelas além do já documentado (ex.: oportunidade de tablet do `AdminNav`, que afeta todas as rotas `/admin/*`).
