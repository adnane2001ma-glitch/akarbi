# AKARBI — site de la maison

Site de **AKARBI**, maison marocaine de cuir contemporain. Le site raconte le Chapter 01, *Première trace* : la tannerie de Fès, la veste Signature, l'atelier, le coffret et le cercle ACHIRA, au fil du défilement. Il présente aussi la collection, avec un panier.

> Trust your way.

## Ce que fait le site

- **Récit au défilement :** les vidéos (tannerie, veste, atelier, coffre, ACHIRA) avancent et reculent avec le scroll, sans lecture automatique.
- **Pages :** accueil, produits, fiche produit (vert pétrole / ivoire), ACHIRA, univers AKARBI.
- **Panier :** ajout de produits, quantités, total. Le paiement n'est pas encore branché.
- **Accessibilité :** navigation au clavier, version allégée si l'appareil demande moins d'animations.

## Structure

```
index.html            la page (HTML, CSS et JavaScript dans un seul fichier)
img/                  photos et visuels
vid/                  vidéos du récit (.mp4, et .webm en secours)
font/                 police des titres AKARBI
confidentialite.html  politique de confidentialité (modèle à compléter)
```

Les noms des dossiers `img/`, `vid/` et `font/` ne doivent pas changer : la page les appelle par ces noms.

## Technique

- HTML, CSS et JavaScript, sans framework ni étape de build.
- [GSAP 3.12.5](https://gsap.com/) et ScrollTrigger, chargés depuis cdnjs.
- Polices : AKARBI (fichier local), Cormorant Garamond et Hanken Grotesk (Google Fonts).

## Voir le site en local

Ouvrir `index.html` par double-clic ne suffit pas : le navigateur bloque alors les vidéos et la police. Lancer un petit serveur à la racine du dossier :

```bash
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## Mettre en ligne

Le dossier se déploie tel quel sur Vercel, Netlify ou n'importe quel hébergeur de fichiers statiques.

## Couleurs

| Nom | Hex |
|---|---|
| Vert pétrole | `#0F261F` |
| Bordeaux | `#561020` |
| Ivoire | `#EEE5D3` |
| Rouge marquage | `#510007` |

---

© 2026 AKARBI · Maison marocaine de cuir contemporain
