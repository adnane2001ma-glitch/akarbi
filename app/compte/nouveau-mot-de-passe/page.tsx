'use client'

import { useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/navigateur'
import { ChampMotDePasse, messageAuth } from '../outils'

export default function NouveauMotDePasse() {
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    if (mdp.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.')
    if (mdp !== confirmation) return setErreur('Les deux mots de passe ne sont pas identiques.')
    setEnvoi(true)
    setErreur('')
    const supabase = supabaseNavigateur()
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setEnvoi(false)
      return setErreur('Ce lien a expiré. Demande un nouveau lien depuis « Mot de passe oublié ».')
    }
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setEnvoi(false)
    if (error) setErreur(messageAuth(error))
    else location.href = '/compte?mdp=1'
  }

  return (
    <main className="c-auth">
      <h1 className="a-h1">Nouveau mot de passe</h1>
      <form className="a-pile" onSubmit={valider}>
        <ChampMotDePasse label="Nouveau mot de passe" value={mdp} onChange={setMdp} minLength={8} autoComplete="new-password" aide="8 caractères minimum." autoFocus />
        <ChampMotDePasse label="Confirme le mot de passe" value={confirmation} onChange={setConfirmation} minLength={8} autoComplete="new-password" />
        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
        <button className="a-btn a-btn--plein c-plein" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </main>
  )
}
