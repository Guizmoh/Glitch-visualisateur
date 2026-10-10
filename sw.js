// Ancien service worker de Page noir, quand l'appli était servie à la racine
// du site. Page noir vit maintenant dans page-noir/ avec son propre service
// worker ; celui-ci ne sert plus qu'à se retirer chez ceux qui avaient
// installé l'ancienne version, pour qu'ils voient la page d'accueil à jour.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) client.navigate(client.url);
  })());
});
