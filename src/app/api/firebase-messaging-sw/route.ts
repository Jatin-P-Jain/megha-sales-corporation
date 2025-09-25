import { NextResponse } from "next/server";

export async function GET() {
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

// // Handle background messages
// messaging.onBackgroundMessage(function (payload) {
//   console.log("[Service Worker] Background message received", payload);
  
//   const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
//   const notificationOptions = {
//     body: payload.notification?.body || payload.data?.body || 'You have a new message',
//     icon: "/icons/icon-192x192.png",
//     badge: "/icons/icon-192x192.png",
//     tag: 'notification-tag',
//     requireInteraction: true,
//     // Store all data for click handling
//     data: {
//       url: payload.data?.url || payload.fcm_options?.link || '/',
//       clickAction: payload.data?.click_action,
//       ...payload.data // Include all custom data
//     },
//     actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// Handle notification click events with deep linking
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  console.log('[Service Worker] Event action:', event.action);
  console.log('[Service Worker] Notification data:', event.notification.data);
  
  // Close the notification
  event.notification.close();
  
  // Get the URL to open
  let urlToOpen = '/'; // Default fallback
  
  // Handle action button clicks vs main notification click
  if (event.action) {
    console.log('[Service Worker] Notification action clicked:', event.action);
    // Handle specific action buttons
    switch (event.action) {
      case 'view':
        urlToOpen = event.notification.data?.url || '/';
        break;
      case 'dismiss':
        console.log('[Service Worker] Notification dismissed');
        return; // Don't open anything, just return
      default:
        urlToOpen = event.notification.data?.url || '/';
        break;
    }
  } else {
    // Main notification body was clicked (not an action button)
    urlToOpen = event.notification.data?.url || '/';
  }
  
  console.log('[Service Worker] Opening URL:', urlToOpen);
  
  // Handle the navigation
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(function(clientList) {
      
      // Convert relative URLs to absolute URLs
      const targetUrl = urlToOpen.startsWith('http') 
        ? urlToOpen 
        : new URL(urlToOpen, self.location.origin).href;
      
      console.log('[Service Worker] Target URL:', targetUrl);
      
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          console.log('[Service Worker] Found matching client, focusing');
          return client.focus();
        }
      }
      
      // Check if there's a window from the same origin that can be navigated
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          console.log('[Service Worker] Navigating existing client to:', targetUrl);
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // No suitable existing window found, open a new one
      if (clients.openWindow) {
        console.log('[Service Worker] Opening new window:', targetUrl);
        return clients.openWindow(targetUrl);
      }
    }).catch(function(error) {
      console.error('[Service Worker] Error handling notification click:', error);
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
});

// Handle push events (alternative to onBackgroundMessage for more control)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received.');

  if (!event.data) {
    console.warn('[Service Worker] No event.data');
    return;
  }

  const payload = event.data.json();
  const data = payload.data || {};
  const title = data.title || 'New Message';

  // Build a clean options object
  const options = {
    body:    data.body,
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-192x192.png',
    tag:     data.category || 'default-tag',
    requireInteraction: true,
    data:    {
      url:         data.url,
      clickAction: data.click_action,
      order_id:    data.order_id,
      status:      data.status,
      // ...any other custom data
    },
    // Remove ANY unknown keys like fcm_options or notification.*
  };

  console.log('[Service Worker] Showing notification:', title, options);
  event.waitUntil(self.registration.showNotification(title, options));
  console.log('[Service Worker] Push event handled, notification shown.');
});


// Handle message events from the main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

  return new NextResponse(swContent, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
