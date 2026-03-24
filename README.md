# 🎵 Melodix — Assistant Musical Spotify

Application web moderne pour créer des playlists intelligentes, découvrir des artistes et analyser votre musique.

**Stack :** React · Vite · TypeScript · TailwindCSS  
**Auth :** OAuth 2.0 PKCE (100% frontend, sans backend)  
**Déploiement :** GitHub Pages

---

## 🚀 Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/username/spotify-assistant.git
cd spotify-assistant

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec votre Client ID Spotify

# 4. Lancer le serveur de développement
npm run dev
```

---

## 🎧 Configuration Spotify

### 1. Créer une application Spotify

1. Rendez-vous sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Cliquez **Create App**
3. Remplissez les informations :
   - **App name** : Melodix (ou ce que vous voulez)
   - **App description** : Assistant musical personnel
   - **Redirect URIs** : ajoutez :
     - `http://localhost:5173/callback` (développement)
     - `https://username.github.io/spotify-assistant/callback` (production)
4. Cochez **Web API** dans les APIs utilisées
5. Sauvegardez et copiez votre **Client ID**

### 2. Configurer `.env.local`

```env
VITE_SPOTIFY_CLIENT_ID=votre_client_id_ici
VITE_REDIRECT_URI=http://localhost:5173/callback
```

---

## 🏗️ Structure du projet

```
src/
├── components/
│   ├── ui/          # Composants réutilisables (Button, Badge, Spinner…)
│   ├── layout/      # Navbar, AppLayout
│   ├── TrackCard    # Carte d'un morceau
│   ├── SelectionBar # Barre de sélection + création playlist
│   └── MiniPlayer   # Lecteur audio preview
├── pages/
│   ├── LandingPage         # Page d'accueil
│   ├── CallbackPage        # Retour OAuth Spotify
│   ├── DashboardPage       # Tableau de bord
│   ├── PlaylistCreatorPage # Outil 1 : Créateur
│   ├── ArtistDiscoveryPage # Outil 2 : Découverte
│   └── PlaylistDoctorPage  # Outil 3 : Doctor
├── hooks/
│   ├── useAuth.ts   # Context d'authentification
│   └── usePlayer.ts # Context du player audio
├── services/
│   ├── spotifyAuth.ts # PKCE OAuth flow
│   └── spotifyApi.ts  # Toutes les requêtes API
├── styles/
│   ├── theme.ts    # ← MODIFIEZ ICI pour changer les couleurs/typo
│   └── globals.css # CSS global + utilitaires
├── types/
│   └── spotify.ts  # Types TypeScript
└── utils/
    └── format.ts   # Utilitaires (durée, formatage…)
```

---

## 🎨 Personnalisation du thème

Toutes les valeurs visuelles sont centralisées dans **`src/styles/theme.ts`** :

```ts
export const colors = {
  bg: {
    base:    '#0f0f0f',   // fond principal
    surface: '#1a1a1a',   // cartes
  },
  accent: {
    DEFAULT: '#1DB954',   // couleur principale ← changez ici
    hover:   '#1ed760',
  },
  // ...
}
```

---

## 🌐 Déploiement sur GitHub Pages

### Automatique (GitHub Actions)

1. Allez dans **Settings > Pages** de votre repo
2. Source : **GitHub Actions**
3. Ajoutez les secrets dans **Settings > Secrets** :
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_REDIRECT_URI` = `https://username.github.io/spotify-assistant/callback`
4. Pushez sur `main` → déploiement automatique

### Manuel

```bash
npm run build
# Déployez le dossier dist/ sur votre hébergeur statique
```

### ⚠️ Adapter le nom du repo

Dans `vite.config.ts`, changez :
```ts
const REPO_NAME = 'spotify-assistant' // ← votre nom de repo exact
```

---

## 🛠️ Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

---

## 📝 Notes

- Les previews audio sont des extraits **30 secondes** fournis par Spotify
- Certains morceaux n'ont pas de preview : un lien Spotify est affiché à la place
- L'application nécessite un compte Spotify (gratuit ou premium)
- Aucune donnée utilisateur n'est stockée sur un serveur externe


## ⚙️ Fichier unique à modifier

Pour les petits ajustements, modifiez surtout :

- `app.config.js` → nom de l'app, emoji, description, nom du repo GitHub Pages
- `src/styles/theme.ts` → couleurs, typos, ombres
- `.env.local` → Client ID Spotify, redirect URI, repo name si besoin

### Exemple rapide

```js
export const appConfig = {
  appName: 'Melodix',
  appTagline: 'Assistant Musical Spotify',
  appDescription: '...',
  appEmoji: '🎵',
  repositoryName: 'spotify-assistant',
  githubPagesProject: true,
  footerText: "n'est pas affilié à Spotify AB · Construit avec ❤️ et l'API Spotify",
}
```
