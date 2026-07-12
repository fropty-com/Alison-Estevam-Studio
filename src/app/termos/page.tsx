import type { Metadata } from 'next'
import Link from 'next/link'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Termos de Uso — Alison Estevam Studio' }

const h2Cls = 'font-body font-medium text-[10px] tracking-[0.32em] uppercase text-gold mt-10 mb-3'
const pCls  = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65 mb-3'
const liCls = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65'

export default function TermosPage() {
  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
      <div className="max-w-[680px] mx-auto">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-2">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.02em] leading-tight mb-2">
          Termos de Uso
        </h1>
        <p className="font-body font-light text-[11px] text-offwhite/30 tracking-[0.08em] mb-10">
          Última atualização: 12 de julho de 2026
        </p>

        <p className={pCls}>
          Estes termos regem o uso do site e do sistema de agendamento do {BRAND.fullName}
          (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo;), disponível em {BRAND.siteUrl}. Ao criar uma conta, marcar um horário
          ou usar qualquer parte do site, você concorda com o que está descrito aqui.
        </p>

        <h2 className={h2Cls}>1. O que oferecemos</h2>
        <p className={pCls}>
          Um sistema para consultar serviços, agendar horários com o {BRAND.name}, acompanhar,
          reagendar ou cancelar seus agendamentos, e manter um histórico dos atendimentos
          realizados. O acesso à área do cliente é feito por confirmação de código enviado ao
          seu WhatsApp — não usamos senha.
        </p>

        <h2 className={h2Cls}>2. Sua conta</h2>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          <li className={liCls}>Você é responsável por manter o número de WhatsApp cadastrado atualizado e sob seu controle — é por ele que confirmamos sua identidade.</li>
          <li className={liCls}>As informações fornecidas no cadastro (nome, telefone) devem ser verdadeiras.</li>
          <li className={liCls}>Você pode encerrar sua conta a qualquer momento entrando em contato pelo WhatsApp — veja como na nossa <Link href="/privacidade" className="text-gold hover:text-gold-light underline underline-offset-2">Política de Privacidade</Link>.</li>
        </ul>

        <h2 className={h2Cls}>3. Agendamentos</h2>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          <li className={liCls}>Um horário só é confirmado quando você recebe a confirmação — a simples tentativa de marcação não garante a reserva se o horário for preenchido por outra pessoa antes.</li>
          <li className={liCls}>Cancelamentos e reagendamentos podem ser feitos pelo link enviado na confirmação, sujeitos ao prazo mínimo de antecedência informado no momento da marcação.</li>
          <li className={liCls}>Faltas repetidas sem cancelamento prévio podem levar à exigência de confirmação antecipada para futuros agendamentos.</li>
        </ul>

        <h2 className={h2Cls}>4. Pagamento</h2>
        <p className={pCls}>
          Os valores exibidos no momento do agendamento são referência e podem ser ajustados no
          atendimento em caso de serviços ou complementos adicionais solicitados no local. O
          pagamento é realizado presencialmente, na forma combinada com o {BRAND.name}.
        </p>

        <h2 className={h2Cls}>5. Conduta</h2>
        <p className={pCls}>
          Não é permitido usar o sistema para enviar informações falsas, tentar acessar dados de
          outros clientes, ou usar o agendamento de forma abusiva (ex: reservas em massa sem
          intenção de comparecer).
        </p>

        <h2 className={h2Cls}>6. Alterações</h2>
        <p className={pCls}>
          Podemos atualizar estes termos conforme o serviço evolui. Mudanças relevantes serão
          comunicadas na área do cliente ou por WhatsApp, quando você tiver consentido em receber
          mensagens nossas.
        </p>

        <h2 className={h2Cls}>7. Contato</h2>
        <p className={pCls}>
          Dúvidas sobre estes termos podem ser enviadas pelo WhatsApp{' '}
          <a href={`https://wa.me/${BRAND.whatsapp}`} className="text-gold hover:text-gold-light underline underline-offset-2">
            {BRAND.whatsapp}
          </a>.
        </p>

        <p className="font-body font-light text-[10.5px] text-offwhite/25 tracking-[0.05em] mt-12 pt-6 border-t border-offwhite/8">
          Este documento é um modelo de referência gerado para o lançamento do sistema e não substitui
          orientação jurídica. Recomendamos revisão por um advogado antes da divulgação oficial,
          incluindo a inclusão da razão social e CNPJ do negócio.
        </p>
      </div>
    </div>
  )
}
