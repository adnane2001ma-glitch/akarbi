'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/navigateur'
import { ChampMotDePasse, messageAuth, PAYS } from './outils'

type Profil = { id: string; prenom: string; nom: string; telephone: string; date_naissance: string | null; ville: string; pays: string; numero_membre: number; created_at: string }
type Adresse = { id?: string; libelle: string; nom_complet: string; ligne1: string; ligne2: string; code_postal: string; ville: string; pays: string; telephone: string; par_defaut: boolean }
type Commande = { id: string; numero: number; statut: string; articles: { nom: string; coloris?: string; taille?: string; quantite: number }[]; total_eur: number | null; total_mad: number | null; created_at: string }
type ProduitSite = { id: string; name: string; color: string; face: string; eur: number | null; mad: number | null }

const ACHETEE = ['payee', 'preparee', 'expediee', 'livree']
const STATUTS: Record<string, string> = { en_attente: 'En attente de paiement', payee: 'Payée', preparee: 'En préparation', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée' }
const ONGLETS = [['profil', 'Profil'], ['commandes', 'Commandes'], ['favoris', 'Favoris'], ['adresses', 'Adresses'], ['preferences', 'Préférences'], ['securite', 'Sécurité']] as const
type Onglet = (typeof ONGLETS)[number][0]

const prix = (eur: number | null, mad: number | null) =>
  [eur != null ? `${eur.toLocaleString('fr-FR')} €` : '', mad != null ? `${mad.toLocaleString('fr-FR')} MAD` : ''].filter(Boolean).join(' · ')
const profilIncomplet = (p: Profil) => !p.prenom || !p.nom || !p.telephone || !p.ville || !p.pays

export default function EspaceMembre() {
  const supabase = supabaseNavigateur()
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [onglet, setOnglet] = useState<Onglet>('profil')
  const [annonce, setAnnonce] = useState('')
  const [erreur, setErreur] = useState('')

  async function charger() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return void (location.href = '/compte/connexion')
    setUser(data.user)
    const [p, c] = await Promise.all([
      supabase.from('profils').select('*').eq('id', data.user.id).maybeSingle(),
      supabase.from('commandes').select('*').order('created_at', { ascending: false }),
    ])
    if (p.error) setErreur('Ton profil n’a pas pu être chargé. Réessaie dans un instant.')
    setProfil(p.data as Profil | null)
    setCommandes((c.data as Commande[]) ?? [])
  }

  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('bienvenue')) setAnnonce('Ton compte est confirmé. Bienvenue dans le cercle.')
    if (q.get('mdp')) setAnnonce('Ton nouveau mot de passe est enregistré.')
    if (q.get('onglet') === 'securite') setOnglet('securite')
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (erreur) return <main className="a-wrap"><p className="a-msg a-msg--erreur" style={{ marginTop: 40 }}>{erreur}</p></main>
  if (!user || !profil) return <main className="a-wrap"><p className="a-aide" style={{ marginTop: 40 }}>Chargement…</p></main>

  const membre = commandes.some((c) => ACHETEE.includes(c.statut))
  const depuis = new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (profilIncomplet(profil)) {
    return (
      <main className="c-auth">
        <h1 className="a-h1">Encore un instant</h1>
        <p className="a-sous">Complète ton profil pour finaliser ton compte.</p>
        <FormProfil profil={profil} onSauve={(p) => setProfil(p)} />
      </main>
    )
  }

  return (
    <main className="a-wrap">
      <h1 className="a-h1">Bonjour {profil.prenom}</h1>
      <p className="a-sous">{user.email}</p>
      {annonce && <p className="a-msg a-msg--ok" role="status" style={{ marginBottom: 20 }}>{annonce}</p>}

      <section className="c-carte" aria-label="Carte de membre">
        <div className="c-carte__haut">
          <img src="/emails/akarbi-logo.png?v=2" alt="AKARBI" />
          <span className="c-carte__statut">{membre ? 'Membre ACHIRA' : 'Le cercle'}</span>
        </div>
        <div className="c-carte__num">N° {String(profil.numero_membre).padStart(4, '0')}</div>
        <div>
          <div className="c-carte__nom">{profil.prenom} {profil.nom}</div>
          <div className="a-aide">{membre ? `Membre depuis ${depuis}` : 'Ta première pièce fera de toi un membre d’ACHIRA.'}</div>
        </div>
      </section>

      <nav className="c-menu a-puces" aria-label="Rubriques du compte">
        {ONGLETS.map(([id, label]) => (
          <button key={id} type="button" className="a-puce" aria-pressed={onglet === id} onClick={() => setOnglet(id)}>{label}</button>
        ))}
      </nav>

      {onglet === 'profil' && (
        <section className="a-carte a-pile"><h2 className="a-h2">Mes informations</h2><FormProfil profil={profil} onSauve={(p) => setProfil(p)} /></section>
      )}
      {onglet === 'securite' && <Securite user={user} />}
      {onglet === 'commandes' && <Commandes commandes={commandes} />}
      {onglet === 'favoris' && <Favoris />}
      {onglet === 'adresses' && <Adresses profil={profil} />}
      {onglet === 'preferences' && <Preferences />}
    </main>
  )
}

function FormProfil({ profil, onSauve }: { profil: Profil; onSauve: (p: Profil) => void }) {
  const [f, setF] = useState({ prenom: profil.prenom, nom: profil.nom, telephone: profil.telephone, date_naissance: profil.date_naissance ?? '', ville: profil.ville, pays: profil.pays || 'Maroc' })
  const [etat, setEtat] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    setEtat(null)
    const maj = {
      prenom: f.prenom.trim().slice(0, 60), nom: f.nom.trim().slice(0, 60), telephone: f.telephone.trim().slice(0, 30),
      date_naissance: f.date_naissance || null, ville: f.ville.trim().slice(0, 80), pays: f.pays.trim().slice(0, 80), updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseNavigateur().from('profils').update(maj).eq('id', profil.id)
    setEnvoi(false)
    if (error) return setEtat({ type: 'erreur', texte: 'L’enregistrement a échoué. Réessaie.' })
    setEtat({ type: 'ok', texte: 'Tes informations sont enregistrées.' })
    onSauve({ ...profil, ...maj })
  }

  return (
    <form className="a-pile" onSubmit={valider}>
      <div className="a-grille2">
        <label className="a-champ"><span>Prénom</span><input type="text" required maxLength={60} autoComplete="given-name" value={f.prenom} onChange={maj('prenom')} /></label>
        <label className="a-champ"><span>Nom</span><input type="text" required maxLength={60} autoComplete="family-name" value={f.nom} onChange={maj('nom')} /></label>
        <label className="a-champ"><span>Téléphone</span><input type="tel" required maxLength={30} autoComplete="tel" value={f.telephone} onChange={maj('telephone')} placeholder="+212 6 12 34 56 78" /></label>
        <label className="a-champ"><span>Date de naissance (facultatif)</span><input type="date" max={new Date().toISOString().slice(0, 10)} value={f.date_naissance} onChange={maj('date_naissance')} /></label>
        <label className="a-champ"><span>Ville</span><input type="text" required maxLength={80} autoComplete="address-level2" value={f.ville} onChange={maj('ville')} /></label>
        <label className="a-champ"><span>Pays</span><input type="text" required maxLength={80} list="pays-profil" autoComplete="country-name" value={f.pays} onChange={maj('pays')} /><datalist id="pays-profil">{PAYS.map((p) => <option key={p} value={p} />)}</datalist></label>
      </div>
      {etat && <p className={`a-msg a-msg--${etat.type}`} role="status">{etat.texte}</p>}
      <div className="a-ligne" style={{ justifyContent: 'flex-end' }}><button className="a-btn a-btn--plein" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  )
}

function Securite({ user }: { user: User }) {
  const parEmail = user.app_metadata?.providers?.includes('email') ?? user.app_metadata?.provider === 'email'
  const [f, setF] = useState({ actuel: '', nouveau: '', confirmation: '' })
  const [etat, setEtat] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const champ = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))

  async function changer(e: React.FormEvent) {
    e.preventDefault()
    if (f.nouveau.length < 8) return setEtat({ type: 'erreur', texte: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
    if (f.nouveau !== f.confirmation) return setEtat({ type: 'erreur', texte: 'Les deux nouveaux mots de passe ne sont pas identiques.' })
    setEnvoi(true)
    setEtat(null)
    const supabase = supabaseNavigateur()
    if (parEmail) {
      // Supabase ne demande pas l'ancien mot de passe : on le vérifie avant de le remplacer
      const { error } = await supabase.auth.signInWithPassword({ email: user.email!, password: f.actuel })
      if (error) {
        setEnvoi(false)
        return setEtat({ type: 'erreur', texte: 'Le mot de passe actuel est incorrect.' })
      }
    }
    const { error } = await supabase.auth.updateUser({ password: f.nouveau })
    if (!error) await supabase.auth.signOut({ scope: 'others' })
    setEnvoi(false)
    if (error) return setEtat({ type: 'erreur', texte: messageAuth(error) })
    setF({ actuel: '', nouveau: '', confirmation: '' })
    setEtat({ type: 'ok', texte: parEmail ? 'Mot de passe modifié. Tes autres appareils ont été déconnectés.' : 'Mot de passe ajouté. Tu peux maintenant te connecter aussi avec ton email.' })
  }
  async function deconnexion(scope: 'local' | 'global') {
    await supabaseNavigateur().auth.signOut({ scope })
    location.href = '/compte/connexion?deconnecte=1'
  }
  async function supprimer() {
    const r = await fetch('/api/compte/supprimer', { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    if (r.ok) location.href = '/'
    else setEtat({ type: 'erreur', texte: d.error || 'La suppression a échoué.' })
  }

  return (
    <div className="a-pile" style={{ gap: 24 }}>
      <section className="a-carte a-pile">
        <h2 className="a-h2">{parEmail ? 'Changer le mot de passe' : 'Ajouter un mot de passe'}</h2>
        {!parEmail && <p className="a-aide" style={{ margin: 0 }}>Tu te connectes avec Google. Ajoute un mot de passe pour pouvoir aussi te connecter avec ton email.</p>}
        <form className="a-pile" onSubmit={changer}>
          {parEmail && <ChampMotDePasse label="Mot de passe actuel" value={f.actuel} onChange={champ('actuel')} autoComplete="current-password" />}
          <div className="a-grille2">
            <ChampMotDePasse label="Nouveau mot de passe" value={f.nouveau} onChange={champ('nouveau')} minLength={8} autoComplete="new-password" aide="8 caractères minimum." />
            <ChampMotDePasse label="Confirme le nouveau" value={f.confirmation} onChange={champ('confirmation')} minLength={8} autoComplete="new-password" />
          </div>
          {etat && <p className={`a-msg a-msg--${etat.type}`} role="status">{etat.texte}</p>}
          <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
            {parEmail ? <a className="a-aide" href="/compte/mot-de-passe-oublie">Mot de passe oublié ?</a> : <span />}
            <button className="a-btn a-btn--plein" disabled={envoi || !f.nouveau}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </section>

      <section className="a-carte a-pile">
        <h2 className="a-h2">Connexion</h2>
        <p className="a-aide" style={{ margin: 0 }}>Connecté avec <b>{user.email}</b>{parEmail ? '' : ' via Google'}.</p>
        <div className="a-ligne">
          <button type="button" className="a-btn" onClick={() => deconnexion('local')}>Se déconnecter</button>
          <button type="button" className="a-btn" onClick={() => deconnexion('global')}>Se déconnecter de tous les appareils</button>
        </div>
      </section>

      <section className="a-carte a-pile">
        <h2 className="a-h2">Supprimer le compte</h2>
        {!suppression ? (
          <div className="a-ligne"><button type="button" className="a-btn a-btn--danger" onClick={() => setSuppression(true)}>Supprimer mon compte</button></div>
        ) : (
          <span className="a-ligne">
            <span className="a-aide">Supprimer définitivement ton compte, tes adresses et tes favoris ?</span>
            <button type="button" className="a-btn" onClick={() => setSuppression(false)}>Annuler</button>
            <button type="button" className="a-btn a-btn--danger" onClick={supprimer}>Oui, supprimer</button>
          </span>
        )}
      </section>
    </div>
  )
}

function Commandes({ commandes }: { commandes: Commande[] }) {
  if (!commandes.length) {
    return (
      <section className="a-carte a-pile">
        <h2 className="a-h2">Mes commandes</h2>
        <p className="a-aide" style={{ margin: 0 }}>Aucune commande pour l’instant. Tes pièces AKARBI apparaîtront ici, avec leur suivi.</p>
        <div><a className="a-btn a-btn--plein" href="/akarbi/index.html#/produits">Découvrir la collection</a></div>
      </section>
    )
  }
  return (
    <section className="a-pile">
      {commandes.map((c) => (
        <article key={c.id} className="a-carte a-pile" style={{ gap: 10 }}>
          <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
            <b>Commande n° {c.numero}</b>
            <span className={`a-badge ${c.statut === 'annulee' ? 'a-badge--off' : 'a-badge--on'}`}>{STATUTS[c.statut] ?? c.statut}</span>
          </div>
          <p className="a-aide" style={{ margin: 0 }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {c.articles.map((a, i) => <li key={i}>{a.quantite} × {a.nom}{a.coloris ? ` — ${a.coloris}` : ''}{a.taille ? ` (taille ${a.taille})` : ''}</li>)}
          </ul>
          <b>{prix(c.total_eur, c.total_mad)}</b>
        </article>
      ))}
    </section>
  )
}

function Favoris() {
  const [liste, setListe] = useState<ProduitSite[] | null>(null)

  async function charger() {
    const [f, cat] = await Promise.all([supabaseNavigateur().from('favoris').select('produit_id').order('created_at', { ascending: false }), fetch('/api/catalogue').then((r) => r.json())])
    const parId = new Map<string, ProduitSite>((cat.produits ?? []).map((p: ProduitSite) => [p.id, p]))
    setListe((f.data ?? []).map((x) => parId.get(x.produit_id)).filter((p): p is ProduitSite => !!p))
  }
  useEffect(() => { charger() }, [])

  async function retirer(id: string) {
    await fetch('/api/compte/favoris', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ produit: id, actif: false }) })
    setListe((l) => l!.filter((p) => p.id !== id))
  }

  return (
    <section className="a-carte a-pile">
      <h2 className="a-h2">Mes favoris</h2>
      {!liste && <p className="a-aide">Chargement…</p>}
      {liste?.length === 0 && <p className="a-aide" style={{ margin: 0 }}>Aucun favori. Sur une fiche produit, touche le cœur pour garder une pièce ici.</p>}
      <div className="c-favoris">
        {liste?.map((p) => (
          <div key={p.id} className="a-pile" style={{ gap: 8 }}>
            <a className="c-favori" href={`/akarbi/index.html#/produit/${p.id}`}>
              {p.face && <img src={p.face} alt="" />}
              <b>{p.name}{p.color ? ` — ${p.color}` : ''}</b>
              <span className="a-aide">{prix(p.eur, p.mad)}</span>
            </a>
            <button type="button" className="a-btn" onClick={() => retirer(p.id)}>Retirer</button>
          </div>
        ))}
      </div>
    </section>
  )
}

const ADRESSE_VIDE: Adresse = { libelle: '', nom_complet: '', ligne1: '', ligne2: '', code_postal: '', ville: '', pays: 'Maroc', telephone: '', par_defaut: false }

function Adresses({ profil }: { profil: Profil }) {
  const supabase = supabaseNavigateur()
  const [liste, setListe] = useState<Adresse[] | null>(null)
  const [edition, setEdition] = useState<Adresse | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    const { data } = await supabase.from('adresses').select('*').order('par_defaut', { ascending: false }).order('created_at')
    setListe((data as Adresse[]) ?? [])
  }
  useEffect(() => { charger() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const a = edition!
    const ligne = {
      libelle: a.libelle.trim().slice(0, 40), nom_complet: a.nom_complet.trim().slice(0, 120), ligne1: a.ligne1.trim().slice(0, 200), ligne2: a.ligne2.trim().slice(0, 200),
      code_postal: a.code_postal.trim().slice(0, 20), ville: a.ville.trim().slice(0, 80), pays: a.pays.trim().slice(0, 80), telephone: a.telephone.trim().slice(0, 30),
      par_defaut: a.par_defaut || !liste?.length,
    }
    if (ligne.par_defaut) await supabase.from('adresses').update({ par_defaut: false }).neq('id', a.id ?? '00000000-0000-0000-0000-000000000000')
    const { error } = a.id ? await supabase.from('adresses').update(ligne).eq('id', a.id) : await supabase.from('adresses').insert(ligne)
    if (error) return setErreur('L’adresse n’a pas pu être enregistrée.')
    setEdition(null)
    charger()
  }
  async function supprimer(id: string) {
    await supabase.from('adresses').delete().eq('id', id)
    charger()
  }
  const maj = (k: keyof Adresse) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEdition((x) => ({ ...x!, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (edition) {
    return (
      <section className="a-carte">
        <form className="a-pile" onSubmit={enregistrer}>
          <h2 className="a-h2">{edition.id ? 'Modifier l’adresse' : 'Nouvelle adresse'}</h2>
          <div className="a-grille2">
            <label className="a-champ"><span>Nom de l’adresse (facultatif)</span><input type="text" maxLength={40} placeholder="Maison, Bureau…" value={edition.libelle} onChange={maj('libelle')} /></label>
            <label className="a-champ"><span>Destinataire</span><input type="text" required maxLength={120} autoComplete="name" value={edition.nom_complet} onChange={maj('nom_complet')} /></label>
          </div>
          <label className="a-champ"><span>Adresse</span><input type="text" required maxLength={200} autoComplete="address-line1" value={edition.ligne1} onChange={maj('ligne1')} /></label>
          <label className="a-champ"><span>Complément (facultatif)</span><input type="text" maxLength={200} autoComplete="address-line2" placeholder="Appartement, étage, résidence…" value={edition.ligne2} onChange={maj('ligne2')} /></label>
          <div className="a-grille3">
            <label className="a-champ"><span>Code postal</span><input type="text" maxLength={20} autoComplete="postal-code" value={edition.code_postal} onChange={maj('code_postal')} /></label>
            <label className="a-champ"><span>Ville</span><input type="text" required maxLength={80} autoComplete="address-level2" value={edition.ville} onChange={maj('ville')} /></label>
            <label className="a-champ"><span>Pays</span><input type="text" required maxLength={80} list="pays-adresse" autoComplete="country-name" value={edition.pays} onChange={maj('pays')} /><datalist id="pays-adresse">{PAYS.map((p) => <option key={p} value={p} />)}</datalist></label>
          </div>
          <label className="a-champ"><span>Téléphone pour la livraison</span><input type="tel" maxLength={30} autoComplete="tel" value={edition.telephone} onChange={maj('telephone')} /></label>
          <label className="a-case"><input type="checkbox" checked={edition.par_defaut} onChange={maj('par_defaut')} /> Adresse par défaut</label>
          {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}
          <div className="a-ligne" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="a-btn" onClick={() => setEdition(null)}>Annuler</button>
            <button className="a-btn a-btn--plein">Enregistrer</button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="a-carte a-pile">
      <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
        <h2 className="a-h2" style={{ margin: 0 }}>Mes adresses</h2>
        <button type="button" className="a-btn a-btn--plein" onClick={() => setEdition({ ...ADRESSE_VIDE, nom_complet: `${profil.prenom} ${profil.nom}`, telephone: profil.telephone, ville: profil.ville, pays: profil.pays || 'Maroc' })}>+ Ajouter</button>
      </div>
      {!liste && <p className="a-aide">Chargement…</p>}
      {liste?.length === 0 && <p className="a-aide" style={{ margin: 0 }}>Aucune adresse enregistrée.</p>}
      <div className="a-grille2">
        {liste?.map((a) => (
          <div key={a.id} className="c-adresse">
            <b>{a.libelle || a.nom_complet} {a.par_defaut && <span className="a-badge a-badge--on" style={{ marginLeft: 6 }}>Par défaut</span>}</b>
            <p>{a.nom_complet}</p>
            <p>{a.ligne1}{a.ligne2 ? `, ${a.ligne2}` : ''}</p>
            <p>{[a.code_postal, a.ville].filter(Boolean).join(' ')}, {a.pays}</p>
            {a.telephone && <p>{a.telephone}</p>}
            <div className="a-ligne" style={{ marginTop: 8 }}>
              <button type="button" className="a-btn" onClick={() => setEdition(a)}>Modifier</button>
              <button type="button" className="a-btn a-btn--danger" onClick={() => supprimer(a.id!)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Preferences() {
  const [actif, setActif] = useState<boolean | null>(null)
  const [etat, setEtat] = useState('')
  useEffect(() => {
    fetch('/api/compte/newsletter').then((r) => r.json()).then((d) => setActif(!!d.actif)).catch(() => setEtat('Préférences indisponibles pour le moment.'))
  }, [])
  async function basculer(v: boolean) {
    setActif(v)
    const r = await fetch('/api/compte/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actif: v }) })
    setEtat(r.ok ? (v ? 'Tu recevras les nouvelles d’AKARBI.' : 'Tu ne recevras plus nos emails.') : 'Le changement n’a pas pu être enregistré.')
    if (!r.ok) setActif(!v)
  }
  return (
    <section className="a-carte a-pile">
      <h2 className="a-h2">Préférences</h2>
      <label className="c-interrupteur">
        <span><b>Nouvelles d’AKARBI</b><br /><span className="a-aide">Ouverture des chapitres, nouvelles pièces, invitations du cercle.</span></span>
        <input type="checkbox" className="a-case" style={{ width: 22, height: 22, accentColor: 'var(--achira)' }} disabled={actif === null} checked={!!actif} onChange={(e) => basculer(e.target.checked)} />
      </label>
      {etat && <p className="a-aide" role="status" style={{ margin: 0 }}>{etat}</p>}
      <p className="a-aide" style={{ margin: 0 }}>Les emails liés à ton compte et à tes commandes restent envoyés.</p>
    </section>
  )
}
