'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PRODUIT_VIDE, RUBRIQUES_PAR_DEFAUT, type Produit } from '@/lib/catalogue'
import { FAMILLES, trierSelections, type Selection } from '@/lib/heritage'
import Entete from '../../Entete'
import { api, CATEGORIES, envoyerPhoto, GAMMES_TAILLES, slug } from '../../outils'

export default function EditeurProduit() {
  const { id } = useParams<{ id: string }>()
  const nouveau = id === 'nouveau'
  const router = useRouter()
  const [p, setP] = useState<Produit | null>(nouveau ? { ...PRODUIT_VIDE } : null)
  const [tous, setTous] = useState<Produit[]>([])
  const [idManuel, setIdManuel] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [photosEnCours, setPhotosEnCours] = useState(0)
  const [tailleLibre, setTailleLibre] = useState('')
  const [selections, setSelections] = useState<Selection[] | null>(null)
  const [erreurHeritage, setErreurHeritage] = useState('')

  useEffect(() => {
    api<Selection[]>('/api/admin/heritage').then((l) => setSelections(trierSelections(l))).catch((e) => setErreurHeritage(e.message))
  }, [])

  useEffect(() => {
    api<Produit[]>('/api/admin/produits')
      .then((liste) => {
        setTous(liste)
        if (nouveau) {
          setP((x) => ({ ...x!, ordre: Math.max(0, ...liste.map((y) => y.ordre)) + 10, ordre_femme: Math.max(0, ...liste.map((y) => y.ordre_femme ?? y.ordre)) + 10 }))
        } else {
          const trouve = liste.find((y) => y.id === id)
          if (trouve) setP(trouve)
          else setErreur('Ce produit n’existe pas ou a été supprimé.')
        }
      })
      .catch((e) => setErreur(e.message))
  }, [id, nouveau])

  const categories = useMemo(() => [...new Set([...CATEGORIES, ...tous.map((x) => x.categorie).filter(Boolean)])], [tous])
  const noms = useMemo(() => [...new Set(tous.map((x) => x.nom))], [tous])

  if (!p) {
    return (
      <>
        <Entete />
        <main className="a-wrap">{erreur ? <p className="a-msg a-msg--erreur" style={{ marginTop: 40 }}>{erreur}</p> : <p className="a-aide" style={{ marginTop: 40 }}>Chargement…</p>}</main>
      </>
    )
  }

  const maj = <K extends keyof Produit>(k: K, v: Produit[K]) =>
    setP((x) => {
      const n = { ...x!, [k]: v }
      if (nouveau && !idManuel && (k === 'nom' || k === 'coloris')) n.id = slug(`${n.nom} ${n.coloris}`)
      return n
    })

  const toutesTailles = GAMMES_TAILLES.flatMap((g) => g.tailles)
  const trierTailles = (l: string[]) =>
    [...l].sort((a, b) => {
      const ia = toutesTailles.indexOf(a), ib = toutesTailles.indexOf(b)
      return (ia < 0 ? 1e3 : ia) - (ib < 0 ? 1e3 : ib)
    })
  const basculerTaille = (t: string) => maj('tailles', p.tailles.includes(t) ? p.tailles.filter((x) => x !== t) : trierTailles([...p.tailles, t]))
  const ajouterTailleLibre = () => {
    const t = tailleLibre.trim().slice(0, 16)
    if (t && !p.tailles.includes(t)) maj('tailles', [...p.tailles, t])
    setTailleLibre('')
  }

  async function ajouterPhotos(fichiers: FileList | null) {
    if (!fichiers?.length) return
    setErreur('')
    const liste = [...fichiers].slice(0, 20 - p!.photos.length)
    setPhotosEnCours(liste.length)
    for (const f of liste) {
      try {
        const url = await envoyerPhoto(f)
        setP((x) => ({ ...x!, photos: [...x!.photos, { url, alt: '' }] }))
      } catch (e) {
        setErreur(`${f.name} : ${(e as Error).message}`)
      }
      setPhotosEnCours((n) => n - 1)
    }
  }
  const deplacerPhoto = (i: number, d: number) => {
    const l = [...p.photos]
    ;[l[i], l[i + d]] = [l[i + d], l[i]]
    maj('photos', l)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    try {
      if (nouveau) await api('/api/admin/produits', { method: 'POST', body: JSON.stringify(p) })
      else await api(`/api/admin/produits/${p!.id}`, { method: 'PUT', body: JSON.stringify(p) })
      router.push('/admin')
    } catch (err) {
      setErreur((err as Error).message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnvoi(false)
    }
  }

  const freres = tous.filter((x) => x.nom === p.nom && x.id !== p.id)

  return (
    <>
      <Entete />
      <main className="a-wrap">
        <p style={{ marginTop: 28 }}><Link href="/admin" className="a-aide">← Retour aux pièces</Link></p>
        <h1 className="a-h1" style={{ marginTop: 8 }}>{nouveau ? 'Nouveau produit' : `${p.nom}${p.coloris ? ' — ' + p.coloris : ''}`}</h1>
        <p className="a-sous">Les champs laissés vides n’apparaissent pas sur la fiche produit.</p>

        {erreur && <p className="a-msg a-msg--erreur" role="alert" style={{ marginBottom: 20 }}>{erreur}</p>}

        <form className="a-pile" style={{ gap: 24 }} onSubmit={enregistrer}>
          <section className="a-carte a-pile">
            <h2 className="a-h2">L’essentiel</h2>
            <div className="a-grille2">
              <label className="a-champ">
                <span>Nom du produit *</span>
                <input type="text" required maxLength={80} list="noms" value={p.nom} onChange={(e) => maj('nom', e.target.value)} placeholder="Veste Signature" />
                <datalist id="noms">{noms.map((n) => <option key={n} value={n} />)}</datalist>
                <small>Les produits qui portent exactement le même nom sont proposés comme coloris d’une même pièce.</small>
              </label>
              <label className="a-champ">
                <span>Coloris / variante</span>
                <input type="text" maxLength={60} value={p.coloris} onChange={(e) => maj('coloris', e.target.value)} placeholder="Pétrole, Argent, Noir…" />
                {freres.length > 0 && <small>Autres coloris de cette pièce : {freres.map((x) => x.coloris || x.id).join(', ')}</small>}
              </label>
              <label className="a-champ">
                <span>Nom affiché dans la collection</span>
                <input type="text" maxLength={120} value={p.nom_carte} onChange={(e) => maj('nom_carte', e.target.value)} placeholder={p.nom || 'Veste Signature en cuir embossé'} />
                <small>Facultatif. Sur les cartes de la collection, à la place du nom (le coloris est ajouté après).</small>
              </label>
              <label className="a-champ">
                <span>Catégorie</span>
                <input type="text" maxLength={40} list="categories" value={p.categorie} onChange={(e) => maj('categorie', e.target.value)} placeholder="Vestes, T-shirts, Bagues…" />
                <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                <small>Choisis dans la liste ou écris une nouvelle catégorie.</small>
              </label>
              <label className="a-champ">
                <span>Collection</span>
                <input type="text" maxLength={80} value={p.collection} onChange={(e) => maj('collection', e.target.value)} placeholder="Chapter 01 — Première trace" />
                <small>Affichée au-dessus du nom sur la fiche produit.</small>
              </label>
              <label className="a-champ">
                <span>Étiquette sur la photo</span>
                <input type="text" maxLength={30} value={p.etiquette} onChange={(e) => maj('etiquette', e.target.value)} placeholder="Nouveauté, Édition limitée, Épuisé…" />
              </label>
              <label className="a-champ">
                <span>Adresse de la page</span>
                <input type="text" maxLength={60} value={p.id} disabled={!nouveau} onChange={(e) => { setIdManuel(true); maj('id', slug(e.target.value)) }} />
                <small>{nouveau ? 'Créée automatiquement à partir du nom. Elle ne pourra plus changer ensuite.' : 'Ne peut plus être modifiée.'} akarbi.fr/akarbi/#/produit/{p.id || '…'}</small>
              </label>
            </div>
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Prix</h2>
            <div className="a-grille2">
              <label className="a-champ">
                <span>Prix en euros (€)</span>
                <input type="number" min={0} step="0.01" inputMode="decimal" value={p.prix_eur ?? ''} onChange={(e) => maj('prix_eur', e.target.value === '' ? null : Number(e.target.value))} placeholder="320" />
              </label>
              <label className="a-champ">
                <span>Prix en dirhams (MAD)</span>
                <input type="number" min={0} step="0.01" inputMode="decimal" value={p.prix_mad ?? ''} onChange={(e) => maj('prix_mad', e.target.value === '' ? null : Number(e.target.value))} placeholder="3500" />
              </label>
            </div>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Tailles proposées</h2>
              <p className="a-aide" style={{ margin: 0 }}>Seules les tailles sélectionnées s’affichent sur la fiche produit. Sans taille, le client ajoute directement au panier.</p>
            </div>
            {GAMMES_TAILLES.map((g) => (
              <div key={g.nom} className="a-pile" style={{ gap: 8 }}>
                <span className="a-aide">{g.nom}</span>
                <div className="a-puces">
                  {g.tailles.map((t) => (
                    <button key={t} type="button" className="a-puce" aria-pressed={p.tailles.includes(t)} onClick={() => basculerTaille(t)}>{t}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="a-ligne">
              <input type="text" maxLength={16} value={tailleLibre} onChange={(e) => setTailleLibre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterTailleLibre() } }} placeholder="Autre taille (ex. W32, 52 cm)" style={{ maxWidth: 260 }} />
              <button type="button" className="a-btn" onClick={ajouterTailleLibre}>Ajouter</button>
            </div>
            <p className="a-aide" style={{ margin: 0 }}>
              Sélection : {p.tailles.length ? p.tailles.map((t) => (
                <button key={t} type="button" className="a-puce" aria-pressed="true" style={{ marginRight: 6 }} onClick={() => basculerTaille(t)} title="Retirer">{t} ✕</button>
              )) : 'aucune taille'}
            </p>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Photos</h2>
              <p className="a-aide" style={{ margin: 0 }}>La 1re photo s’affiche dans la collection, la 2e apparaît au survol. Formats verticaux 4:5 conseillés. Elles sont réduites automatiquement avant l’envoi.</p>
            </div>
            <div className="a-photos">
              {p.photos.map((ph, i) => (
                <div key={ph.url} className="a-photo">
                  <div className="a-photo__img">
                    <img src={ph.url} alt="" />
                    {i < 2 && <span className="a-photo__role">{i === 0 ? 'Principale' : 'Au survol'}</span>}
                  </div>
                  <div className="a-ligne" style={{ gap: 6 }}>
                    <button type="button" className="a-btn a-btn--icone" aria-label="Avancer" disabled={i === 0} onClick={() => deplacerPhoto(i, -1)}>←</button>
                    <button type="button" className="a-btn a-btn--icone" aria-label="Reculer" disabled={i === p.photos.length - 1} onClick={() => deplacerPhoto(i, 1)}>→</button>
                    <button type="button" className="a-btn a-btn--icone a-btn--danger" aria-label="Retirer la photo" onClick={() => maj('photos', p.photos.filter((_, k) => k !== i))}>✕</button>
                  </div>
                  <input type="text" maxLength={200} value={ph.alt} placeholder="Description de la photo" onChange={(e) => maj('photos', p.photos.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} />
                </div>
              ))}
              {p.photos.length < 20 && (
                <label className="a-ajout" style={{ position: 'relative' }}>
                  {photosEnCours ? `Envoi de ${photosEnCours} photo${photosEnCours > 1 ? 's' : ''}…` : '+ Ajouter des photos'}
                  <input type="file" accept="image/*" multiple disabled={photosEnCours > 0} onChange={(e) => { ajouterPhotos(e.target.files); e.target.value = '' }} />
                </label>
              )}
            </div>
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Pastille de couleur</h2>
            <div className="a-ligne">
              <input type="color" value={p.couleur} onChange={(e) => maj('couleur', e.target.value)} aria-label="Couleur principale" />
              <label className="a-case"><input type="checkbox" checked={!!p.couleur2} onChange={(e) => maj('couleur2', e.target.checked ? '#5a1020' : null)} /> Deux couleurs</label>
              {p.couleur2 && <input type="color" value={p.couleur2} onChange={(e) => maj('couleur2', e.target.value)} aria-label="Deuxième couleur" />}
              <span className="a-pastille" style={{ background: p.couleur2 ? `linear-gradient(180deg,${p.couleur} 50%,${p.couleur2} 50%)` : p.couleur }} aria-hidden="true" />
              <span className="a-aide">Aperçu</span>
            </div>
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Textes de la fiche produit</h2>
            <label className="a-champ">
              <span>Description</span>
              <textarea maxLength={3000} value={p.description} onChange={(e) => maj('description', e.target.value)} placeholder="L’histoire de la pièce, ce qui la rend unique…" />
            </label>
            <label className="a-champ">
              <span>Détails (un par ligne)</span>
              <textarea value={p.details.join('\n')} onChange={(e) => maj('details', e.target.value.split('\n'))} placeholder={'Cuir vert pétrole, embossé grain croco\nZip central argenté'} style={{ minHeight: 130 }} />
            </label>
            <div className="a-pile" style={{ gap: 12 }}>
              <span className="a-aide">Rubriques dépliables (Matière et entretien, Guide des tailles, Livraison…). Une rubrique sans texte n’est pas affichée.</span>
              {p.rubriques.map((r, i) => (
                <div key={i} className="a-pile" style={{ gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--ligne)' }}>
                  <div className="a-ligne">
                    <input type="text" maxLength={60} value={r.titre} placeholder="Titre de la rubrique" style={{ flex: 1, minWidth: 180 }} onChange={(e) => maj('rubriques', p.rubriques.map((x, k) => (k === i ? { ...x, titre: e.target.value } : x)))} />
                    <button type="button" className="a-btn a-btn--icone" aria-label="Monter" disabled={i === 0} onClick={() => { const l = [...p.rubriques]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; maj('rubriques', l) }}>↑</button>
                    <button type="button" className="a-btn a-btn--icone a-btn--danger" aria-label="Supprimer la rubrique" onClick={() => maj('rubriques', p.rubriques.filter((_, k) => k !== i))}>✕</button>
                  </div>
                  <textarea maxLength={3000} value={r.texte} placeholder="Texte de la rubrique" onChange={(e) => maj('rubriques', p.rubriques.map((x, k) => (k === i ? { ...x, texte: e.target.value } : x)))} />
                </div>
              ))}
              <div className="a-ligne">
                {p.rubriques.length < 10 && <button type="button" className="a-btn" onClick={() => maj('rubriques', [...p.rubriques, { titre: '', texte: '' }])}>+ Ajouter une rubrique</button>}
                {RUBRIQUES_PAR_DEFAUT.filter((d) => !p.rubriques.some((r) => r.titre === d.titre)).map((d) => (
                  <button key={d.titre} type="button" className="a-btn" onClick={() => maj('rubriques', [...p.rubriques, { ...d }])}>+ {d.titre}</button>
                ))}
              </div>
            </div>
            <label className="a-champ">
              <span>Petite note sous le bouton</span>
              <input type="text" maxLength={300} value={p.note} onChange={(e) => maj('note', e.target.value)} placeholder="Ex. Pièce numérotée, série de 50." />
            </label>
          </section>

          <section className="a-carte a-pile">
            <div>
              <h2 className="a-h2">Héritage</h2>
              <p className="a-aide" style={{ margin: 0 }}>Les sélections dont cette pièce s’inspire. Elles apparaissent sur la fiche produit (« Inspirée de… ») et la pièce apparaît sur leur page.</p>
            </div>
            {erreurHeritage && <p className="a-aide" style={{ margin: 0 }}>{erreurHeritage}</p>}
            {selections?.length === 0 && <p className="a-aide" style={{ margin: 0 }}>Aucune sélection pour l’instant. <Link href="/admin/heritage/nouveau">Créer une sélection</Link>.</p>}
            {selections && FAMILLES.map((f) => {
              const liste = selections.filter((x) => x.famille === f.id)
              if (!liste.length) return null
              return (
                <div key={f.id} className="a-pile" style={{ gap: 8 }}>
                  <span className="a-aide">{f.nom}</span>
                  <div className="a-puces">
                    {liste.map((x) => {
                      const actif = (p.heritage ?? []).includes(x.id)
                      return (
                        <button key={x.id} type="button" className="a-puce" aria-pressed={actif} title={x.publie ? undefined : 'Sélection masquée sur le site'}
                          onClick={() => maj('heritage', actif ? p.heritage.filter((h) => h !== x.id) : [...(p.heritage ?? []), x.id])}>
                          {x.titre}{x.publie ? '' : ' (masquée)'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="a-carte a-pile">
            <h2 className="a-h2">Où l’afficher</h2>
            <div className="a-ligne" style={{ gap: 24 }}>
              <label className="a-case"><input type="checkbox" checked={p.homme} onChange={(e) => maj('homme', e.target.checked)} /> Onglet Homme</label>
              <label className="a-case"><input type="checkbox" checked={p.femme} onChange={(e) => maj('femme', e.target.checked)} /> Onglet Femme</label>
              <label className="a-case"><input type="checkbox" checked={p.publie} onChange={(e) => maj('publie', e.target.checked)} /> <b>Visible sur le site</b></label>
            </div>
            {!p.publie && <p className="a-aide" style={{ margin: 0 }}>Le produit est enregistré mais reste invisible pour les visiteurs tant que cette case n’est pas cochée.</p>}
          </section>

          <div className="a-barre-bas">
            <Link href="/admin" className="a-btn">Annuler</Link>
            <button className="a-btn a-btn--plein" disabled={envoi || photosEnCours > 0}>{envoi ? 'Enregistrement…' : nouveau ? 'Créer le produit' : 'Enregistrer'}</button>
          </div>
        </form>
      </main>
    </>
  )
}
