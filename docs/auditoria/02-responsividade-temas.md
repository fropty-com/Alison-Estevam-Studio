# 02 — Responsividade e Temas (Fase 5)

> Gerado em 2026-07-30. Auditoria técnica via navegador automatizado (mobile 375×812, tablet 768×1024, desktop 1280–1920px), sem acesso a captura de tela nesta sessão — verificação feita por inspeção de DOM/overflow/CSS computado em vez de comparação visual pixel a pixel. Login administrativo temporário criado e removido só para esta auditoria.

## Método

Para cada tela, verificado nos 3 breakpoints:
- Overflow horizontal da página (`document.body.scrollWidth` vs viewport) — nenhuma tela pode forçar scroll horizontal do documento inteiro.
- Elementos que ultrapassam a viewport fora de um contêiner com `overflow-x` controlado (para diferenciar "estoura a página" de "scroll horizontal contido e intencional", como faixas de botões de ação).
- Conteúdo textual renderiza corretamente (via leitura de DOM/texto, não captura visual).

## Resultado por tela

| Tela | Mobile | Tablet | Desktop | Observação |
|---|---|---|---|---|
| Home (`/`) | ✅ | — | — | Sem overflow |
| Agendar (`/agendar`) | ✅ | ✅ | ✅ | Assistente completo testado nos 3 tamanhos |
| Entrar (`/entrar`) | ✅ | — | — | Sem overflow |
| Admin — Dashboard | ✅ | — | ✅ | Sidebar vira menu hambúrguer abaixo de `lg` (1024px) |
| Admin — Agenda | ✅ | — | — | Faixa de ações (Bloquear/+Agendar/Folga) usa scroll horizontal contido no mobile — padrão aceitável, não estoura a página |
| Admin — **Clientes** | ❌ → ✅ **corrigido** | ✅ | ✅ | Ver achado abaixo |
| Admin — Financeiro | ✅ | — | — | Já em cards, sem tabela larga |
| Admin — Faturamento | ✅ | — | — | Sem tabela larga |
| Admin — Serviços | ✅ | — | — | Sem overflow |
| Admin — Configurações | ✅ | — | — | Sem overflow |
| Admin — Atividade | ✅ | — | — | Sem overflow |

## Achado corrigido

**`ClientsTable` dependia só de scroll horizontal no mobile.** A tabela de clientes (`min-w-[860px]`) era a única tela do admin que violava a recomendação dos documentos de auditoria ("não depender de uma tabela larga com scroll horizontal como única solução"). Em telas abaixo de `lg` (1024px) — que é exatamente onde a barra lateral também vira menu — a tabela renderizava 860px+ de largura dentro de um contêiner com scroll, exigindo arrastar horizontalmente para ver telefone, e-mail, data de nascimento e o botão de editar.

Corrigido em [ClientsTable.tsx](../../src/components/admin/ClientsTable.tsx): abaixo de `lg`, a tabela dá lugar a uma lista de cards (nome, WhatsApp e toggle VIP na linha principal; e-mail, nascimento e "cliente desde" numa segunda linha), cada card tocável para abrir o mesmo drawer de detalhe. Acima de `lg`, a tabela original continua igual. Testado nos 3 breakpoints após a correção — sem overflow, drawer abre corretamente a partir do card.

## Limitação desta sessão

Não foi possível confirmar visualmente a troca entre tema claro/escuro nem cores exatas — a captura de tela do navegador não estava disponível nesta sessão de trabalho (erro "Browser pane is not displayed"). Um teste via CSS computado (`getComputedStyle`) produziu um resultado inconsistente especificamente para `background-color` calculado a partir de `rgb(var(--x) / var(--y))` após trocar `data-theme`, enquanto a variável CSS subjacente e `color-scheme` mudavam corretamente — isso tem cara de particularidade do navegador automatizado (Chromium headless) com a sintaxe de cor relativa, não de um bug real: esse exato padrão de token já foi usado e validado visualmente com sucesso em fases anteriores desta mesma sessão de trabalho (tarefa "Fase 1: testar no preview mobile+desktop, claro+escuro", já concluída). Mesmo assim, como não pude confirmar com os próprios olhos desta vez, recomendo um teste manual rápido do botão de tema (ícone sol/lua no topo) em `/agendar` e em qualquer tela do admin antes de considerar este item 100% fechado.

## Não coberto nesta fase

- Auditoria de contraste WCAG formal (checagem automatizada de cor vs. fundo).
- Teste em navegadores reais além do Chromium (Safari, Firefox).
- Teste com leitor de tela / navegação 100% por teclado.

Esses itens exigem ferramentas (axe, Lighthouse, dispositivos reais) fora do escopo desta sessão — candidatos a uma fase futura de acessibilidade dedicada.
