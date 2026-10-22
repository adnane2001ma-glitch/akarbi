'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Produit } from '@/lib/catalogue'
import { FAMILLES, trierSelections, type FamilleId, type PageHeritage, type Selection } from '@/lib/heritage'
import Entete from '../Entete'
import { api, envoyerPhoto } from '../outils'

export default function ListeHeritage() {
  const [selections, setSelections] = useState<Selection[] | null>(null)
  const [produits, setProduits] = useState<Produit[]>([])
  const [famille, setFamille] = useState<FamilleId | ''>('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState('')

  const charger = () =>
    Promise.all([api<Selection[]>('/api/admin/heritage'), api<Produit[]>('/api/admin/produits')])
      .then(([s, p]) => { setSelections(trierSelections(s)); setProduits(p) })
      .catch((e) => setErreur(e.message))
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

  const patch = (s: Selection, corps: Record<string, unknown>) => api(`/api/admin/heritage/${s.id}`, { method: 'PATCH', body: JSON.stringify(corps) })

  // renumérote la famille pour que l'ordre reste propre après chaque déplacement
  const deplacer = (liste: Selection[], i: number, d: number) =>
    action(liste[i].id + 'ordre', async () => {
      const l = [...liste]
      ;[l[i], l[i + d]] = [l[i + d], l[i]]
      await Promise.all(l.map((s, k) => (s.ordre === (k + 1) * 10 ? null : patch(s, { ordre: (k + 1) * 10 }))))
    })

  const supprimer = (s: Selection) => {
    const n = pieces(s.id).length
    if (!window.confirm(`Supprimer « ${s.titre} » ? Cette action est définitive.${n ? `\n${n} pièce${n > 1 ? 's ne seront plus liées' : ' ne sera plus liée'} à cette sélection.` : ''}`)) return
    action(s.id + 'sup', () => api(`/api/admin/heritage/${s.id}`, { method: 'DELETE' }))
  }

  const pieces = (id: string) => produits.filter((p) => p.heritage?.includes(id))
  const enLigne = selections?.filter((s) => s.publie).length ?? 0
  const familles = FAMILLES.filter((f) => !famille || f.id === famille)

  return (
    <>
      <Entete />
      <main className="a-wrap">
        <h1 className="a-h1">Héritage</h1>
        <p className="a-sous">
          Les sélections de la page Héritage du site, indépendantes des produits. Une pièce s’y rattache depuis sa fiche produit.
          {selections && (enLigne ? ` ${enLigne} sélection${enLigne > 1 ? 's' : ''} en ligne.` : ' Aucune sélection en ligne : la page affiche « Les premières sélections arrivent bientôt ».')}
        </p>

        {erreur && <p className="a-msg a-msg--erreur" role="alert">{erreur}</p>}

        <EditeurEnTete />

        <div className="a-ligne" style={{ justifyContent: 'space-between', marginTop: 40 }}>
          <div className="a-puces">
            <button type="button" className="a-puce" aria-pressed={!famille} onClick={() => setFamille('')}>Toutes</button>
            {FAMILLES.map((f) => {
              const n = selections?.filter((s) => s.famille === f.id).length ?? 0
              return <button key={f.id} type="button" className="a-puce" aria-pressed={famille === f.id} onClick={() => setFamille(f.id)}>{f.nom}{n ? ` (${n})` : ''}</button>
            })}
          </div>
          <Link className="a-btn a-btn--plein" href={`/admin/heritage/nouveau${famille ? `?famille=${famille}` : ''}`}>+ Nouvelle sélection</Link>
        </div>

        {!selections && !erreur && <p className="a-aide">Chargement…</p>}

        {selections && familles.map((f) => {
          const liste = selections.filter((s) => s.famille === f.id)
          if (!liste.length && !famille) return null
          return (
            <section key={f.id}>
              <div className="a-famille">
                <b>{String(FAMILLES.indexOf(f) + 1).padStart(2, '0')}</b>
                <h2 className="a-h2">{f.nom}</h2>
              </div>
              {!liste.length && <p className="a-aide">Aucune sélection dans cette famille. <Link href={`/admin/heritage/nouveau?famille=${f.id}`}>Créer la première</Link>.</p>}
              <div className="a-produits">
                {liste.map((s, i) => {
                  const n = pieces(s.id).length
                  return (
                    <article key={s.id} className="a-produit">
                      {s.photos[0] ? <img src={s.photos[0].url} alt="" /> : <div className="a-vide-img" />}
                      <div>
                        <h3>{s.titre}</h3>
                        <p>
                          <span className={`a-badge ${s.publie ? 'a-badge--on' : 'a-badge--off'}`}>{s.publie ? 'En ligne' : 'Masquée'}</span>
                          {s.a_la_une && <span className="a-badge a-badge--une">À la une</span>}
                          {[s.theme, s.lieu, s.epoque, n ? `${n} pièce${n > 1 ? 's' : ''} liée${n > 1 ? 's' : ''}` : ''].filter(Boolean).join('  ·  ')}
                        </p>
                      </div>
                      <div className="a-actions">
                        <button type="button" className="a-btn a-btn--icone" aria-label="Monter" disabled={i === 0 || !!occupe} onClick={() => deplacer(liste, i, -1)}>↑</button>
                        <button type="button" className="a-btn a-btn--icone" aria-label="Descendre" disabled={i === liste.length - 1 || !!occupe} onClick={() => deplacer(liste, i, 1)}>↓</button>
                        <button type="button" className="a-btn" disabled={!!occupe} onClick={() => action(s.id + 'une', () => patch(s, { a_la_une: !s.a_la_une }))}>{s.a_la_une ? 'Retirer de la une' : 'Mettre à la une'}</button>
                        <button type="button" className="a-btn" disabled={!!occupe} onClick={() => action(s.id + 'pub', () => patch(s, { publie: !s.publie }))}>{s.publie ? 'Masquer' : 'Mettre en ligne'}</button>
                        <Link className="a-btn" href={`/admin/heritage/${s.id}`}>Modifier</Link>
                        <button type="button" className="a-btn a-btn--danger" disabled={!!occupe} onClick={() => supprimer(s)}>Supprimer</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}

        {selections?.length === 0 && !famille && <p className="a-aide" style={{ marginTop: 24 }}>Aucune sélection pour l’instant. Crée la première.</p>}
      </main>
    </>
  )
}

// Grande image et textes en haut de la page Héritage du site
function EditeurEnTete() {
  const [p, setP] = useState<PageHeritage | null>(null)
  const [etat, setEtat] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState<'photo' | 'tout' | null>(null)

  useEffect(() => {
    api<PageHeritage>('/api/admin/heritage-page').then(setP).catch((e) => setEtat({ type: 'erreur', texte: e.message }))
  }, [])

  const maj = (k: keyof PageHeritage, v: string) => setP((x) => ({ ...x!, [k]: v }))

  async function photo(f: File | undefined) {
    if (!f) return
    setEnvoi('photo')
    setEtat(null)
    try {
      maj('image', await envoyerPhoto(f))
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
      await api('/api/admin/heritage-page', { method: 'PUT', body: JSON.stringify(p) })
      setEtat({ type: 'ok', texte: 'L’en-tête de la page est enregistré.' })
    } catch (e) {
      setEtat({ type: 'erreur', texte: (e as Error).message })
    } finally {
      setEnvoi(null)
    }
  }

  return (
    <section className="a-carte a-pile" style={{ marginTop: 20 }}>
      <div>
        <h2 className="a-h2">En-tête de la page</h2>
        <p className="a-aide" style={{ margin: 0 }}>La grande image et les textes affichés tout en haut de la page Héritage. L’image reste fixe pendant que les sélections glissent par-dessus.</p>
      </div>
      {!p && !etat && <p className="a-aide">Chargement…</p>}
      {p && (
        <>
          <div className="a-entete-he">
            <div className="a-entete-he__img"><img src={p.image} alt="" /></div>
            <div className="a-pile" style={{ gap: 12 }}>
              <label className="a-btn" style={{ position: 'relative', justifySelf: 'start' }}>
                {envoi === 'photo' ? 'Envoi…' : 'Changer l’image'}
                <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={envoi !== null} onChange={(e) => photo(e.target.files?.[0])} />
              </label>
              <label className="a-champ"><span>Description de l’image</span><input type="text" maxLength={200} value={p.image_alt} onChange={(e) => maj('image_alt', e.target.value)} /><small>Format panoramique conseillé.</small></label>
            </div>
          </div>
          <div className="a-grille2">
            <label className="a-champ"><span>Surtitre</span><input type="text" maxLength={40} value={p.surtitre} onChange={(e) => maj('surtitre', e.target.value)} /></label>
            <label className="a-champ"><span>Titre *</span><input type="text" maxLength={80} value={p.titre} onChange={(e) => maj('titre', e.target.value)} /></label>
          </div>
          <label className="a-champ"><span>Texte</span><textarea maxLength={400} value={p.texte} onChange={(e) => maj('texte', e.target.value)} style={{ minHeight: 72 }} /></label>
          {etat && <p className={`a-msg a-msg--${etat.type}`} role="status">{etat.texte}</p>}
          <div className="a-ligne" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="a-btn a-btn--plein" disabled={envoi !== null || !p.titre.trim()} onClick={enregistrer}>{envoi === 'tout' ? 'Enregistrement…' : 'Enregistrer l’en-tête'}</button>
          </div>
        </>
      )}
      {!p && etat && <p className={`a-msg a-msg--${etat.type}`} role="alert">{etat.texte}</p>}
    </section>
  )
}
