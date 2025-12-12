// Service Worker für Notruf-App mit Firebase Cloud Messaging
// Handles push notifications (even when app is closed!) and offline functionality

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config
firebase.initializeApp({
    apiKey: "AIzaSyD1JAWOuqcmZ1NQhjU_0RiN-6GPoXd6J34",
    authDomain: "notruf-app-6f7ff.firebaseapp.com",
    projectId: "notruf-app-6f7ff",
    storageBucket: "notruf-app-6f7ff.firebasestorage.app",
    messagingSenderId: "844877130066",
    appId: "1:844877130066:web:38aae57e3ec31b0f0b728b"
});

const messaging = firebase.messaging();

// Handle background push notifications (AUCH BEI GESCHLOSSENER APP!)
messaging.onBackgroundMessage((payload) => {
    console.log('🚨 Background message received:', payload);
    
    const notificationTitle = payload.notification.title || '🚨 NOTRUF';
    const notificationOptions = {
        body: payload.notification.body || 'Ein Notruf wurde ausgelöst!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [500, 200, 500, 200, 500, 200, 500], // Lange Vibration
        requireInteraction: true, // Bleibt stehen bis User klickt
        tag: 'emergency-' + Date.now(),
        data: payload.data || {},
        actions: [
            { action: 'open', title: '📱 App öffnen', icon: '/icon-192.png' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();
    
    // Open/focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (let client of clientList) {
                    if (client.url.includes('notruf-app') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Cache for offline functionality
const CACHE_NAME = 'notruf-app-v2';
const urlsToCache = [
    '/',
    '/notruf-app.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache).catch(err => {
                    console.log('Cache addAll error:', err);
                });
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
