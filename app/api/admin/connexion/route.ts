import { NextResponse } from 'next/server'
import { COOKIE_ADMIN, creerSession, DUREE_SESSION, motDePasseCorrect } from '@/lib/admin-session'

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) return NextResponse.json({ error: 'config' }, { status: 500 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.motDePasse !== 'string' || !(await motDePasseCorrect(body.motDePasse))) {
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: 'mot de passe incorrect' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_ADMIN, await creerSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: DUREE_SESSION / 1000,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_ADMIN)
  return res
}
