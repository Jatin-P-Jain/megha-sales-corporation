self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
});

self.addEventListener("fetch", (event) => {
  // Basic caching or offline logic here (optional)
});
