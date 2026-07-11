'use client'

import { useRouter } from 'next/navigation'
import { HeroSection } from './HeroSection'

export function HomeHero() {
  const router = useRouter()
  return <HeroSection onScheduleClick={() => router.push('/agendar')} />
}
