import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_ADMIN, sessionValide } from '@/lib/admin-session'
import { COOKIE_ACCES, EMPREINTES_CODES, OUVERTURE } from '@/lib/lancement'

const PAGES_COMPTE_PUBLIQUES = ['/compte/connexion', '/compte/mot-de-passe-oublie', '/compte/nouveau-mot-de-passe']

// Rafraîchit la session client Supabase et indique si quelqu'un est connecté.
async function sessionClient(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        liste.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()
  return { res, connecte: !!data.user }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/connexion' || pathname === '/api/admin/connexion') return NextResponse.next()
    if (await sessionValide(req.cookies.get(COOKIE_ADMIN)?.value)) return NextResponse.next()
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'non connecté' }, { status: 401 })
    return NextResponse.redirect(new URL('/admin/connexion', req.url))
  }

  if (pathname.startsWith('/compte') || pathname.startsWith('/api/compte') || pathname.startsWith('/auth')) {
    const { res, connecte } = await sessionClient(req)
    if (pathname.startsWith('/compte') && !connecte && !PAGES_COMPTE_PUBLIQUES.includes(pathname)) {
      const url = new URL('/compte/connexion', req.url)
      url.searchParams.set('suite', pathname + req.nextUrl.search)
      return NextResponse.redirect(url)
    }
    return res
  }

  // Avant l'ouverture, le site n'est visible qu'avec un code saisi sur le compte à rebours.
  if (Date.now() >= OUVERTURE) return NextResponse.next()
  const acces = req.cookies.get(COOKIE_ACCES)?.value
  if (acces && EMPREINTES_CODES.includes(acces)) return NextResponse.next()
  return NextResponse.redirect(new URL('/', req.url))
}

export const config = {
  matcher: [
    '/akarbi', '/akarbi/', '/akarbi/index.html',
    '/admin', '/admin/:path*', '/api/admin/:path*',
    '/compte', '/compte/:path*', '/api/compte/:path*', '/auth/:path*',
  ],
}
