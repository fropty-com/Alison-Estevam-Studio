import { Nav }             from '@/components/layout/Nav'
import { Footer }          from '@/components/layout/Footer'
import { Cursor }          from '@/components/ui/Cursor'
import { BookingProvider } from '@/components/booking/BookingProvider'
import { NavScheduleBtn }  from '@/components/layout/NavScheduleBtn'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <Cursor />
      <Nav />
      <NavScheduleBtn />
      <main>{children}</main>
      <Footer />
    </BookingProvider>
  )
}
