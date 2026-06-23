// ============================================================
// firebase-messaging-sw.js
// Service Worker Firebase Cloud Messaging — SVS-EEI
// Placer ce fichier à la RACINE du projet (même niveau que index.html)
// NE PAS modifier ce fichier lors des mises à jour de l'application
// ============================================================

// ── Importer les SDK Firebase compat (requis dans un SW) ──
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── Configuration Firebase ──
// Ces valeurs doivent être identiques à celles de firebase-config.js
// Mettre à jour ici si vous changez de projet Firebase
const firebaseConfig = {
  apiKey:            "AIzaSyARm828relinxQ_1uoKebDHG1WOog4mRt0",
  authDomain:        "chorale-svs-app-web-v9-3.firebaseapp.com",
  databaseURL:       "https://chorale-svs-app-web-v9-3-default-rtdb.firebaseio.com",
  projectId:         "chorale-svs-app-web-v9-3",
  storageBucket:     "chorale-svs-app-web-v9-3.firebasestorage.app",
  messagingSenderId: "497628233660",
  appId:             "1:497628233660:web:f45d82e23ca07ad609b5b9"
};

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

// ── Notification reçue quand l'app est FERMÉE ou en ARRIÈRE-PLAN ──
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notification reçue en arrière-plan :', payload);

  const title = payload.notification?.title || 'SVS-EEI';
  const body  = payload.notification?.body  || '';
  const icon  = payload.notification?.icon  || '/icons/icon-192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'svs-eei-notif',
    renotify: true,
    data: payload.data || {},
  });
});

// ── Clic sur la notification → ouvre l'app ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
