# Redesign do /admin/agenda estilo Microsoft Outlook

## Contexto

Primeira de 4 frentes pedidas para o admin (as outras três — clientes/editar, sidebar retrátil do app, topo com perfil/notificações — ficam para depois). O usuário anexou 8 capturas reais do Outlook Web/Desktop (`referencias/WhatsApp Image 2026-07-17 at *.jpeg`), cobrindo as views Dia, Semana Útil, Semana e Mês, em temas claro e escuro, e pediu fidelidade completa ao design e mecânica de referência.

A agenda já tem, das Fases A/B/C desta sessão: grid de horas proporcional com sobreposição em colunas (`DayGrid.tsx`, `dayGridLayout.ts`), criação manual de agendamento, marcar folga, bloquear faixa de horário, e um painel de detalhes ao clicar num agendamento. Nada disso muda de mecânica — esta fase é puramente visual/estrutural.

## Decisões de escopo (via perguntas de esclarecimento)

- **Sem árvore de "Meus Calendários"**: a sidebar da agenda replica só o mini-calendário de navegação do Outlook (2 meses, hoje destacado, clique navega a data). Sem a lista de calendários/salas/equipe, que não tem equivalente num negócio de barbeiro único.
- **4 views com dropdown**: adiciona Semana Útil (só dias com expediente) às 3 views existentes (Dia, Semana, Mês), com o seletor virando um dropdown estilo Outlook (ícone + nome + seta) no canto superior direito, no lugar das abas fixas atuais.
- **Mecânica 100% preservada**: todos os botões e interações já construídos (Novo agendamento, Marcar folga, Bloquear horário, painel de detalhes, sobreposição em colunas) continuam idênticos — só o visual (chrome, cores, tipografia, espaçamento) muda para parecer o Outlook.
- **Cores por status, não por calendário**: mantém o mapeamento de cor por status do agendamento (pendente/confirmado/check-in/concluído/cancelado) já existente, só ajustando a paleta para o tom dourado/mostarda visto na referência.
- **Sem rolagem interna nem abas de "compromisso anterior/próximo"**: a grade continua mostrando o expediente inteiro do dia de uma vez (como hoje), sem o mecanismo de viewport parcial + rolagem do Outlook — desnecessário dado que o expediente da barbearia é curto.
- **Tema claro/escuro**: o admin ganha o `<ThemeToggle />` (componente já existente e usado no site público) na barra superior da agenda, permitindo alternar e validar os dois temas da referência. A redesign completa do topo do admin (logo, perfil, notificações) fica para uma fase futura — aqui só entra o toggle isolado, peça mínima necessária para este escopo.

## Estrutura da página

### Sidebar de navegação (só nas views Dia/Semana Útil/Semana)
Novo componente `AgendaMiniCalendar` — dois meses visíveis (mês atual + próximo), navegação por mês, dia de hoje destacado com um estilo, dia selecionado com outro, clique em qualquer dia navega a view atual para aquela data (via `router.push` preservando a view corrente). Não aparece na view Mês, que ocupa a largura toda como no Outlook.

### Barra superior
Reaproveita a estrutura atual (Hoje / ‹ › / título da data / botões de ação), mas o seletor de view (`Dia`/`Semana Útil`/`Semana`/`Mês`) vira um dropdown com ícone de calendário, substituindo as abas fixas do `ViewSwitcher` atual. O `<ThemeToggle />` entra ao lado dos botões existentes.

### Grade de horas (Dia/Semana Útil/Semana)
- Régua de horas passa a marcar meia em meia hora (`10:00`, `10:30`...), com linha pontilhada na meia hora e linha sólida na hora cheia.
- Linha indicadora de "agora" (cor de destaque + bolinha), atravessando a grade na altura correspondente ao horário atual — só renderizada quando a data visível é hoje. Atualiza a cada minuto via `setInterval` no client.
- Blocos de agendamento ganham borda esquerda mais grossa na cor do status e leve textura hachurada no fundo (`repeating-linear-gradient`, mesmo padrão já usado no bloqueio de horário da Fase C), no lugar do preenchimento sólido atual.
- Semana Útil: colunas só para os dias com `availability_rules` ativa. Semana: 7 colunas, dias sem expediente com fundo levemente diferenciado.
- Cabeçalho de cada coluna (dia da semana + número), dia atual destacado.

### Mês
Cada célula lista os agendamentos do dia em linha compacta (`10:00 Marcos Silva`), no lugar do formato atual de bolinha colorida + nome. Dia de hoje destacado, dias fora do mês esmaecidos (comportamento já existente, mantido).

### Clique em agendamento
Sem mudança — mesmo `AppointmentDetailSheet` já existente da Fase B.

## Responsividade

O visual de referência é puramente desktop (sidebar fixa, várias colunas lado a lado) e não cabe direto numa tela estreita. A página já tem precedente móvel desta sessão (grid de Dia com swipe entre dias, painel de detalhes que vira folha inferior no mobile em vez de painel lateral) — a mesma filosofia se aplica aqui: **mesma estética em qualquer largura, layout que se adapta**, não uma versão "simplificada" à parte.

- **Mini-calendário**: no desktop fica fixo como sidebar; abaixo do breakpoint mobile vira um botão compacto (mês/ano + ícone) que abre o mini-calendário num popover/drawer por cima do conteúdo, fechando ao selecionar um dia.
- **Semana Útil / Semana**: no desktop mostra todas as colunas lado a lado; no mobile, colunas com scroll horizontal (mantendo a régua de horas fixa à esquerda, como um "freeze pane"), permitindo ver uma ou duas colunas por vez e arrastar para o lado — sem esconder nenhuma view do seletor.
- **Dia e Mês**: já funcionam bem em largura estreita hoje (grid de Dia já é mobile-first desde a Fase B; Mês já é uma grade 7 colunas compacta) — só recebem os ajustes visuais das seções acima (régua de meia hora, blocos com borda/hachura, linha de "agora", linha compacta nas células do Mês).
- **Dropdown de view e barra superior**: já compactos por natureza, sem tratamento especial além de quebra de linha/espaçamento em telas estreitas.

## Temas

`<ThemeToggle />` já aplica `data-theme="light"` no `<html>` via localStorage, e as variáveis de cor (`--c-charcoal`, `--c-offwhite`, `--c-gold` etc.) já têm contraparte clara definida globalmente em `globals.css`. Como os componentes do admin já usam essas mesmas classes utilitárias, a expectativa é que a maior parte responda automaticamente ao toggle — qualquer ajuste fino de contraste específico da agenda (ex.: o hachurado de fundo dos blocos, a cor da linha de "agora") é feito durante a implementação, comparando lado a lado com as capturas de referência nos dois temas.

## Testes

Sem testes automatizados novos além dos já existentes (`dayGridLayout.test.ts` continua cobrindo o algoritmo de sobreposição, que não muda). Validação manual no browser, seguindo o padrão das fases anteriores: visão Dia/Semana Útil/Semana/Mês nos dois temas, clique em dias do mini-calendário, dropdown de view, clique em agendamento abrindo o painel de detalhes, confirmação de que Novo agendamento/Marcar folga/Bloquear horário continuam funcionando sem alteração de comportamento, e teste em viewport mobile (popover do mini-calendário, scroll horizontal das views de semana, grid de Dia e Mês) nos dois temas.
