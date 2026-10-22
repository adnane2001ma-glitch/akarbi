'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Produit, Signature } from '@/lib/catalogue'
import Entete from './Entete'
import { api, envoyerPhoto, formatPrix } from './outils'

export default function Tableau() {
  const [produits, setProduits] = useState<Produit[] | null>(null)
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState('')
  const [onglet, setOnglet] = useState<'homme' | 'femme'>('homme')
  const champOrdre = onglet === 'femme' ? 'ordre_femme' : 'ordre'
  const rang = (p: Produit) => (onglet === 'femme' ? p.ordre_femme ?? p.ordre : p.ordre)
  const liste = produits && [...produits].filter((p) => p[onglet]).sort((a, b) => rang(a) - rang(b))

  const charger = () => api<Produit[]>('/api/admin/produits').then(setProduits).catch((e) => setErreur(e.message))
  useEffect(() => { charger() }, [])

  async function action(cle: string, fn: () => Promise<unknown>) {
    setOccupe(cle)
    setErreur('')
    try {
      await fn()
      await charger()
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setOccupe('')
    }
  }

  const basculer = (p: Produit) =>
    action(p.id + 'pub', () => api(`/api/admin/produits/${p.id}`, { method: 'PATCH', body: JSON.stringify({ publie: !p.publie }) }))

  // renumérote toute la liste pour que l'ordre reste propre après chaque déplacement
  const deplacer = (i: number, d: number) =>
    action(liste![i].id + 'ordre', async () => {
      const l = [...liste!]
      ;[l[i], l[i + d]] = [l[i + d], l[i]]
      await Promise.all(
        l.map((p, k) => (p[champOrdre] === (k + 1) * 10 ? null : api(`/api/admin/produits/${p.id}`, { method: 'PATCH', body: JSON.stringify({ [champOrdre]: (k + 1) * 10 }) }))),
      )
    })

  const supprimer = (p: Produit) => {
    if (!window.confirm(`Supprimer « ${p.nom}${p.coloris ? ' — ' + p.coloris : ''} » ? Cette action est définitive.`)) return
    action(p.id + 'sup', () => api(`/api/admin/produits/${p.id}`, { method: 'DELETE' }))
  }

  return (
    <>
      <Entete />
      <main className="a-wrap">
        <h1 className="a-h1">Les pièces</h1>
        <p className="a-sous">Ce que tu modifies ici apparaît sur le site en moins d’une minute.</p>

        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}

        <section className="a-pile" style={{ marginTop: 20 }}>
          <div className="a-ligne" style={{ justifyContent: 'space-between' }}>
            <h2 className="a-h2" style={{ margin: 0 }}>Produits {produits && `(${produits.length})`}</h2>
            <Link className="a-btn a-btn--plein" href="/admin/produits/nouveau">+ Nouveau produit</Link>
          </div>

          {!produits && !erreur && <p className="a-aide">Chargement…</p>}
          {produits?.length === 0 && <p className="a-aide">Aucun produit pour l’instant. Crée le premier.</p>}
          {!!produits?.length && (
            <div className="a-ligne">
              <span className="a-aide">Ordre d’affichage dans l’onglet :</span>
              <div className="a-puces">
                {(['homme', 'femme'] as const).map((o) => (
                  <button key={o} type="button" className="a-puce" aria-pressed={onglet === o} onClick={() => setOnglet(o)}>{o === 'homme' ? 'Homme' : 'Femme'}</button>
                ))}
              </div>
            </div>
          )}

          <div className="a-produits">
            {liste?.map((p, i) => (
              <article key={p.id} className="a-produit">
                {p.photos[0] ? <img src={p.photos[0].url} alt="" /> : <div className="a-vide-img" />}
                <div>
                  <h3>{p.nom}{p.coloris && ` — ${p.coloris}`}</h3>
                  <p>
                    <span className={`a-badge ${p.publie ? 'a-badge--on' : 'a-badge--off'}`}>{p.publie ? 'En ligne' : 'Masqué'}</span>
                    {[p.categorie, formatPrix(p.prix_eur, p.prix_mad), p.tailles.join(' · ') || 'Aucune taille', [p.homme && 'Homme', p.femme && 'Femme'].filter(Boolean).join(' & ')]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </p>
                </div>
                <div className="a-actions">
                  <button type="button" className="a-btn a-btn--icone" aria-label="Monter" disabled={i === 0 || !!occupe} onClick={() => deplacer(i, -1)}>↑</button>
                  <button type="button" className="a-btn a-btn--icone" aria-label="Descendre" disabled={i === liste.length - 1 || !!occupe} onClick={() => deplacer(i, 1)}>↓</button>
                  <button type="button" className="a-btn" disabled={!!occupe} onClick={() => basculer(p)}>{p.publie ? 'Masquer' : 'Mettre en ligne'}</button>
                  <Link className="a-btn" href={`/admin/produits/${p.id}`}>Modifier</Link>
                  <button type="button" className="a-btn a-btn--danger" disabled={!!occupe} onClick={() => supprimer(p)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <SignatureEditeur />
      </main>
    </>
  )
}

function SignatureEditeur() {
  const [items, setItems] = useState<Signature[] | null>(null)
  const [etat, setEtat] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState<number | 'tout' | null>(null)

  useEffect(() => {
    api<Signature[]>('/api/admin/signature').then(setItems).catch((e) => setEtat({ type: 'erreur', texte: e.message }))
  }, [])

  const maj = (i: number, champ: keyof Signature, v: string) => setItems((l) => l!.map((s, k) => (k === i ? { ...s, [champ]: v } : s)))

  async function photo(i: number, f: File | undefined) {
    if (!f) return
    setEnvoi(i)
    setEtat(null)
    try {
      maj(i, 'image', await envoyerPhoto(f))
    } catch (e) {
      setEtat({ type: 'erreur', texte: (e as Error).message })
    } finally {
      setEnvoi(null)
    }
  }

  async function enregistrer() {
    setEnvoi('tout')
    setEtat(null)
    try {
      await api('/api/admin/signature', { method: 'PUT', body: JSON.stringify(items) })
      setEtat({ type: 'ok', texte: 'La signature est enregistrée.' })
    } catch (e) {
      setEtat({ type: 'erreur', texte: (e as Error).message })
    } finally {
      setEnvoi(null)
    }
  }

  return (
    <section className="a-carte a-pile" style={{ marginTop: 48 }}>
      <div>
        <h2 className="a-h2">La signature — Une forme que l’on reconnaît</h2>
        <p className="a-aide" style={{ margin: 0 }}>Les 3 photos de la page Produits, avec leur titre et leur texte.</p>
      </div>
      {!items && !etat && <p className="a-aide">Chargement…</p>}
      {items && items.length < 3 && <p className="a-aide">La signature n’est pas encore configurée.</p>}
      {items && items.length === 3 && (
        <>
          <div className="a-grille3">
            {items.map((s, i) => (
              <div key={i} className="a-pile" style={{ gap: 10 }}>
                <div className="a-photo__img"><img src={s.image} alt="" /></div>
                <label className="a-btn" style={{ position: 'relative' }}>
                  {envoi === i ? 'Envoi…' : 'Changer la photo'}
                  <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={envoi !== null} onChange={(e) => photo(i, e.target.files?.[0])} />
                </label>
                <label className="a-champ"><span>Titre</span><input type="text" value={s.titre} maxLength={60} onChange={(e) => maj(i, 'titre', e.target.value)} /></label>
                <label className="a-champ"><span>Texte</span><textarea value={s.texte} maxLength={300} onChange={(e) => maj(i, 'texte', e.target.value)} style={{ minHeight: 72 }} /></label>
                <label className="a-champ"><span>Description de la photo</span><input type="text" value={s.alt} maxLength={200} onChange={(e) => maj(i, 'alt', e.target.value)} /><small>Lue par les personnes malvoyantes et par Google.</small></label>
              </div>
            ))}
          </div>
          {etat && <p className={`a-msg a-msg--${etat.type}`} role="status">{etat.texte}</p>}
          <div className="a-ligne" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="a-btn a-btn--plein" disabled={envoi !== null} onClick={enregistrer}>{envoi === 'tout' ? 'Enregistrement…' : 'Enregistrer la signature'}</button>
          </div>
        </>
      )}
      {!items && etat && <p className={`a-msg a-msg--${etat.type}`} role="alert">{etat.texte}</p>}
    </section>
  )
}
