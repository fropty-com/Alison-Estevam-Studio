'use server'

import { redirect } from 'next/navigation'
import { destroyClientSession } from '@/lib/client-auth/session'

export async function logoutClientAction() {
  await destroyClientSession()
  redirect('/')
}
