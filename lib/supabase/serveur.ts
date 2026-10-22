import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client au nom du visiteur connecté : les règles RLS s'appliquent.
export async function supabaseServeur() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste) => {
        try {
          liste.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // appelé depuis un composant serveur : le proxy rafraîchit la session
        }
      },
    },
  })
}

// Chemin de retour après connexion : uniquement une adresse interne au site.
export function suiteSure(v: string | null | undefined, defaut = '/compte') {
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : defaut
}
