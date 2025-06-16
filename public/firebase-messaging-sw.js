// Firebase setup
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCrwm1SeI0eeDRDCm3SrI8EsakaTwTa3YE",
  projectId: "megha-sales-corporation-dev",
  messagingSenderId: "19402792672",
  appId: "1:19402792672:web:c8b19421d4bd0c14afba85",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[Service Worker] Background message received", payload);
  const { title, body } = payload.notification || payload.data;

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192x192.png",
  });
});

// PWA install + caching (if needed)
self.addEventListener("install", (event) => {
  console.log("SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW activated");
});

self.addEventListener("fetch", (event) => {
  // Optional: Cache or offline logic
});
