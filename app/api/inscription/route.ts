import { NextResponse } from 'next/server'
import { inscrire } from '@/lib/inscriptions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const champ = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : null)

export async function POST(req: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'config' }, { status: 500 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254 || body.consentement !== true) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  try {
    await inscrire(email, {
      source: champ(body.source),
      utm_source: champ(body.utm_source),
      utm_medium: champ(body.utm_medium),
      utm_campaign: champ(body.utm_campaign),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'db' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
