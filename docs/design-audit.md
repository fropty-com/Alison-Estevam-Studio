# Auditoria de UX/UI — Alison Estevam Studio

> Gerada a partir do briefing em `referencias/Auditoria de UX-UI — Alison Estevam Studio.pdf`. Modo análise e planejamento — nenhuma mudança de código foi feita antes deste documento.
>
> **Este relatório não repete o que já está documentado.** O projeto já tem dois documentos de referência que cobrem parte do escopo pedido no PDF:
> - [`docs/design-system.md`](design-system.md) — tokens (cor, tipografia, espaçamento, bordas, breakpoints, movimento, ícones, estados) já em uso real no código. **Isso cobre o item "Design System" do PDF.** Não há necessidade de reconstruir tokens — eles existem e são seguidos com disciplina.
> - [`docs/auditoria/02-responsividade-temas.md`](auditoria/02-responsividade-temas.md) — checagem de overflow horizontal em mobile/tablet/desktop por tela, com um achado corrigido (`ClientsTable`). **Isso cobre parte do item "Responsividade" do PDF** (ausência de overflow), mas deixa em aberto, por conta própria: contraste WCAG formal, teste 100% por teclado, e leitor de tela — ver seção 6 abaixo.
>
> Este documento foca no que **ainda não tinha sido auditado**: consistência de botões e cards como componentes de código (não só visual), jornada de agendamento ponta a ponta, navegação, e o checklist de acessibilidade que os documentos anteriores sinalizaram como pendente.

---

## 1. Resumo executivo

A base visual do projeto está em ótimo estado — melhor do que o briefing do PDF presume como ponto de partida. As 4 cores de marca, a escala tipográfica de 3 famílias, o espaçamento em grid de 4px e a ausência de `border-radius` decorativo são aplicados **consistentemente** em praticamente todas as ~37 rotas e dezenas de componentes revisados. Não existe "descaracterização" a corrigir.

O problema real não é inconsistência visual — é **duplicação de código por trás de uma aparência consistente**. Por exemplo: o botão dourado primário (`bg-gold text-charcoal-deep`, hover `bg-gold-light` + leve elevação) aparece em **27 arquivos diferentes**, cada um reescrevendo a mesma classe com pequenas variações soltas de tamanho de fonte, padding e tracking (`text-[9px]` vs `text-[9.5px]` vs `text-xs`; `py-[16px]` vs `py-[17px]` vs `py-[12px]`). O projeto já tem um componente `Button` completo, com todas as variantes, tamanhos e o estado `loading` que o PDF pede — em [`src/components/ui/Button.tsx`](../src/components/ui/Button.tsx) — mas **ele não é importado em lugar nenhum do código**. É o achado mais concreto e de maior alavancagem deste relatório.

O fluxo de agendamento público (`AgendarFlow.tsx`, 1272 linhas) já implementa a maior parte do que o PDF pede como boa prática: preço e duração sempre visíveis desde a escolha do serviço (`RunningSummary`), indicador de progresso clicável que preserva os dados ao voltar, sidebar exclusiva para desktop/tablet (não é o mobile "esticado"), fila de espera quando não há horário, cupom de desconto, download de `.ics`, confirmação via WhatsApp com todos os dados. Não há uma reconstrução de fluxo a fazer aqui — há refinamento e componentização do que já funciona bem.

O trabalho real desta auditoria, portanto, é: **(1)** extrair os padrões repetidos (botão, card, empty state, badge de status) em componentes reais e aplicá-los onde já existe duplicação; **(2)** fechar a lacuna de acessibilidade que a auditoria anterior deixou explicitamente em aberto (contraste, teclado, foco, aria); **(3)** dar um polimento pontual de hierarquia/microinteração em alguns pontos específicos listados abaixo. Nada disso exige alterar o fluxo de agendamento, a autenticação, o schema do banco ou a identidade visual.

---

## 2. O que já está bem resolvido (não mexer)

Registrado aqui para não ser "corrigido" por engano durante a implementação:

- **Sistema de tokens** (`tailwind.config.ts`, `globals.css`) — completo, documentado em `docs/design-system.md`, sem cor/tamanho fora da escala usados de forma sistemática (arbitrary values existem, mas para ajuste fino pontual, não para substituir a escala).
- **Tema claro/escuro** — via `data-theme` + variáveis CSS, cobre `color-scheme` nativo (inputs de data, selects), sem duplicar componentes por tema.
- **`prefers-reduced-motion`** — já implementado globalmente em `globals.css:217-225`.
- **Foco visível** — `:focus-visible` global com outline dourado (`globals.css:86-93`), não removido em lugar nenhum verificado.
- **`BookingChrome.tsx`** (`BackLink`, `StepHeader`, `DetailCard`) — exemplo positivo de componentização já feita corretamente no fluxo de agendamento.
- **`MiniCalendar` / `SlotGrid`** — compartilhados entre agendamento novo e reagendamento, com suporte a teclado e ARIA, estados visuais distintos para passado/indisponível/disponível/hoje/selecionado.
- **Transparência de preço/duração/profissional durante o agendamento** — via `RunningSummary`, visível desde a escolha do serviço até a confirmação, exatamente como o PDF pede.
- **Mensagens de erro perto do campo**, nunca só cor (ex. `DetailsForm`, `SummaryStep`) — texto explicando o que corrigir, sempre.
- **Loading states com feedback textual** (`"Confirmando"`, `"Reagendando…"`, dots animados) em todos os formulários de submissão revisados.
- **Responsividade sem overflow horizontal** — já auditado e corrigido em `docs/auditoria/02-responsividade-temas.md`.

---

## 3. Problemas por área

| Área / Rota | Problema | Evidência | Impacto | Prioridade | Recomendação |
|---|---|---|---|---|---|
| Global — Botões | Componente `Button` pronto e completo, mas usado em **zero** lugares; 27 arquivos reescrevem o botão primário dourado à mão com valores soltos (`text-[9px]`/`text-[9.5px]`/`text-xs`, `py-[16px]`/`py-[17px]`/`py-[12px]`) | Grep `from '@/components/ui/Button'` → 0 resultados; grep `bg-gold text-charcoal-deep` → 27 arquivos | Alto risco de drift silencioso (um botão muda, os outros 26 não); manutenção cara | **Crítica** | Migrar os botões primário/secundário/destrutivo mais repetidos para `<Button>`, começando por `SummaryStep`, `DetailsForm`, `CancelForm`, `ConfirmForm`, `RescheduleFlow`, `Nav` |
| Global — Cards | Padrão de card (`border border-offwhite/10`, `bg-offwhite/5`, padding em `p-5`/`p-6`/`px-[18px] py-[13px]`) repetido sem componente comum em `ServiceRow`, `SummaryStep`, `AccordionSection`, `RescheduleFlow`/`CancelForm`/`ConfirmForm` (tela de resultado) | Leitura direta dos 6+ componentes | Média — visualmente coeso hoje, mas cada ajuste futuro (ex. esta sessão mudou o espaçamento do accordion) precisa ser replicado manualmente arquivo por arquivo | Alta | Criar `Card`/`DetailCard` genérico (o `DetailCard` de `BookingChrome.tsx` já é 80% disso) e adotá-lo nos cards de resultado/resumo |
| `/admin/servicos` | Já corrigido nesta sessão (altura dos cards, coluna de preço) — nenhum problema novo encontrado | — | — | — | Nenhuma ação |
| `/perfil` | Já corrigido nesta sessão (accordion, largura de card, grid de telefone/nascimento) — nenhum problema novo encontrado | — | — | — | Nenhuma ação |
| Fluxo de agendamento — sem horário no dia | `SlotPicker` mostra "Nenhum horário disponível" + fila de espera; correto. `SlotGrid` (usado em reagendamento) retorna `null` silenciosamente quando não há horário, sem essa mesma mensagem | `MiniCalendar.tsx` — `SlotGrid` não renderiza texto de estado vazio | Baixa — `RescheduleFlow` já cobre esse caso no nível de chamada (linha 108-121), então o usuário não fica sem feedback, mas o componente em si não é autossuficiente | Média | Mover a mensagem de "sem horários" para dentro de `SlotGrid` para que qualquer chamador futuro não precise reimplementá-la |
| Global — Acessibilidade | Nenhuma auditoria formal de contraste WCAG, navegação 100% por teclado ou leitor de tela foi feita (sinalizado como pendente em `docs/auditoria/02-responsividade-temas.md`) | Texto explícito no documento anterior | Alto — obrigação legal/ética, e o PDF pede isso explicitamente | **Crítica** | Ver checklist na seção 6 |
| Global — `font-data` vs. briefing do PDF | PDF pede Cormorant Garamond para "valores premium"; o projeto usa uma 3ª família (`font-data` = Lora) para números/dados tabulares (preço, telefone) | `tailwind.config.ts:49`, uso em `ServiceRow.tsx:80`, `SummaryStep` | Nenhum — decisão deliberada, registrada aqui conforme pedido do PDF (seção 29, "decisões ambíguas") | — | **Manter.** Lora tem melhor legibilidade numérica que um serifado display e já está em uso disciplinado; migrar tudo para Cormorant arriscaria pior legibilidade sem ganho visual claro |
| `Nav.tsx` (público) | Botão "Agendar" do menu mobile drawer e da topbar mobile usam tamanhos de fonte diferentes (`text-2xs` em ambos, ok) mas o link "Produtos"/"Entrar" no drawer usa borda (`border-offwhite/[0.18]`) enquanto no desktop é texto puro sem borda — inconsistência menor de tratamento entre os dois breakpoints para o mesmo link | `Nav.tsx:149-160` vs `202-215` | Baixa | Baixa | Padronizar (ambos podem ser texto sem borda, ou ambos com borda) — decisão de gosto, não bug |
| Global — Empty states | O PDF pede empty states úteis com CTA (ex. "Agendar agora"). Não foi possível confirmar cobertura completa em `/perfil/pedidos`, `/perfil/pagamentos`, `/perfil/avaliacoes` nesta rodada (não lidos neste ciclo de auditoria) | — | Desconhecido | Média | Verificar os 3 arquivos na Fase 2 antes de declarar o item fechado |

---

## 4. Problemas globais consolidados

**Botões** — ver item crítico acima. Estados já cobertos pelo componente `Button` existente (hover/active/disabled/loading); falta apenas adoção.

**Cards** — mesmo padrão visual, sem componente único. Ver item acima.

**Tipografia** — escala já definida e seguida; nenhuma inconsistência de hierarquia encontrada nas páginas revisadas. `font-data` é uma extensão deliberada do sistema, não um desvio a corrigir.

**Cores e contraste** — uso do dourado como acento (não indiscriminado) confirmado em todos os componentes revisados — nunca usado como cor de fundo de texto corrido, sempre em CTA/valor/destaque pontual. Contraste formal (WCAG AA/AAA) **não verificado** — pendente, ver seção 6.

**Navegação** — `Nav.tsx` (público), `ClientHeader`/`AdminNav`/`AdminTopBar` (área logada) já passaram por ajustes nesta mesma sessão de trabalho (altura, cluster de ações, avatar). Nenhum problema estrutural novo encontrado; uma inconsistência cosmética menor listada na tabela acima.

**Animações** — durações e easings já padronizados via tokens nomeados (`brand-out`, `brand-circ`, 250/350/450/600ms); `prefers-reduced-motion` já respeitado globalmente. Nenhuma animação "exagerada" (bounce/zoom) encontrada nos componentes revisados.

**Acessibilidade** — maior lacuna real deste relatório. Ver seção 6.

**Performance visual** — não auditado nesta rodada (fora do escopo do que foi lido); candidato a checagem pontual na Fase 4 (Lighthouse/Core Web Vitals no fluxo de agendamento e na home, que têm imagens).

---

## 5. Plano de implementação em fases

### Fase 1 — Problemas críticos
1. Adotar `<Button>` nos pontos de maior repetição: `SummaryStep`, `DetailsForm`, `CancelForm`, `ConfirmForm`, `RescheduleFlow`, `WaitlistForm`, `Nav` (CTA "Agendar" desktop + mobile). Cada substituição é local e não muda comportamento — só remove duplicação.
2. Checklist de acessibilidade essencial (contraste + foco + aria) — seção 6, itens 1-3.
3. Padronizar o item de navegação inconsistente no `Nav.tsx` (drawer mobile vs. desktop).

### Fase 2 — Consistência visual
1. Extrair `Card`/`DetailCard` genérico a partir do já existente em `BookingChrome.tsx` e aplicar em `SummaryStep`, telas de resultado (`RescheduleFlow`/`CancelForm`/`ConfirmForm`).
2. Mover a mensagem de "sem horários" para dentro de `SlotGrid`.
3. Verificar empty states de `/perfil/pedidos`, `/perfil/pagamentos`, `/perfil/avaliacoes`.
4. Varredura dos botões secundário/destrutivo/ghost restantes (fora dos pontos críticos da Fase 1) para adoção do `Button`.

### Fase 3 — Refinamento
1. Revisão de microinterações pontuais que restarem após Fase 1/2 (hover states de links de navegação, badges de status).
2. Loading skeletons onde hoje há apenas texto ("Carregando…") sem placeholder visual, se algum for encontrado durante a Fase 2.

### Fase 4 — Validação
1. Checklist de acessibilidade completo (seção 6, itens 4-8).
2. Regressão visual nos breakpoints já definidos como padrão do projeto (375/768/1024/1280/1920), reaproveitando o método de `docs/auditoria/02-responsividade-temas.md`.
3. `tsc --noEmit` → `lint` → `build` → `test` → checagem manual do fluxo de agendamento completo (novo, reagendar, cancelar, confirmar presença) nos dois temas.

---

## 6. Checklist de acessibilidade (lacuna herdada da auditoria anterior)

Pendente desde `docs/auditoria/02-responsividade-temas.md` (seção "Não coberto nesta fase"). Itens, em ordem de execução:

1. **Contraste WCAG AA** — checar formalmente `text-offwhite/XX` e `text-gold` sobre `bg-charcoal`/`bg-charcoal-mid` nas opacidades mais baixas usadas hoje (ex. `/25`, `/30`, `/35` aparecem com frequência em labels auxiliares) — essas são as candidatas mais prováveis a falhar 4.5:1 em texto pequeno.
2. **Foco visível em todos os controles customizados** — o outline global existe, mas verificar que nenhum componente customizado (toggle de `ServiceRow`, `StepDots`, calendário) o suprime com `outline-none` sem substituto.
3. **`aria-label` em ícones/botões sem texto** — já presente em vários pontos revisados (`Nav`, `CartButton`); varrer os que faltam.
4. **Navegação 100% por teclado** — especialmente `MiniCalendar`/`SlotGrid` (já tem suporte, validar Tab/Enter/Escape na prática) e modais/drawers do admin (`CartDrawer`, `BlockTimeModal`, etc. — confirmar `Escape` fecha e foco fica preso dentro).
5. **Ordem de tabulação lógica** nas telas com mais campos (`DetailsForm`, `SummaryStep`, modais de admin).
6. **HTML semântico** — checagem pontual de headings (`h1`/`h2` únicos por página) nas rotas principais.
7. **Alt text em imagens** — confirmar em `Confirmation` (foto do Alison), galeria da home, avatares de cliente.
8. **Leitor de tela** — teste manual básico (NVDA/VoiceOver) no fluxo de agendamento completo, não coberto por nenhuma ferramenta automatizada usada até aqui.

### Fechamento — itens 1-7 concluídos em rodada posterior

Varredura completa do projeto (não apenas dos arquivos já revisados), item a item:

1. **Contraste WCAG AA** — já fechado na Fase 1 (piso `/55`, ver seção 10).
2. **Foco visível** — auditados todos os usos de `outline-none` no projeto (39 arquivos). A esmagadora maioria já segue o padrão correto (`outline-none` + `focus:border-*`/`focus-visible:border-*` como substituto). Achado real: campos com erro de validação (`EntrarFlow`, `DetailsForm` em `AgendarFlow`) trocavam a borda para vermelho mas não tinham *nenhum* indicador de foco quando o campo já estava com erro — corrigido adicionando `focus:border-error focus:bg-error/5` ao branch de erro.
3. **`aria-label` em ícones/botões sem texto** — varredura automatizada (script) + verificação manual encontrou 1 gap real: `VipToggle` (`ClientsTable.tsx`), um `role="switch"` sem nome acessível — corrigido com `aria-label`.
4. **Navegação 100% por teclado / Escape + foco preso** — `useModalA11y` generalizado para aceitar um segundo argumento `active` (drawers que ficam sempre montados e só alternam via CSS, como `CartDrawer`/`ClientDetailDrawer`, precisavam disso para não roubar foco enquanto fechados). Adotado em 6 componentes que não tinham nenhum tratamento ou tinham tratamento parcial: `CartDrawer`, `ClientDetailDrawer`, `AppointmentDetailSheet` (tinha Escape, faltava trap de foco), `AvatarCropModal`, `Nav` (drawer mobile — tinha Escape, faltava trap), `AdminNav` (drawer mobile — não tinha nada). Testado ao vivo no browser: abrir o menu move o foco para o primeiro link, `Escape` fecha corretamente.
5. **Ordem de tabulação** — varredura por `tabIndex` positivo (`{1}`, `{2}`...) no projeto inteiro: zero ocorrências. Nenhuma ordem de tab customizada existe para quebrar a ordem natural do DOM.
6. **HTML semântico (headings)** — varredura de `<h1>` por rota: 13 páginas sem nenhum `h1` no arquivo servidor, a maioria delegando para um componente cliente. Achados reais confirmados: fluxo de agendamento inteiro (`/agendar`, `/cancelar`, `/confirmar`, `/reagendar`, tela de sucesso) usava `<h2>` como título mais alto da página — promovido para `<h1>` (`StepHeader` em `BookingChrome.tsx` + o header da tela de sucesso em `AgendarFlow.tsx`); `/entrar` tinha o mesmo problema (`EntrarFlow.tsx`); 6 sub-páginas de `/perfil` (`conta`, `avaliacoes`, `fidelidade`, `pagamentos`, `pagamentos/[id]`, `pedidos`) não tinham heading nenhum no corpo — o título só existia como texto visual na topbar (`<span>`, não semântico) — corrigido com um `<h1 className="sr-only">` no corpo de cada uma, sem alterar nada visualmente.
7. **Alt text em imagens** — varredura de todo `<img>`/`<Image>` do projeto: nenhum gap encontrado. Avatares usam o nome da pessoa como alt, fotos de produto usam o nome do produto, a galeria da home já tinha alt descritivo único por imagem, ícones decorativos já usavam `aria-hidden`.

Adicional (não estava na lista original, mas é parte do mesmo domínio): mensagens de erro dinâmicas (`{error && <p>...}`) em 12 componentes voltados ao cliente (`EntrarFlow`, `AgendarFlow`, `CancelForm`, `ConfirmForm`, `RescheduleFlow`, `ConfirmAttendanceButton`, `CheckoutClient`, formulários de `/perfil`) ganharam `role="alert"` para serem anunciadas por leitor de tela assim que aparecem, sem exigir que o usuário navegue até elas. Os equivalentes só-admin (mesmo padrão em ~20 arquivos de `src/components/admin`) ficam como recomendação futura — escopo desta rodada priorizou as telas que 90%+ dos usuários (clientes) realmente usam.

**Item 8 (leitor de tela) continua pendente** — requer teste manual com ferramenta externa (NVDA/VoiceOver), fora do que é possível verificar nesta sessão.

Validado com `tsc --noEmit` → `eslint` → `build` de produção → 65 testes, mais verificação ao vivo no browser (heading correto renderizado em `/entrar`, foco/Escape do drawer mobile confirmados via inspeção do DOM).

---

## 7. Tabela-resumo final

| Área | Problema anterior | Melhoria aplicada | Impacto |
|---|---|---|---|
| Botões | Componente `Button` pronto, mas não usado; 27 arquivos duplicam o CTA dourado à mão | *(a aplicar na Fase 1)* Adoção de `<Button>` nos pontos de maior repetição | Menos código, zero drift visual futuro |
| Cards de resumo/resultado | Padrão repetido sem componente comum | *(a aplicar na Fase 2)* `Card` genérico extraído de `BookingChrome` | Manutenção única |
| Acessibilidade | Contraste/teclado/leitor de tela nunca auditados formalmente | *(a aplicar nas Fases 1 e 4)* Checklist da seção 6 | Conformidade + inclusão |
| `SlotGrid` sem horário | Retorna `null` silenciosamente, mensagem só existe no chamador | *(a aplicar na Fase 2)* Mensagem movida para dentro do componente | Componente autossuficiente |
| `/perfil`, `/admin/servicos` | Espaçamento, alinhamento, largura de card | **Já corrigido nesta mesma sessão**, antes desta auditoria | Concluído |
| Design system, fluxo de agendamento, navegação, responsividade, tema claro/escuro | — | Nenhum problema estrutural novo — já bem resolvidos e documentados | Nenhuma ação necessária |

---

## 8. Arquivos revisados nesta auditoria

`tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/Button.tsx`, `src/components/admin/ServiceRow.tsx`, `src/components/booking/BookingChrome.tsx`, `src/components/booking/MiniCalendar.tsx`, `src/components/booking/AgendarFlow.tsx` (completo, 1272 linhas), `src/components/booking/RescheduleFlow.tsx`, `src/components/booking/CancelForm.tsx`, `src/components/booking/ConfirmForm.tsx`, `src/components/layout/Nav.tsx`, `src/components/layout/Footer.tsx`, inventário completo de 37 rotas em `src/app`, `docs/design-system.md`, `docs/auditoria/02-responsividade-temas.md`.

## 9. Pendências / recomendações futuras

- `ConfirmAttendanceButton.tsx`, `AdminNav.tsx`, `AdminTopBar.tsx`, `ClientHeader.tsx` não foram relidos nesta rodada (já conhecidos de sessões de trabalho anteriores no mesmo projeto — sem indicação de problema novo, mas não formalmente revisitados aqui).
- Performance visual (peso de imagem, CLS, carregamento de fonte) não auditada — candidata a uma checagem pontual com Lighthouse na Fase 4.
- Teste de leitor de tela real (não apenas checagem estática de aria) requer uma sessão dedicada com ferramenta externa.

---

## 10. Fechamento — o que foi de fato implementado (Fases 1-3)

Execução completa após aprovação do relatório. Cada item abaixo foi commitado e enviado para produção individualmente, validado com `tsc --noEmit` → `lint` → `build` → `test` (65 testes) a cada passo.

### Fase 1 — concluída
- **`Button`**: recalibrado (tamanhos `sm`/`lg` passaram a bater exatamente com os padrões reais de CTA de nav e de formulário; peso de fonte corrigido para `font-medium` nos variants sólidos, que estava `font-light` por engano; variant `destructive` recalibrado do estilo com borda — nunca usado de fato — para o padrão sólido real). Adotado em: `WaitlistForm`, `DetailsForm`, `SummaryStep` (`AgendarFlow`), `ConfirmForm`, `RescheduleFlow`, `CancelForm`, CTA "Agendar" da `Nav` pública.
- **Hierarquia do drawer mobile**: links "Produtos"/"Entrar" perderam a borda tipo-botão que competia com o CTA principal — agora texto plano, igual aos demais itens do menu.
- **Contraste WCAG**: piso de opacidade de `text-offwhite` elevado de valores como `/15`–`/50` (alguns medindo ~2.1:1) para `/55` (4.79:1, passa AA para texto normal) em 122 arquivos. Pares base/hover que colidiram no mesmo valor após o ajuste tiveram o hover elevado para `/85` para preservar o feedback de interação.
- **Modais do admin**: `BlockTimeModal`, `EditClientModal`, `ProductFormModal`, `AddWaitlistModal`, `NewAppointmentModal` ganharam `role="dialog"`/`aria-modal`, Escape para fechar e foco preso dentro do painel via o novo hook `useModalA11y`.
- **Varredura de aria-label e teclado**: sem lacunas reais encontradas — os 2 candidatos identificados por busca automatizada eram falsos positivos (ícone com texto visível ao lado); os cards com `role="button"` do fluxo de agendamento já tinham `tabIndex`/`onKeyDown` corretos.

### Fase 2 — concluída
- **`DetailCard`**: adotado em `SummaryStep` (antes duplicava a mesma estrutura já usada em `BookingChrome.tsx`); tipo de `rows` ampliado para `React.ReactNode` (necessário para a linha de cupom com botão "remover" embutido).
- **`ResultCard`**: extraído a partir do card "concluído" idêntico repetido em `CancelForm`, `ConfirmForm` e `RescheduleFlow`.
- **`SlotGrid`**: deixou de retornar `null` quando não há horários — renderiza a mensagem "sem horários" internamente, com `emptyMessage`/`emptySlot` opcionais (usado para injetar o `WaitlistForm`).
- **Empty states com CTA**: `PaymentsListSection` e `ReviewsSection` (`/perfil/pagamentos`, `/perfil/avaliacoes`) não tinham nenhum caminho de ação — ganharam link "Agendar agora", igual ao já existente em `OrdersListSection`.

### Fase 3 — concluída
- **Skeletons de loading**: `ServicePicker`, `CarePicker` (agendamento) e `PaymentBrick` (checkout) trocaram o texto "Carregando…" por placeholders visuais pulsantes (`Skeleton`, `ServiceListSkeleton`), com `role="status"` para leitor de tela.
- **Badge de status**: `OrdersListSection` e `pedido/[code]/page.tsx` duplicavam o mesmo mapa de label/cor de status de pedido byte a byte — extraído para `src/lib/orders.ts`. O padrão do admin (`OrderRow.tsx`, dot + i18n) foi mantido separado por ser um tratamento visual genuinamente diferente, não duplicação.

## 11. Auditoria de tablet (768-1024px) — feita em rodada posterior

O PDF pede explicitamente para não tratar tablet como "mobile ampliado". Verificação: os breakpoints deste projeto são `sm 480 / md 768 / lg 1024 / xl 1280 / 2xl 1440` (`tailwind.config.ts`), ou seja, a faixa de tablet do PDF (768-1024px) corresponde exatamente a `md`→`lg-1` no sistema de tokens já existente.

### Achado crítico confirmado e corrigido

**`Nav.tsx` (topbar pública) — CTA "Agendar" e link "Entrar" inacessíveis em 1024-1279px.** A barra desktop virava visível em `lg:` (1024px), mas seu conteúdo real (logo + 6 links + cluster de ações) precisa de ~1219px para caber — medido ao vivo no browser (`getBoundingClientRect`), o cluster de ações (tema, Produtos, carrinho, Entrar, botão Agendar) renderizava com a borda direita em **x=1219 dentro de um viewport de apenas 1024px**, ou seja, ficava fisicamente fora da tela. Como o projeto usa `overflow-x: hidden` no body, isso não virava nem uma barra de rolagem — o CTA principal do site ficava **impossível de clicar** em qualquer tablet-paisagem ou notebook pequeno nessa faixa (achado de maior severidade desta sessão inteira: bloqueava a ação mais importante do site).

Causa raiz: o breakpoint de troca (`lg:hidden`/`hidden lg:block`) estava um nível abaixo do necessário, e o espaçamento "extra" que o próprio nav ganhava em telas grandes (`xl:gap-8` entre os links, `xl:px-[60px]` no container) piorava ainda mais a matemática exatamente na faixa 1280-1439px depois de mover ingenuamente o breakpoint para `xl`.

Corrigido em duas partes:
1. Barra mobile/desktop trocam em `xl:` (1280px) em vez de `lg:` — dá margem real ao conteúdo medido (1219px).
2. O espaçamento extra (`gap-8`, `px-[60px]`) passa a ativar só em `2xl:` (1440px) em vez de `xl:` — sem isso, a própria folga "premium" reintroduzia o overflow na faixa 1280-1439px.

Testado ao vivo no browser em 1024 (mostra a barra compacta, sem overflow), 1280, 1440 e 1600px — nenhum elemento fica fora do viewport em nenhuma dessas larguras.

### Verificado e confirmado correto (não precisa de ação)

- **`/produtos`** — grid já é `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`: 3 colunas dedicadas para tablet, não reaproveita nem o layout de 2 colunas do mobile nem o de 4 do desktop.
- **`AgendarFlow` (sidebar de resumo)** — só aparece em `lg:` (1024px+). Verificado que em 768px (tablet retrato) não há largura confortável para sidebar (260px) + conteúdo principal lado a lado; a decisão de manter o resumo condensado abaixo do formulário nessa faixa é correta, não um "mobile esticado" por negligência.
- **`AdminTopBar`** (corrigido nesta mesma sessão, rodada de mobile) — cluster de ícones (~302px) cabe com folga em qualquer largura ≥768px; sem risco de overflow no tablet.

### Achado de menor severidade, não corrigido nesta rodada

- **`AdminNav`** — a barra lateral do admin só vira "sticky" persistente em `lg:` (1024px); entre 768-1023px (ex.: iPad retrato numa recepção de barbearia) o barbeiro ainda usa o drawer hambúrguer de mobile em vez de uma versão compacta (64px, só ícones) da sidebar, que já existe como estado (`collapsed`) mas hoje só é alcançável manualmente em telas ≥1024px. Não é um bug (nada quebra ou fica inacessível) — é uma oportunidade real de melhoria específica de tablet que ficou de fora por exigir mudança de estado/JS que não pôde ser testada ao vivo (login admin fora do escopo desta sessão). Recomendação futura: tornar `md:` o breakpoint em que a sidebar physical assume o modo compacto por padrão, liberando o hambúrguer só abaixo de `md`.

## 12. Performance visual (§21 do PDF)

Sem Lighthouse disponível nesta sessão (sem binário de Chrome no ambiente de shell, só o browser do harness) — auditoria feita por leitura de código, verificando os pontos concretos que o PDF pede.

### Já corretos, sem ação necessária
- **Fontes** — `next/font/google` (self-hosted, sem requisição a fonts.googleapis.com em runtime, sem FOIT/FOUT, métricas de fallback automáticas). É exatamente o padrão recomendado; nada a mudar.
- **Imagem do hero** — `HeroSection` já usa `priority` no `<Image>` (evita o hero ser tratado como lazy, o que penalizaria o LCP).
- **CLS nas imagens de produto/avatar** — todos os contêineres já reservam o espaço antes da imagem carregar (`aspect-[3/4]` nos cards de produto, `width`/`height` inline no `ClientAvatar` compartilhado) — zero risco de layout shift medido nesses pontos.

### Corrigido
- **`loading="lazy"` ausente em imagens de lista/grade** — `ClientAvatar` (componente compartilhado, usado em ~10 lugares incluindo a tabela de clientes que pode ter dezenas de linhas), grade pública de `/produtos`, grade de produtos do admin (`ProductCard`) e itens do `CartDrawer` carregavam a imagem imediatamente mesmo fora da tela. Adicionado `loading="lazy"` nos 4 pontos — sem risco (atributo nativo do HTML, navegador ignora automaticamente se o elemento já está visível). Imagens únicas acima da dobra (foto do produto individual, avatares em formulários de edição) foram deixadas como estão de propósito — não há ganho em adiar o que já é a primeira coisa visível na tela.

### Recomendação futura (não implementada — decisão de infraestrutura/custo)
`next.config.mjs` tem `images.remotePatterns: []`, o que impede o componente `<Image>` de otimizar (redimensionar, converter para AVIF/WebP, gerar srcset) qualquer imagem hospedada fora do domínio do próprio site — é por isso que avatares e fotos de produto (armazenados no Supabase Storage) usam `<img>` puro em vez de `<Image>` em todo o projeto. Ativar isso traria ganho real de performance (menos bytes transferidos, formato moderno automático), mas cada imagem otimizada passa a consumir uma invocação da função de otimização de imagem da Vercel — uma mudança de custo/infraestrutura que não deve ser feita sem o dono do projeto estar ciente e de acordo.

## 13. Inventário formal de páginas/componentes (§27 do PDF)

Ver `docs/auditoria/03-inventario-rotas.md` — tabela completa com as ~37 rotas do projeto (nome, rota, objetivo, componentes principais, status).

### O que ficou de fora (limitação do ambiente, não de escopo)
Nenhuma das telas alteradas pôde ser clicada até um estado com dados reais nesta sessão: o ambiente local não tem `availability_rules` semeadas (todo dia do calendário aparece "indisponível") e o login administrativo não pôde ser automatizado (fora do escopo de segurança desta sessão). Todo o trabalho foi validado por:
1. `tsc`/`lint`/`build`/`test` a cada commit (sempre verde);
2. as classes CSS novas conferidas caractere a caractere contra as originais que substituíram;
3. verificação ao vivo no browser sempre que a tela era alcançável sem dado semeado (CTA da Nav, drawer mobile, contraste real medido via `getComputedStyle`, lógica de foco/Tab/Escape testada isoladamente com o mesmo algoritmo do hook);
4. a Fase 4 completa do plano original (regressão visual em 375/768/1024/1280/1920px, teste manual do fluxo ponta a ponta) fica pendente de uma sessão com acesso ao ambiente ao vivo ou dados de teste semeados.

### Tabela-resumo final atualizada

| Área | Problema anterior | Melhoria aplicada | Status |
|---|---|---|---|
| Botões | `Button` pronto, não usado; 27 arquivos duplicavam o CTA à mão | Adotado nos 7 pontos de maior repetição; `destructive` recalibrado | ✅ Concluído |
| Contraste WCAG | Nunca auditado formalmente; vários tokens abaixo de AA | Piso de `/55` em 122 arquivos + correção de pares hover colididos | ✅ Concluído |
| Modais do admin | Sem Escape, sem foco preso, sem `role="dialog"` | `useModalA11y` aplicado nos 5 modais | ✅ Concluído |
| Cards de resumo/resultado | Padrão repetido sem componente comum | `DetailCard` + `ResultCard` extraídos e adotados | ✅ Concluído |
| `SlotGrid` sem horário | Retornava `null` silenciosamente | Mensagem interna + `emptySlot` customizável | ✅ Concluído |
| Empty states sem CTA | Pagamentos/Avaliações sem próxima ação | Link "Agendar agora" adicionado | ✅ Concluído |
| Loading só texto | "Carregando…" sem placeholder visual | Skeletons pulsantes com `role="status"` | ✅ Concluído |
| Badge de status duplicado | Mesmo mapa em 2 arquivos | Extraído para `src/lib/orders.ts` | ✅ Concluído |
| Validação em dados reais / breakpoints | — | Bloqueado por falta de dados semeados e login admin nesta sessão | ⏳ Pendente (Fase 4) |
