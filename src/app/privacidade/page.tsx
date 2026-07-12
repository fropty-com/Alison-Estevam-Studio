import type { Metadata } from 'next'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Política de Privacidade — Alison Estevam Studio' }

const h2Cls = 'font-body font-medium text-[10px] tracking-[0.32em] uppercase text-gold mt-10 mb-3'
const pCls  = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65 mb-3'
const liCls = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65'

export default function PrivacidadePage() {
  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
      <div className="max-w-[680px] mx-auto">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-2">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.02em] leading-tight mb-2">
          Política de Privacidade
        </h1>
        <p className="font-body font-light text-[11px] text-offwhite/30 tracking-[0.08em] mb-10">
          Última atualização: 12 de julho de 2026
        </p>

        <p className={pCls}>
          Esta política explica quais dados o {BRAND.fullName} coleta quando você agenda um
          horário ou usa a área do cliente, para quê usamos, por quanto tempo guardamos, e como
          você pode acessar, corrigir ou apagar suas informações — direitos garantidos pela Lei
          Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>

        <h2 className={h2Cls}>1. Dados que coletamos</h2>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          <li className={liCls}><b className="text-offwhite/85 font-normal">Identificação:</b> nome e número de WhatsApp — obrigatórios para agendar e para confirmar sua identidade na área do cliente.</li>
          <li className={liCls}><b className="text-offwhite/85 font-normal">E-mail:</b> opcional, usado apenas para enviar confirmação do agendamento quando informado.</li>
          <li className={liCls}><b className="text-offwhite/85 font-normal">Histórico de atendimento:</b> serviços agendados, datas, valores e a forma de pagamento utilizada (dinheiro, Pix, débito, crédito ou cortesia) — nunca o número do seu cartão, que não passa pelo nosso sistema.</li>
          <li className={liCls}><b className="text-offwhite/85 font-normal">Anotações internas:</b> observações que o profissional registra sobre o atendimento, visíveis apenas para a administração do negócio.</li>
          <li className={liCls}><b className="text-offwhite/85 font-normal">Consentimentos:</b> se você aceitou receber mensagens de WhatsApp e se aceitou estes termos, com a data em que isso aconteceu.</li>
        </ul>

        <h2 className={h2Cls}>2. Por que coletamos</h2>
        <p className={pCls}>
          Usamos seus dados exclusivamente para: viabilizar o agendamento e o atendimento,
          confirmar sua identidade ao entrar na área do cliente, manter seu histórico para
          facilitar futuros agendamentos, e — apenas se você autorizar — enviar confirmações e
          lembretes por WhatsApp. Não vendemos, alugamos nem compartilhamos seus dados com
          terceiros para fins de marketing.
        </p>

        <h2 className={h2Cls}>3. Com quem compartilhamos</h2>
        <p className={pCls}>
          Seus dados ficam armazenados em infraestrutura de banco de dados (Supabase) e hospedagem
          (Vercel), provedores que atuam como operadores de dados sob contrato, seguindo padrões de
          segurança de mercado. Não compartilhamos seus dados com nenhum outro terceiro fora do que
          for estritamente necessário para o funcionamento do site.
        </p>

        <h2 className={h2Cls}>4. Por quanto tempo guardamos</h2>
        <p className={pCls}>
          Mantemos seus dados enquanto sua conta existir. Se você pedir a exclusão, apagamos seus
          dados de identificação em até 30 dias, exceto informações que sejamos legalmente
          obrigados a manter (como registros fiscais de pagamentos já realizados).
        </p>

        <h2 className={h2Cls}>5. Seus direitos</h2>
        <p className={pCls}>Sob a LGPD, você pode a qualquer momento solicitar:</p>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          <li className={liCls}>Confirmação de que tratamos seus dados, e acesso a eles.</li>
          <li className={liCls}>Correção de dados incompletos, incorretos ou desatualizados.</li>
          <li className={liCls}>Exclusão dos seus dados pessoais.</li>
          <li className={liCls}>Revogação do consentimento para receber mensagens de WhatsApp, a qualquer momento.</li>
        </ul>
        <p className={pCls}>
          Para exercer qualquer um desses direitos, entre em contato pelo WhatsApp{' '}
          <a href={`https://wa.me/${BRAND.whatsapp}`} className="text-gold hover:text-gold-light underline underline-offset-2">
            {BRAND.whatsapp}
          </a>{' '}
          informando seu nome e o pedido — respondemos em até 15 dias.
        </p>

        <h2 className={h2Cls}>6. Segurança</h2>
        <p className={pCls}>
          O acesso à área do cliente é feito por código de verificação enviado ao seu WhatsApp, sem
          senha para memorizar ou vazar. Dados administrativos são acessíveis apenas por login
          autenticado da equipe do {BRAND.name}.
        </p>

        <p className="font-body font-light text-[10.5px] text-offwhite/25 tracking-[0.05em] mt-12 pt-6 border-t border-offwhite/8">
          Este documento é um modelo de referência gerado para o lançamento do sistema e não substitui
          orientação jurídica. Recomendamos revisão por um advogado especializado em LGPD antes da
          divulgação oficial, incluindo a formalização da razão social, CNPJ e encarregado de dados
          (DPO) do negócio.
        </p>
      </div>
    </div>
  )
}
