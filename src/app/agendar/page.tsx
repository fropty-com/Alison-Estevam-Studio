import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AgendarFlow } from '@/components/booking/AgendarFlow'

export const metadata: Metadata = {
  title: 'Agendamento — Alison Estevam Studio',
}

export default function AgendarPage() {
  return (
    <div className="max-w-[480px] mx-auto min-h-screen">
      <Suspense fallback={null}>
        <AgendarFlow />
      </Suspense>
    </div>
  )
}
