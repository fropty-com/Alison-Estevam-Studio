'use client'

import { cn } from '@/lib/utils'

function openBooking() {
  window.dispatchEvent(new Event('open-booking'))
}

function ScissorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="6.8" y1="6.2" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.8" y1="11.8" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function BeardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5C3 5 2 8 2 11C2 14 5 16 9 16C13 16 16 14 16 11C16 8 15 5 15 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 5C6 5 7 8 9 8C11 8 12 5 12 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function ComboIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="11" x2="9" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="13.5" x2="11.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function DropIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2L13.5 9C13.5 11.5 11.5 14 9 14C6.5 14 4.5 11.5 4.5 9L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <polygon points="9,2 10.8,7 16,7 11.7,10.3 13.4,15.5 9,12.3 4.6,15.5 6.3,10.3 2,7 7.2,7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const SERVICOS = [
  {
    num: '01', nome: 'Corte de Cabelo', preco: 'R$ 60', icon: <ScissorsIcon />,
    desc: 'Corte personalizado com técnica de tesoura. Cada detalhe executado com precisão, do início à finalização.',
    tags: ['Sobrancelha', 'Contorno de Barba'],
  },
  {
    num: '02', nome: 'Barba Completa', preco: 'R$ 60', icon: <BeardIcon />,
    desc: 'Modelagem completa com vaporizador de ozônio e produtos selecionados para cuidar da pele e valorizar o visual.',
    tags: ['Acabamento', 'Sobrancelha'],
  },
  {
    num: '03', nome: 'Cabelo & Barba', preco: 'R$ 100', icon: <ComboIcon />,
    desc: 'A experiência completa em um único atendimento. Corte e barba com toda a atenção que você merece.',
    tags: ['Sobrancelha'],
  },
  {
    num: '04', nome: 'Corte Feminino', preco: 'R$ 100', icon: <FemaleIcon />,
    desc: 'Especialidade em Pixie Cut — um corte que exige técnica, sensibilidade e olhar atento para cada rosto.',
    tags: [],
  },
  {
    num: '05', nome: 'Tratamento Capilar', preco: null, badge: 'Em breve', icon: <DropIcon />,
    desc: 'Um lavatório dedicado para cuidar do seu cabelo com a atenção e os produtos que ele merece.',
    tags: [],
  },
  {
    num: '06', nome: 'Horário VIP', preco: null, badge: 'Exclusivo', icon: <StarIcon />,
    desc: 'Atendimento fora do expediente — para quem valoriza privacidade, exclusividade e flexibilidade total de horário.',
    tags: [],
    isVip: true,
    vipUrl: `https://wa.me/5511975369904?text=${encodeURIComponent('Olá Alison, gostaria de agendar um Horário VIP.')}`,
  },
] as const

export function ServicosSection() {
  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      className="bg-charcoal section-wrap"
    >
      {/* Header */}
      <div className="text-center mb-[64px]">
        <div className="section-tag justify-center" aria-hidden="true">O que ofereço</div>
        <h2
          id="servicos-titulo"
          className="reveal font-display font-normal text-[clamp(38px,5vw,60px)] text-offwhite tracking-[0.04em] uppercase"
        >
          Serviços & Preços
        </h2>
      </div>

      {/* Card grid — separated by hairline borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-offwhite/8">
        {SERVICOS.map((s, i) => (
          <div
            key={s.num}
            className={cn(
              'border-b border-r border-offwhite/8',
              'p-[36px] flex flex-col gap-5',
              'reveal', i > 0 && `reveal-d${Math.min(i, 4)}`,
              'group transition-colors duration-300',
              ('isVip' in s && s.isVip)
                ? 'bg-gold/[0.04] border-gold/20 hover:bg-gold/[0.07]'
                : 'hover:bg-offwhite/[0.03]'
            )}
          >
            {/* Icon + Number */}
            <div className="flex items-start justify-between">
              <span className="w-10 h-10 flex items-center justify-center border border-offwhite/12 text-offwhite/45 group-hover:border-gold/40 group-hover:text-gold transition-all duration-300">
                {s.icon}
              </span>
              <span className="font-data text-xs text-offwhite/20 tracking-[0.2em]">{s.num}</span>
            </div>

            {/* Name */}
            <h3 className="font-display font-normal text-2xl text-offwhite tracking-[0.03em]">
              {s.nome}
            </h3>

            {/* Price */}
            {s.preco ? (
              <div className="flex items-baseline gap-2">
                <span className="font-data font-normal text-3xl text-gold">{s.preco}</span>
                <span className="font-body font-light text-xs tracking-[0.18em] text-offwhite/30 uppercase">por sessão</span>
              </div>
            ) : (
              <span className={cn(
                'self-start font-body font-light text-xs tracking-[0.3em] uppercase px-3 py-[5px] border',
                ('isVip' in s && s.isVip)
                  ? 'text-gold/80 border-gold/30 bg-gold/6'
                  : 'text-offwhite/40 border-offwhite/16'
              )}>
                {s.badge}
              </span>
            )}

            {/* Divider */}
            <div className="w-6 h-px bg-gold/30" aria-hidden="true" />

            {/* Description */}
            <p className="font-body font-light text-sm leading-[1.9] text-offwhite/50 flex-1">
              {s.desc}
            </p>

            {/* Tags */}
            {s.tags && s.tags.length > 0 && (
              <div className="flex flex-wrap gap-[6px]">
                <span className="font-body font-light text-2xs tracking-[0.2em] uppercase text-sage/70 mr-1">+</span>
                {s.tags.map(t => (
                  <span key={t} className="font-body font-light text-2xs tracking-[0.15em] text-offwhite/30">{t}</span>
                ))}
              </div>
            )}

            {/* VIP CTA */}
            {'isVip' in s && s.isVip && (
              <a
                href={'vipUrl' in s ? s.vipUrl : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center justify-center gap-2 mt-1 px-5 py-[10px] border border-gold/40 bg-gold/10 font-body font-light text-2xs tracking-[0.3em] uppercase text-gold hover:bg-gold/20 hover:border-gold/70 transition-all duration-200"
              >
                Solicitar via WhatsApp
                <span className="transition-transform duration-200 group-hover/btn:translate-x-1" aria-hidden="true">→</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 flex flex-col items-center gap-3 px-6">
        <div className="w-px h-[40px] bg-gradient-to-b from-gold/40 to-transparent" aria-hidden="true" />
        <button
          onClick={openBooking}
          className={cn(
            'inline-flex items-center justify-center gap-4',
            'font-body font-light text-2xs tracking-[0.45em] uppercase',
            'text-charcoal-deep bg-gold',
            'w-full max-w-[320px] py-[16px]',
            'relative overflow-hidden',
            'transition-all duration-300 hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(201,169,110,0.32)]',
            'active:translate-y-0'
          )}
        >
          <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" aria-hidden="true" />
          Agendar seu horário →
        </button>
      </div>
    </section>
  )
}
