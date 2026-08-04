import type { Metadata } from 'next'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Sobre o sistema — Alison Estevam Studio' }

const h2Cls = 'font-body font-medium text-[10px] tracking-[0.32em] uppercase text-gold mt-10 mb-3'
const pCls  = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65 mb-3'

export default function SobrePage() {
  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[95px]">
      <div className="max-w-[680px] mx-auto">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-2">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.02em] leading-tight mb-2">
          Sobre o sistema
        </h1>

        <p className={pCls}>
          Este é o sistema de agendamento e gestão do {BRAND.fullName}: um site público para
          clientes marcarem horário, e um painel administrativo para o {BRAND.name} e sua equipe
          gerenciarem agenda, clientes, serviços, financeiro e relatórios do dia a dia.
        </p>

        <h2 className={h2Cls}>O que o painel administrativo cobre</h2>
        <p className={pCls}>
          Agenda com check-in/checkout, fila de espera, cadastro de clientes com histórico e
          fidelidade, catálogo de serviços, faturamento e financeiro com DRE, relatórios
          exportáveis, e configurações de horários, taxas de pagamento, cupons e equipe.
        </p>

        <h2 className={h2Cls}>Suporte</h2>
        <p className={pCls}>
          Em caso de dúvidas sobre o funcionamento do painel, fale com quem administra sua conta
          em Configurações → Equipe.
        </p>
      </div>
    </div>
  )
}
