# Deploiement Firebase Hosting + Firestore - Chorale

Ce dossier est pret a etre pousse dans un depot GitHub. Il contient l'application en `index.html`, les fichiers PWA, la configuration Firebase Hosting, les regles Firestore et un workflow GitHub Actions.

## 1. Ce qu'il faut remplacer

Avant le premier deploiement, remplacez partout `chorale-svs-app-web-v9-3` par l'ID reel de votre projet Firebase, par exemple `chorale-semeur-prod`.

Fichiers concernes :

- `.firebaserc`
- `.github/workflows/firebase-hosting-merge.yml`

Dans `index.html`, cherchez `const FIREBASE_CONFIG = { ... }` et remplacez les valeurs vides par la configuration Web fournie par Firebase Console.

## 2. Creer le projet Firebase

1. Aller sur https://console.firebase.google.com/
2. Cliquer sur `Ajouter un projet`.
3. Choisir un nom, par exemple `Chorale Semeur`.
4. Noter l'ID du projet, par exemple `chorale-semeur-prod`.
5. Dans `Build > Firestore Database`, creer une base Firestore en mode production.
6. Dans `Build > Authentication > Sign-in method`, activer `Anonymous` pour le demarrage simple.
7. Dans `Parametres du projet > General > Vos applications`, creer une application Web.
8. Copier la configuration `firebaseConfig` dans le bloc `FIREBASE_CONFIG` de `index.html`.

## 3. Commandes locales utiles

Installer Firebase CLI si necessaire :

```bash
npm install -g firebase-tools
```

Connexion au compte Google Firebase :

```bash
firebase login
```

Verifier ou selectionner le projet :

```bash
firebase projects:list
firebase use chorale-svs-app-web-v9-3
```

Deployer les regles Firestore et le site :

```bash
firebase deploy --only hosting,firestore
```

Apres deploiement, l'URL publique sera generalement :

```text
https://chorale-svs-app-web-v9-3.web.app
```

## 4. Initialisation Firebase depuis zero

Si vous voulez refaire l'initialisation avec l'assistant Firebase CLI :

```bash
firebase init hosting
```

Choix recommandes :

- Public directory: `.`
- Configure as a single-page app: `No`
- Set up automatic builds and deploys with GitHub: `Yes` si vous voulez que Firebase cree le workflow automatiquement
- Overwrite index.html: `No`

Puis :

```bash
firebase init firestore
```

Choix recommandes :

- Rules file: `firestore.rules`
- Indexes file: `firestore.indexes.json`

## 5. Connecter GitHub Actions a Firebase Hosting

Methode la plus simple :

```bash
firebase init hosting:github
```

L'assistant va :

1. vous connecter a GitHub ;
2. choisir le depot ;
3. creer un compte de service Firebase ;
4. ajouter un secret GitHub ;
5. creer ou mettre a jour les workflows GitHub Actions.

Si vous utilisez le workflow fourni dans `.github/workflows/firebase-hosting-merge.yml`, creez dans GitHub :

- `Settings > Secrets and variables > Actions > New repository secret`
- Nom du secret : `FIREBASE_SERVICE_ACCOUNT`
- Valeur : le JSON du compte de service Firebase autorise a deployer Hosting.

Remplacez aussi `projectId: chorale-svs-app-web-v9-3` par votre vrai ID projet.

## 6. Workflow quotidien sans ligne de commande

Une fois Firebase et GitHub Actions configures :

1. Ouvrir le depot GitHub dans le navigateur.
2. Cliquer sur `Add file > Upload files`.
3. Televerser le nouveau `index.html` a la racine du depot.
4. Valider avec `Commit changes` sur la branche `main`.
5. GitHub Actions deploie automatiquement Firebase Hosting.
6. Quelques minutes apres, le site est mis a jour sur `https://chorale-svs-app-web-v9-3.web.app`.

## 7. Donnees en ligne et temps reel

L'application utilise maintenant :

- `localStorage` comme sauvegarde locale immediate ;
- Firestore comme base partagee si `FIREBASE_CONFIG` est renseigne ;
- le document central `chorale/data/documents/main` pour stocker l'objet `Store.data` complet ;
- une ecoute temps reel `onSnapshot` pour rafraichir les autres utilisateurs.

Si Firebase est indisponible, l'application continue en local et affiche un statut d'erreur de synchronisation.

## 8. Securite par roles

Le fichier `firestore.rules` fourni est volontairement pratique pour le premier deploiement : tout utilisateur authentifie par Firebase Auth peut lire/ecrire le document central. Activez donc au minimum Firebase Authentication, methode `Anonymous`.

Pour une vraie securite Admin / Bureau / Choriste :

1. Creer des comptes Firebase Auth pour les utilisateurs.
2. Attribuer des custom claims cote serveur, par exemple `{ role: "admin" }`, `{ role: "bureau" }`, `{ role: "choriste" }`.
3. Remplacer `firestore.rules` par `firestore.rules.roles-strict.example`.
4. A moyen terme, decouper `Store.data` en collections Firestore separees (`membres`, `paiements`, `suggestions`, etc.) pour pouvoir autoriser finement les actions des choristes.

Important : le role choisi dans l'interface actuelle reste utile pour l'affichage et les permissions internes, mais il ne suffit pas a securiser Firestore. Les regles Firestore ne doivent faire confiance qu'a Firebase Auth et aux custom claims.
