import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReviewForm } from '@/components/profile/ReviewForm'

interface PendingReview {
  id: string
  serviceName: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  serviceName: string
}

export function ReviewsSection({ pending, reviews }: { pending: PendingReview[]; reviews: Review[] }) {
  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-[26px]">
          <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/55 mb-[12px]">
            Avalie seu atendimento
          </p>
          <div className="flex flex-col gap-[10px]">
            {pending.map(a => (
              <ReviewForm key={a.id} appointmentId={a.id} serviceName={a.serviceName} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/55 mb-[12px]">
          Suas avaliações
        </p>

        {reviews.length === 0 ? (
          <div className="border border-offwhite/[0.08] px-8 py-12 text-center">
            <p className="font-body font-light text-[13px] text-offwhite/55 mb-[6px]">
              Você ainda não fez avaliações.
            </p>
            <p className="font-body font-light text-[11px] text-offwhite/55">
              Após concluir um atendimento, você poderá avaliar sua experiência aqui.
            </p>
          </div>
        ) : (
          <div className="border border-offwhite/[0.07] divide-y divide-offwhite/6">
            {reviews.map(r => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-[6px]">
                  <p className="font-body font-light text-[12px] text-offwhite/70">{r.serviceName}</p>
                  <span className="font-data text-gold text-[13px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && (
                  <p className="font-body font-light text-[12px] text-offwhite/55 leading-[1.6] mb-[6px]">{r.comment}</p>
                )}
                <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.08em]">
                  {format(parseISO(r.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
