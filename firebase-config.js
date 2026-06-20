// ════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION — SVS-EEI Chorale App
// ════════════════════════════════════════════════════════════════
//
// Ce fichier contient la configuration Firebase du projet.
// Ne jamais l'écraser lors des mises à jour de l'application principale.
// Pour mettre à jour la config, modifier uniquement cet objet firebaseConfig.
//
// ════════════════════════════════════════════════════════════════

// SDK Firebase (compat — chargé via CDN dans index.html)
// Compatible avec firebase-app-compat.js

const firebaseConfig = {
  apiKey:            "AIzaSyARm828relinxQ_1uoKebDHG1WOog4mRt0",
  authDomain:        "chorale-svs-app-web-v9-3.firebaseapp.com",
  databaseURL:       "https://chorale-svs-app-web-v9-3-default-rtdb.firebaseio.com",
  projectId:         "chorale-svs-app-web-v9-3",
  storageBucket:     "chorale-svs-app-web-v9-3.firebasestorage.app",
  messagingSenderId: "497628233660",
  appId:             "1:497628233660:web:f45d82e23ca07ad609b5b9"
};

// Initialisation Firebase (uniquement si le SDK compat est chargé)
(function () {
  if (typeof firebase === 'undefined') {
    // Mode local uniquement — l'app fonctionne sans Firebase.
    console.info('[firebase-config] SDK Firebase non détecté — mode local uniquement.');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.info('[firebase-config] Firebase initialisé avec succès.');
    } else {
      console.info('[firebase-config] Firebase déjà initialisé.');
    }
    window.__firebaseApp__    = firebase.app();
    window.__firebaseConfig__ = firebaseConfig;
  } catch (err) {
    console.error('[firebase-config] Erreur initialisation Firebase :', err);
  }
})();
