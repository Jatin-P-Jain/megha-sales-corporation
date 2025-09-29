// scripts/generate-sw.ts
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

const envFile = `.env.${process.env.NODE_ENV || "development"}.local`;
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

// Access environment variables
const {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_PROJECT_ID,
  NEXT_PUBLIC_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_APP_ID,
} = process.env;

if (
  !NEXT_PUBLIC_FIREBASE_API_KEY ||
  !NEXT_PUBLIC_PROJECT_ID ||
  !NEXT_PUBLIC_MESSAGING_SENDER_ID ||
  !NEXT_PUBLIC_APP_ID
) {
  console.error(
    "Missing required environment variables for service worker generation.",
  );
  process.exit(1);
}

const swContent = `
// Use the correct Firebase version and imports
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase with environment variables
firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  projectId: "${process.env.NEXT_PUBLIC_PROJECT_ID}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_APP_ID}",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  // console.log("[Service Worker] Background message received", payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new message',
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: 'notification-tag',
    requireInteraction: true,
    data: payload.data || {},
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events  
self.addEventListener('notificationclick', function(event) {
  // console.log('[Service Worker] Notification click received.');
  // console.log('Notification data:', event.notification.data); // Debug log
  
  event.notification.close();
  
  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/';
  // console.log('Opening URL:', urlToOpen); // Debug log
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate ? client.navigate(urlToOpen) : client.postMessage({type: 'NAVIGATE', url: urlToOpen});
        }
      }
      
      // Open new window with specific URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});


// PWA Service Worker events
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if needed
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            // Add cache cleanup logic here if needed
            return null;
          })
        );
      })
    ])
  );
});

self.addEventListener("fetch", (event) => {
  // Add your caching logic here if needed
  // Example: Cache important resources
  /*
  if (event.request.url.includes('/api/')) {
    // Handle API requests
    return;
  }
  
  if (event.request.destination === 'image') {
    // Cache images
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  }
  */
});

// Handle push events (alternative to onBackgroundMessage for more control)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received.');
  
  if (event.data) {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);
    
    const title = data.notification?.title || data.data?.title || 'New Message';
    const options = {
      body: data.notification?.body || data.data?.body || 'You have a new message',
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: data.data?.tag || 'default-tag',
      requireInteraction: true,
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Handle message events from the main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

const outPath = path.resolve(process.cwd(), "public/firebase-messaging-sw.js");
fs.writeFileSync(outPath, swContent.trimStart());
console.log(`✅ Service worker generated at ${outPath}`);
