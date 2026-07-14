import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Temporary diagnostic route — checks Resend domain verification status.
// Remove once the email-delivery issue is diagnosed.
export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const domains = await resend.domains.list()
  return NextResponse.json({
    hasApiKey: !!process.env.RESEND_API_KEY,
    domains,
  })
}
