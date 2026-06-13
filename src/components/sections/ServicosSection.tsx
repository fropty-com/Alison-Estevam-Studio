'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Complemento { label: string }

interface Servico {
  num:           string
  nome:          string
  preco?:        string
  precoLabel?:   string
  desc:          string
  complementos?: Complemento[]
  isVip?:        boolean
  isComingSoon?: boolean
  icon:          React.ReactNode
  vipData?: {
    title:  string
    desc:   string
    quote:  string
    btnUrl: string
  }
}

function ScissorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="6.8" y1="6.2" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.8" y1="11.8" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12.5" y1="3.5" x2="14.5" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function BeardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5C3 5 2 8 2 11C2 14 5 16 9 16C13 16 16 14 16 11C16 8 15 5 15 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 5C6 5 7 8 9 8C11 8 12 5 12 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 3C5 3 5.5 5 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13 3C13 3 12.5 5 12 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ComboIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 9C3 9 2.5 11 2.5 13C2.5 15 4 16.5 7 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 9C7 9 7.5 11.5 9 11.5C10.5 11.5 11 9 11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15 9C15 9 15.5 11 15.5 13C15.5 15 14 16.5 11 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function FemaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="11" x2="9" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="13.5" x2="11.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function DropIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2L13.5 9C13.5 11.5 11.5 14 9 14C6.5 14 4.5 11.5 4.5 9L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="6.5" y1="10" x2="11.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <polygon points="9,2 10.8,7 16,7 11.7,10.3 13.4,15.5 9,12.3 4.6,15.5 6.3,10.3 2,7 7.2,7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const SERVICOS: Servico[] = [
  {
    num: '01', nome: 'Corte de Cabelo', preco: 'R$ 60',
    icon: <ScissorsIcon />,
    desc: 'Corte personalizado no seu estilo. Cada detalhe executado com precisão, do início à finalização.',
    complementos: [{ label: 'Sobrancelha' }, { label: 'Contorno de Barba' }],
  },
  {
    num: '02', nome: 'Barba Completa', preco: 'R$ 60',
    icon: <BeardIcon />,
    desc: 'Modelagem completa com vaporizador de ozônio e produtos selecionados. Um ritual que cuida da pele e valoriza o visual.',
    complementos: [{ label: 'Acabamento do Cabelo' }, { label: 'Sobrancelha' }],
  },
  {
    num: '03', nome: 'Cabelo & Barba', preco: 'R$ 100',
    icon: <ComboIcon />,
    desc: 'A experiência completa em um único atendimento. Corte e barba com toda a atenção que você merece.',
    complementos: [{ label: 'Sobrancelha' }],
  },
  {
    num: '04', nome: 'Corte Feminino', preco: 'R$ 100',
    icon: <FemaleIcon />,
    desc: 'Especialidade em Pixie Cut — um corte que exige técnica, sensibilidade e olhar para o que valoriza cada rosto.',
  },
  {
    num: '05', nome: 'Tratamento Capilar',
    precoLabel: 'Em breve', isComingSoon: true,
    icon: <DropIcon />,
    desc: 'Um lavatório dedicado para cuidar do seu cabelo com a atenção que ele merece.',
  },
  {
    num: '06', nome: 'Horário VIP',
    precoLabel: 'Exclusivo', isVip: true,
    icon: <StarIcon />,
    desc: 'Atendimento fora do expediente — para quem valoriza privacidade, exclusividade e flexibilidade de horário.',
    vipData: {
      title: 'VIP',
      desc:  'Atendimento fora do expediente — para quem valoriza privacidade, exclusividade e flexibilidade de horário. Agendado diretamente comigo.',
      quote: '"O tempo que você dedica a si mesmo diz muito sobre quem você é."',
      btnUrl: `https://wa.me/5511975369904?text=${encodeURIComponent('Olá Alison, gostaria de agendar um Horário VIP.')}`,
    },
  },
]

function openBooking() {
  window.dispatchEvent(new Event('open-booking'))
}

export function ServicosSection() {
  const [active, setActive] = useState<number | null>(null)
  const activeServico = active !== null ? SERVICOS[active] : null

  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="section-tag" aria-hidden="true">Serviços</div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-[60px] md:gap-[80px] items-start">

        {/* Left — title + service list */}
        <div>
          <h2
            id="servicos-titulo"
            className="reveal font-display font-light text-5xl text-offwhite leading-[1.05] mb-[48px] text-balance"
          >
            O que ofereço
          </h2>

          <div role="list" className="divide-y divide-offwhite/8">
            {SERVICOS.map((s, i) => (
              <button
                key={s.num}
                onClick={() => setActive(prev => prev === i ? null : i)}
                aria-expanded={active === i}
                aria-controls={`servico-detail-${s.num}`}
                className={cn(
                  'w-full text-left py-[22px] flex items-center gap-4',
                  'group transition-all duration-250',
                  'reveal', i > 0 && `reveal-d${Math.min(i, 4)}`,
                )}
              >
                {/* Icon */}
                <span
                  className={cn(
                    'w-9 h-9 flex items-center justify-center shrink-0',
                    'border transition-all duration-300',
                    active === i
                      ? 'border-sage bg-sage/10 text-sage'
                      : 'border-offwhite/12 text-offwhite/40 group-hover:border-sage/40 group-hover:text-sage'
                  )}
                >
                  {s.icon}
                </span>

                {/* Name */}
                <span
                  className={cn(
                    'flex-1 font-display font-light text-[clamp(18px,2vw,26px)] tracking-[0.02em]',
                    'transition-colors duration-250',
                    active === i ? 'text-offwhite' : 'text-offwhite/60 group-hover:text-offwhite/85'
                  )}
                >
                  {s.nome}
                </span>

                {/* Price */}
                <span
                  className={cn(
                    'shrink-0 transition-colors duration-250',
                    s.preco
                      ? 'font-display font-normal text-xl tracking-[0.02em]'
                      : 'font-body font-light text-sm tracking-[0.1em]',
                    active === i ? 'text-gold' : 'text-gold/45'
                  )}
                >
                  {s.preco ?? s.precoLabel}
                </span>

                {/* Arrow */}
                <span
                  className={cn(
                    'text-offwhite/25 transition-all duration-300 shrink-0 ml-1 text-base',
                    active === i ? 'rotate-180 text-sage' : 'group-hover:text-offwhite/45'
                  )}
                  aria-hidden="true"
                >
                  ↓
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — detail panel */}
        <div className="md:sticky md:top-[100px]">
          {activeServico === null ? (
            /* Default state */
            <div className="border border-offwhite/8 p-[40px] flex flex-col justify-between min-h-[280px]">
              <div>
                <p className="font-body font-light text-xs tracking-[0.4em] uppercase text-offwhite/45 mb-5">
                  Selecione um serviço
                </p>
                <p className="font-display font-light italic text-2xl text-offwhite/55 leading-[1.45]">
                  &ldquo;Cada detalhe importa. Escolha o serviço para conhecer mais.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <span className="block w-5 h-px bg-gold/35" aria-hidden="true" />
                <span className="font-body font-light text-xs tracking-[0.3em] uppercase text-offwhite/40">
                  Alison Estevam Studio
                </span>
              </div>
            </div>
          ) : activeServico.isVip && activeServico.vipData ? (
            /* VIP panel */
            <div
              id={`servico-detail-${activeServico.num}`}
              className={cn(
                'relative overflow-hidden',
                'bg-gradient-to-br from-charcoal-deep to-charcoal-mid',
                'border border-gold/14 p-[40px] min-h-[280px]'
              )}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 65% 75% at 22% 50%, rgba(201,169,110,0.07) 0%, transparent 62%)' }}
                aria-hidden="true"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 right-[-4%] font-display font-light leading-none pointer-events-none select-none"
                style={{ fontSize: 'clamp(80px,12vw,140px)', color: 'transparent', WebkitTextStroke: '1px rgba(201,169,110,0.05)', letterSpacing: '0.05em' }}
                aria-hidden="true"
              >
                VIP
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-5 h-px bg-gold/45" aria-hidden="true" />
                  <span className="font-body font-light text-2xs tracking-[0.5em] uppercase text-offwhite/38">Exclusivo</span>
                </div>
                <div
                  className="font-display font-medium text-gold leading-none mb-5 tracking-[0.12em]"
                  style={{ fontSize: 'clamp(44px,5vw,64px)' }}
                >
                  VIP
                </div>
                <p className="font-body font-light text-base leading-[2] text-offwhite/60 max-w-[360px] mb-3">
                  {activeServico.vipData.desc}
                </p>
                <p className="font-display font-light italic text-lg text-offwhite/35 leading-[1.6] max-w-[340px] mb-8">
                  {activeServico.vipData.quote}
                </p>
                <a
                  href={activeServico.vipData.btnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 font-body font-light text-2xs tracking-[0.38em] uppercase text-charcoal-deep bg-gold px-6 py-[12px] transition-all duration-300 hover:bg-gold-light hover:-translate-y-px"
                >
                  Solicitar via WhatsApp
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          ) : (
            /* Regular service panel */
            <div
              id={`servico-detail-${activeServico.num}`}
              className="border border-offwhite/10 p-[40px] min-h-[280px] flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 flex items-center justify-center border border-sage/30 text-sage bg-sage/8 shrink-0">
                  {activeServico.icon}
                </span>
                <div>
                  <p className="font-body font-light text-2xs tracking-[0.45em] uppercase text-offwhite/35 mb-1">
                    {activeServico.num}
                  </p>
                  <h3 className="font-display font-light text-3xl text-offwhite tracking-[0.02em]">
                    {activeServico.nome}
                  </h3>
                </div>
              </div>

              {/* Price */}
              {activeServico.preco && (
                <div className="flex items-center gap-3">
                  <span className="font-display font-normal text-4xl text-gold tracking-[0.02em]">
                    {activeServico.preco}
                  </span>
                  <span className="font-body font-light text-xs tracking-[0.2em] text-offwhite/30 uppercase">
                    por sessão
                  </span>
                </div>
              )}
              {activeServico.isComingSoon && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-pulse-dot" aria-hidden="true" />
                  <span className="font-body font-light text-xs tracking-[0.3em] uppercase text-offwhite/35">Em breve</span>
                </div>
              )}

              {/* Divider */}
              <div className="w-8 h-px bg-gold/28" aria-hidden="true" />

              {/* Description */}
              <p className="font-body font-light text-base leading-[2] text-offwhite/60">
                {activeServico.desc}
              </p>

              {/* Complementos */}
              {activeServico.complementos && activeServico.complementos.length > 0 && (
                <div>
                  <p className="font-body font-light text-xs tracking-[0.38em] uppercase text-sage mb-3">
                    Complementos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeServico.complementos.map(c => (
                      <span
                        key={c.label}
                        className="font-body font-light text-sm tracking-[0.1em] text-offwhite/55 border border-offwhite/12 px-3 py-[5px] transition-colors duration-250 hover:border-gold hover:text-gold"
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {!activeServico.isComingSoon && (
                <button
                  onClick={openBooking}
                  className="group inline-flex items-center gap-3 mt-auto font-body font-light text-2xs tracking-[0.38em] uppercase text-charcoal-deep bg-gold px-6 py-[12px] w-fit transition-all duration-300 hover:bg-gold-light hover:-translate-y-px"
                >
                  Agendar este serviço
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
