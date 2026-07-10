# Reconstrução visual e funcional — Alison Estevam Studio

## Fonte de verdade

O conteúdo detalhado (cores, tipografia, copy exata de cada seção, regras de agendamento, checklist de 25 itens) já está especificado em:

- `referencias/PORTAL ALISON ESTEVAM.md`
- `referencias/Regras..md`
- `referencias/*.jpeg` (13 mockups, tema claro e escuro de cada seção)

Este documento não duplica esse conteúdo — registra apenas as decisões de escopo, sequenciamento e tratamento de imagem que não estavam no prompt original, para orientar a implementação.

## Contexto técnico já resolvido

Antes desta reconstrução visual, uma auditoria técnica completa foi feita (GitHub/Vercel/Supabase) e o backend do fluxo de agendamento já foi reconstruído: schema de complementos, grants/RLS corrigidos, `/api/services`, `/api/complements`, `/api/availability` (com filtro por duração), `/api/appointments` (cálculo de preço total), `BookingModal.tsx` reestruturado (serviço → complementos → data/hora → dados → confirmação). Essa parte não é re-trabalhada aqui — a reconstrução visual deve **consumir** essas APIs em vez de duplicar dados em arrays hardcoded.

## Abordagem

Adaptar os componentes existentes (não reescrever do zero) para a nova paleta, tipografia e estrutura de seções, preservando a infraestrutura que já funciona: tema claro/escuro via `data-theme`, animações `reveal`, semântica/acessibilidade, `cn()`, `BRAND` config.

## Decisões de imagem

- **Hero** (foto vertical de barbearia P&B) e **Portfólio** (grid de 9 cortes masculinos): gerar com IA, estilo editorial preto e branco.
- **Sobre** (retrato do Alison): reaproveitar `public/images/alison1.png`, que é a foto real do dono do negócio — não gerar rosto sintético para representar uma pessoa real.

## Fases (com checkpoint visual a cada uma)

1. **Fundação + Hero** — paleta (`#F1F1F1`/`#2E2E2B`/`#4B4D39`/`#CBA339`), troca de fonte de corpo (Jost → Montserrat, mantendo Cormorant Garamond), nova imagem de hero, `HeroSection` + `Nav` reconstruídos (logo sobrepondo imagem, topbar fina, versões mobile/desktop distintas).
2. **Sobre + Portfólio** — `SobreSection` sem stats (removidas, não fazem parte do novo mockup), assinatura visual; `GaleriaSection` vira grid vertical sem carrossel; remoção de `ExperienciaSection` (fora da nova estrutura de 8 seções). Novas imagens de portfólio geradas.
3. **Serviços + Cuidados** — `ServicosSection` em lista vertical conectada a `/api/services` (não mais hardcoded); nova `CuidadosSection` conectada a `/api/complements`; Horário Exclusivo abre WhatsApp direto via `buildExclusiveRequestUrl`.
4. **Avaliações + Contato/Footer + menu mobile + polish** — cards de depoimento com inversão de fundo por tema; footer/contato reestruturados por breakpoint; menu mobile com labels atualizados; revisão final do checklist de 25 itens (contraste, SEO, acessibilidade, responsividade).

## Fora de escopo aqui

- Mudanças de schema/API do agendamento (já feitas).
- Painel admin (`/admin/*`) — não mencionado nos prompts de reconstrução visual.
