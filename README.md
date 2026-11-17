# Les 30 ans d'Alessia

Web app d'invitation : sondages (escape game, resto + jeu de rôle, K-pop), résultats partagés, espace organisateur.

- `public/` : l'app (HTML/JS, mobile-first)
- `src/index.js` : API (Cloudflare Worker) ; `schema.sql` : base D1
- Le code organisateur est vérifié côté serveur (hash dans la table `kv`, clé `code_hash`)

Déploiement : `npx wrangler deploy` (ou Workers Builds branché sur ce dépôt).
