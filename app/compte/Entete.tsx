'use client'

import { useEffect, useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/navigateur'

export default function Entete() {
  const [connecte, setConnecte] = useState(false)

  useEffect(() => {
    const supabase = supabaseNavigateur()
    supabase.auth.getSession().then(({ data }) => setConnecte(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setConnecte(!!session))
    return () => data.subscription.unsubscribe()
  }, [])

  async function deconnexion() {
    await supabaseNavigateur().auth.signOut()
    location.href = '/compte/connexion?deconnecte=1'
  }

  return (
    <header className="a-top">
      <a href="/" className="c-logo" aria-label="AKARBI, retour au site"><img src="/emails/akarbi-logo.png?v=2" alt="AKARBI" /></a>
      <nav className="c-entete">
        <a className="a-btn" href="/">Retour au site</a>
        {connecte && <button type="button" className="a-btn" onClick={deconnexion}>Se déconnecter</button>}
      </nav>
    </header>
  )
}
