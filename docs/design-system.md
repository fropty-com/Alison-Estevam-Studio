# Design System — Alison Estevam Studio

> Documenta o sistema de design real já em uso no código (`tailwind.config.ts`, `src/app/globals.css`). Não introduz nada novo — normaliza o que existe para servir de referência única. Item pendente do plano de auditoria (Fase 0-7), fechado nesta atualização.

## Princípio

"Refinamento, não reconstrução." A identidade visual já é consistente na prática (mesmas 4 cores de marca, mesma escala tipográfica e de espaçamento em todo o app). Este documento formaliza o que já é seguido, para que não se perca com o tempo.

**Nunca usar cores fora da paleta abaixo** (nem `#ffffff`/`#000000` diretos) — os únicos brancos/pretos puros no Tailwind config são os tokens `white`/`black`, reservados para casos tecnicamente necessários e documentados (ex.: sombra, overlay).

## Cores

4 cores de marca, nunca preto ou branco puro como fundo/texto principal:

| Token | Hex | Uso |
|---|---|---|
| `bg-charcoal` | `#2E2E2B` (escuro) / `#F1F1F1` (claro) | Fundo principal — inverte por tema via `--c-charcoal` |
| `bg-charcoal-deep` | `#1E1E1C` | Sempre escuro — texto sobre botão dourado, scrim de modal |
| `text-offwhite` | `#F1F1F1` (escuro) / `#2E2E2B` (claro) | Texto principal — inverte por tema |
| `text-gold` / `bg-gold` | `#CBA339` | Acento — CTAs, destaques, mesma cor nos dois temas |
| `text-sage` | olive claro (escuro) / `#4B4D39` (claro) | Texto/acento secundário — inverte por tema |
| `text-olive` | `#4B4D39` | Verde-oliva de marca, fixo |

Cores funcionais fixas (não trocam por tema): `success` `#4A7C59`, `warning` `#C9953A`, `error` `#8B3A3A`.

**Implementação de tema**: variáveis CSS `--c-*` (RGB, formato `R G B` para permitir opacidade via `rgb(var(--c-x) / <alpha-value>)`) definidas em `:root` (escuro, padrão) e sobrescritas em `[data-theme="light"]`, ver [globals.css](../src/app/globals.css). Nunca hardcode uma cor de marca fora dessas variáveis — sempre use as classes Tailwind (`bg-gold/40`, `text-offwhite/60` etc.), que já resolvem a opacidade corretamente.

## Tipografia

3 famílias, cada uma com um papel fixo — não misturar:

| Token | Fonte | Papel |
|---|---|---|
| `font-display` | Cormorant Garamond (serif) | Títulos, números grandes, itálico de destaque |
| `font-body` | Montserrat (sans) | Texto de interface, labels, botões, corpo |
| `font-data` | Lora (serif) | Dados tabulares/numéricos onde uma leitura mais "editorial" é desejada (ex.: telefone na tabela de clientes) |

Escala de tamanho fixa em `tailwind.config.ts` (`2xs` a `7xl`), cada tamanho já com `lineHeight`/`letterSpacing` pareados — nunca declarar esses valores soltos fora da escala. Pesos disponíveis: `light` (300, padrão do corpo), `normal` (400), `medium` (500) — nunca `bold`/`black`.

Labels em uppercase (eyebrows, headers de tabela) usam `2xs`/`xs` com tracking largo (`0.38em`–`0.45em`) — esse é o padrão visual de "rótulo discreto" em todo o admin e no site público.

## Espaçamento

Escala 100% customizada — **os tokens numéricos do Tailwind padrão (`p-4`, `gap-2` etc.) não existem neste projeto**, foram substituídos:

| Token | Valor |
|---|---|
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `5` | 24px |
| `6` | 32px |
| `7` | 48px |
| `8` | 64px |
| `9` | 96px |
| `10` | 120px |
| `11` | 160px |
| `12` | 200px |

Valores fora dessa escala (ex.: `34px`, `[860px]`) aparecem como arbitrary values (`text-[34px]`, `min-w-[860px]`) quando um ajuste fino é necessário — aceitável, mas a escala acima é a primeira opção sempre.

## Bordas e sombras

Sem `border-radius` decorativo — `borderRadius` só define `none` (padrão, cantos retos em toda a UI) e `full` (exclusivo para pills/badges, ex. `VipToggle`). Sem sistema de sombra elaborado — profundidade vem de contraste de opacidade (`border-offwhite/[0.07]`, `bg-offwhite/5`), não de `box-shadow`. Único blur documentado: `backdrop-blur-brand` (18px), usado em overlays/dropdowns sobre conteúdo.

## Breakpoints

| Token | Largura |
|---|---|
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1440px |

`lg` (1024px) é o breakpoint estrutural do admin — é onde a sidebar vira menu hambúrguer e onde componentes largos (ex. `ClientsTable`) trocam de tabela para lista de cards. Ao criar uma tela nova no admin que dependa de bastante largura horizontal, seguir esse mesmo ponto de corte por consistência com o resto do painel.

## Movimento

Easings de marca: `brand-out` (`cubic-bezier(0.16, 1, 0.3, 1)`, saída suave — usado na maioria das transições/entradas) e `brand-circ` (`cubic-bezier(0.4, 0, 0.2, 1)`, usado em troca de tema e transições de cor). Durações padronizadas: `250`/`350`/`450`/`600`ms. Animações nomeadas (`fade-up`, `slide-in-right`, `theme-in`, `pulse-dot`, `scroll-line`, `dot-loading`) cobrem os padrões recorrentes (entrada de seção, drawer lateral, troca de tema, indicadores de status "ao vivo"). Preferir essas animações nomeadas a `transition` ad-hoc ao introduzir um novo componente.

## Ícones

SVG inline hand-rolled, sem biblioteca de ícones (nenhum `lucide-react`/`heroicons`/etc. no projeto). Um ícone novo deve seguir o padrão dos existentes: `viewBox` compacto, `stroke="currentColor"` (herda a cor do texto/tema automaticamente), `strokeWidth` fino (~1.2–1.5), sem preenchimento sólido salvo exceções pontuais (ex. pontos de status).

## Estados de interação

- **Foco**: `outline outline-2 outline-offset-2 outline-gold` via `:focus-visible` (globals.css) — não redefinir foco por componente, o global já cobre.
- **Hover**: convenção de opacidade crescente (`border-offwhite/[0.12]` → `hover:border-offwhite/[0.14]`, texto `/35` → `hover:text-gold/[0.75]`) em vez de trocar a cor base.
- **Disabled**: `disabled:opacity-50` é o padrão em toda a base (ver `VipToggle`, botões de ação).

## O que este documento não cobre (fora do escopo desta consolidação)

Auditoria formal de contraste WCAG, testes em navegadores reais além do Chromium e navegação 100% por teclado — sinalizados como pendentes em [docs/auditoria/02-responsividade-temas.md](auditoria/02-responsividade-temas.md), candidatos a uma fase de acessibilidade dedicada, não a este documento de referência visual.
