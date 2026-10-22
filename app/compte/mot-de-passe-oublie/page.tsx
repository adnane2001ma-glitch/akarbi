'use client'

import { useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/navigateur'
import { messageAuth } from '../outils'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    const { error } = await supabaseNavigateur().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${location.origin}/auth/callback?suite=${encodeURIComponent('/compte/nouveau-mot-de-passe')}`,
    })
    setEnvoi(false)
    if (error) setErreur(messageAuth(error))
    else setEnvoye(true)
  }

  return (
    <main className="c-auth">
      <h1 className="a-h1">Mot de passe oublié</h1>
      {envoye ? (
        <>
          <p className="a-sous">Si un compte existe avec <b>{email}</b>, un lien pour choisir un nouveau mot de passe vient de partir.</p>
          <p className="a-aide" style={{ textAlign: 'center' }}>Pense à regarder dans les spams.</p>
          <a className="a-btn" href="/compte/connexion">Retour à la connexion</a>
        </>
      ) : (
        <form className="a-pile" onSubmit={valider}>
          <p className="a-sous">Entre ton email : nous t’envoyons un lien pour en choisir un nouveau.</p>
          <label className="a-champ"><span>Email</span><input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></label>
          {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
          <button className="a-btn a-btn--plein c-plein" disabled={envoi}>{envoi ? 'Envoi…' : 'Recevoir le lien'}</button>
          <a className="a-aide" href="/compte/connexion" style={{ textAlign: 'center' }}>Retour à la connexion</a>
        </form>
      )}
    </main>
  )
}
