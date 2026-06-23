// ============================================================
// notifications.js — SVS-EEI
// Gestion des notifications push (anniversaires, répétitions, annonces)
// Lier à index.html avec UNE SEULE ligne (voir bas du fichier)
// NE PAS modifier ce fichier lors des mises à jour de l'application
// ============================================================

// ── Clé VAPID ──
// À récupérer dans : Firebase Console → Project Settings → Cloud Messaging
// → Web Push certificates → Generate key pair → copier la clé
const VAPID_KEY = 'oVTlQdzWSPLgMlfbZFgrq6nmy9BMamcFIxQ7f_WytiA';

// ── Délai avant proposition (ms) ──
// L'app attend 5 secondes après connexion pour proposer les notifs
const DELAI_PROPOSITION = 5000;

// ══════════════════════════════════════════════════════════════
// INITIALISATION — s'exécute au chargement de la page
// ══════════════════════════════════════════════════════════════
(function initNotifications() {
  // Vérifier que le navigateur supporte les notifications
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.info('[Notifs] Non supportées sur cet appareil/navigateur.');
    return;
  }

  // Attendre que l'app SVS-EEI soit prête (variable globale Permissions)
  const attendre = setInterval(() => {
    if (typeof Permissions === 'undefined' || typeof Store === 'undefined') return;
    clearInterval(attendre);
    onAppPrete();
  }, 500);
})();

// ── Appelée quand l'app est chargée et l'utilisateur connecté ──
function onAppPrete() {
  // Enregistrer le service worker Firebase Messaging
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.info('[Notifs] Service Worker enregistré :', registration.scope);
    })
    .catch((err) => console.warn('[Notifs] Erreur SW :', err));

  // Proposer les notifications après connexion
  proposerActivationApresConnexion();

  // Programmer les vérifications automatiques
  demarrerVerificationsAutomatiques();
}

// ══════════════════════════════════════════════════════════════
// DEMANDE DE PERMISSION
// ══════════════════════════════════════════════════════════════
async function demanderPermission() {
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;

  const resultat = await Notification.requestPermission();
  return resultat === 'granted';
}

// Affiche un bandeau discret et propose d'activer les notifs
function proposerActivationApresConnexion() {
  // Ne proposer que si pas encore répondu
  if (Notification.permission !== 'default') return;
  if (localStorage.getItem('svs_notifs_refused')) return;

  setTimeout(() => {
    // Vérifier que l'utilisateur est connecté
    if (typeof Permissions === 'undefined' || !Permissions.role) return;

    const banniere = document.createElement('div');
    banniere.id = 'notif-activation-banner';
    banniere.style.cssText = `
      position:fixed; bottom:80px; left:12px; right:12px; z-index:9999;
      background:#2d1b0e; color:#faf1d6; border-radius:14px;
      padding:14px 16px; box-shadow:0 4px 24px rgba(0,0,0,0.35);
      display:flex; align-items:flex-start; gap:12px; font-family:inherit;
    `;
    banniere.innerHTML = `
      <span style="font-size:1.5rem;line-height:1;">🔔</span>
      <div style="flex:1;">
        <div style="font-weight:700;margin-bottom:4px;">Activer les notifications</div>
        <div style="font-size:0.82rem;opacity:0.8;margin-bottom:10px;">
          Recevez les rappels de répétitions, anniversaires et annonces importantes.
        </div>
        <div style="display:flex;gap:8px;">
          <button id="btn-notif-oui" style="
            background:#c8972b;color:#fff;border:none;border-radius:8px;
            padding:8px 16px;font-weight:700;cursor:pointer;font-size:0.85rem;">
            Activer
          </button>
          <button id="btn-notif-non" style="
            background:rgba(255,255,255,0.15);color:#faf1d6;border:none;
            border-radius:8px;padding:8px 14px;cursor:pointer;font-size:0.85rem;">
            Plus tard
          </button>
        </div>
      </div>
      <button id="btn-notif-close" style="
        background:none;border:none;color:#faf1d6;cursor:pointer;
        font-size:1.2rem;opacity:0.6;padding:0;margin-top:-2px;">✕</button>
    `;

    document.body.appendChild(banniere);

    document.getElementById('btn-notif-oui').addEventListener('click', async () => {
      banniere.remove();
      const ok = await activerNotifications();
      if (ok) afficherNotifLocale('✅ Notifications activées', 'Vous recevrez désormais les rappels SVS-EEI.');
    });

    document.getElementById('btn-notif-non').addEventListener('click', () => {
      banniere.remove();
      localStorage.setItem('svs_notifs_refused', Date.now());
    });

    document.getElementById('btn-notif-close').addEventListener('click', () => {
      banniere.remove();
    });
  }, DELAI_PROPOSITION);
}

async function activerNotifications() {
  const ok = await demanderPermission();
  if (!ok) {
    alert('Notifications refusées. Vous pouvez les réactiver dans les paramètres de votre navigateur.');
    return false;
  }

  // Sauvegarder le token FCM localement (sera utilisé par Firebase Functions)
  try {
    // Import dynamique — fonctionne seulement si firebase-config.js est chargé
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      const messaging = firebase.messaging();
      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      if (token) {
        localStorage.setItem('svs_fcm_token', token);
        console.info('[Notifs] Token FCM enregistré');
        // Si Firestore est disponible, sauvegarder en ligne
        sauvegarderTokenFirestore(token);
      }
    }
  } catch (e) {
    console.warn('[Notifs] Impossible de récupérer le token FCM :', e);
  }

  return true;
}

async function sauvegarderTokenFirestore(token) {
  try {
    if (typeof firestore === 'undefined') return;
    const membreId = Permissions.choristeMembreId || Permissions.role || 'inconnu';
    const nom = Store.getMembre?.(membreId)?.nom || '';
    await firestore.collection('fcmTokens').doc(membreId).set({
      token,
      nom,
      role: Permissions.role,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[Notifs] Firestore non disponible, token non sauvegardé en ligne :', e);
  }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS LOCALES (sans serveur — fonctionnent offline)
// Ces vérifications tournent dans l'app ouverte
// ══════════════════════════════════════════════════════════════
function afficherNotifLocale(titre, corps, icone) {
  if (Notification.permission !== 'granted') return;
  new Notification(titre, {
    body: corps,
    icon: icone || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  });
}

// ── Vérifications automatiques ──
function demarrerVerificationsAutomatiques() {
  // Vérification immédiate au démarrage
  setTimeout(verifierTout, 3000);

  // Puis toutes les heures
  setInterval(verifierTout, 60 * 60 * 1000);
}

function verifierTout() {
  if (Notification.permission !== 'granted') return;
  verifierAnniversaires();
  verifierRepetitionsDemain();
  verifierActivitesDemain();
}

function verifierAnniversaires() {
  if (!Store?.data?.membres) return;
  const cle = 'svs_notif_anniv_' + Utils.todayISO();
  if (localStorage.getItem(cle)) return; // déjà notifié aujourd'hui

  const maintenant = new Date();
  const mois = maintenant.getMonth();
  const jour = maintenant.getDate();

  const annivAujourdhui = Store.data.membres.filter(m => {
    if (!m.dateNaissance) return false;
    const dob = new Date(m.dateNaissance);
    return dob.getMonth() === mois && dob.getDate() === jour;
  });

  if (annivAujourdhui.length > 0) {
    const noms = annivAujourdhui.map(m => m.nom).join(', ');
    afficherNotifLocale(
      '🎂 Anniversaire aujourd\'hui !',
      `Souhaitons un joyeux anniversaire à : ${noms}`
    );
    localStorage.setItem(cle, '1'); // éviter les doublons
  }
}

function verifierRepetitionsDemain() {
  if (!Store?.data?.repetitions) return;
  const cle = 'svs_notif_rep_' + Utils.todayISO();
  if (localStorage.getItem(cle)) return;

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  const dateDemain = demain.toISOString().slice(0, 10);

  const reps = Store.data.repetitions.filter(r =>
    r.date === dateDemain && r.statut !== 'Annulée'
  );

  if (reps.length > 0) {
    const rep = reps[0];
    afficherNotifLocale(
      '📅 Répétition demain',
      `${rep.type || 'Répétition'} le ${dateDemain}${rep.heure ? ' à ' + rep.heure : ''}${rep.lieu ? ' — ' + rep.lieu : ''}`
    );
    localStorage.setItem(cle, '1');
  }
}

function verifierActivitesDemain() {
  if (!Store?.data?.activites) return;
  const cle = 'svs_notif_act_' + Utils.todayISO();
  if (localStorage.getItem(cle)) return;

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  const dateDemain = demain.toISOString().slice(0, 10);

  const activites = Store.data.activites.filter(a =>
    a.date === dateDemain && a.statut === 'Prévue'
  );

  if (activites.length > 0) {
    const act = activites[0];
    afficherNotifLocale(
      '🗓️ Activité demain',
      `${act.type || 'Activité'} prévue demain${act.lieu ? ' — ' + act.lieu : ''}`
    );
    localStorage.setItem(cle, '1');
  }
}

// ══════════════════════════════════════════════════════════════
// FONCTION PUBLIQUE — utilisable depuis l'app pour envoyer
// une notification manuelle immédiate (ex: annonce d'urgence)
// Appel : SVSNotifications.envoyer('Titre', 'Message');
// ══════════════════════════════════════════════════════════════
window.SVSNotifications = {
  envoyer: afficherNotifLocale,
  activer: activerNotifications,
  verifier: verifierTout,
};

console.info('[SVS-EEI] Module notifications chargé ✅');
