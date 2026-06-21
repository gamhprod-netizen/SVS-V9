// ════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION — SVS-EEI Chorale App
// SDK Modulaire v10 (ES Modules)
// ════════════════════════════════════════════════════════════════

import { initializeApp }                             from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Configuration Firebase ───────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyARm828relinxQ_1uoKebDHG1WOog4mRt0",
  authDomain:        "chorale-svs-app-web-v9-3.firebaseapp.com",
  databaseURL:       "https://chorale-svs-app-web-v9-3-default-rtdb.firebaseio.com",
  projectId:         "chorale-svs-app-web-v9-3",
  storageBucket:     "chorale-svs-app-web-v9-3.firebasestorage.app",
  messagingSenderId: "497628233660",
  appId:             "1:497628233660:web:f45d82e23ca07ad609b5b9"
};

try {
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  // Persistence hors-ligne (fonctionne même sans réseau)
  enableIndexedDbPersistence(db).catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Persistence désactivée (plusieurs onglets ouverts).');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Persistence non supportée par ce navigateur.');
    }
  });

  // Exposer globalement AVANT l'événement
  window.__firebase__ = { app, db };

  // ✅ Signaler à index.html que Firebase est prêt
  // (résout le problème de timing entre type="module" et DOMContentLoaded)
  window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { db } }));
  console.info('[Firebase] Initialisé et prêt.');

} catch (err) {
  console.error('[Firebase] Erreur d\'initialisation :', err);
  // Signaler l'échec pour que l'app bascule en mode local
  window.dispatchEvent(new CustomEvent('firebase-error', { detail: { err } }));
}
