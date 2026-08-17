# TSARANORO VALLEY GUIDE — version nettoyée

## Fichiers
- `index.html` : site public
- `admin.html` : administration
- `app.js` / `admin.js` : fonctionnement
- `style.css` : design responsive
- `assets/` : images et favicon
- `404.html`, `robots.txt`, `sitemap.xml`, `netlify.toml` : publication

## Test local
Ne pas ouvrir `index.html` depuis WinRAR ou avec `file:///`.
1. Extraire tout le dossier.
2. Ouvrir le dossier dans VS Code.
3. Lancer un serveur local (Live Server, ou `python -m http.server`).
4. Ouvrir l'adresse `http://localhost:...`.

## Publication
Le dossier peut être déployé comme site statique sur Netlify, Cloudflare Pages ou GitHub Pages.

## Administration
Adresse après publication : `/admin.html`.

⚠️ Cette version conserve le fonctionnement localStorage de l'ancien projet. Les réservations enregistrées dans l'Admin sont donc locales au navigateur. Le bouton WhatsApp ouvre la demande de réservation sur le numéro configuré. Pour que les réservations de tous les visiteurs arrivent dans un même tableau Admin depuis Internet, il faut connecter une base de données/authentification serveur (par exemple Supabase) et configurer ses règles de sécurité. Un mot de passe écrit dans un JavaScript statique ne constitue pas une authentification serveur sécurisée.

## Numéro WhatsApp
Le projet utilise le numéro `+261387134259`. À remplacer dans `app.js` si nécessaire.

## Après publication
Remplacer l'adresse fictive `https://YOUR-DOMAIN.example/` dans `sitemap.xml` par le vrai domaine, puis soumettre le sitemap à Google Search Console.

## Cover premium
Le Cover utilise directement `assets/tsaranoro.jpg` fourni dans cette archive, avec un mouvement lent type « Ken Burns » (zoom/pan) pour donner un effet vidéo sans remplacer la photo par une image générée. Pour un vrai diaporama avec plusieurs photos, ajoutez plusieurs photos réelles dans `assets/` puis référencez-les dans le Cover.

## Mise à jour finale — 17/08/2026
- Hero d'accueil : « Découvrez la Vallée de Tsaranoro » + Trek et Randonnée, Escalade, Canoë, Parapente, Découverte culturelle, Balade.
- Les 9 circuits restent affichés après le hero, en commençant par Circuit Buvoika Tsaranoro.
- Administration : ajout/modification/suppression des circuits, activités et hébergements + gestion des photos.
- Hôtels : ajout de Camp Catta avec deux photos d'hébergement. Les propres photos autorisées de Tsarasoa Lodge peuvent être ajoutées depuis l'administration.


## Fond d’écran plein écran
Le site public utilise désormais un diaporama fixe de photos de Tsaranoro derrière toute la page, avec zoom/pan doux et un voile de lisibilité pour les textes. Les sections restent légèrement translucides afin de laisser apparaître le paysage en arrière-plan.


## Hébergements
Les cartes publiques des hôtels n’affichent plus de lien "Site officiel". Elles montrent une photo d’hébergement et un logo lorsqu’il est disponible. Pour Tsarasoa, une vue réelle de la vallée est utilisée comme visuel de secours dans cette version; le logo de domaine est affiché s’il se charge. Pour Camp Catta, la photo locale du bungalow est utilisée.


## Admin vidéos
L'Admin contient maintenant un onglet 🎥 Vidéos pour ajouter/modifier/supprimer des fichiers vidéo locaux MP4. Cette première version utilise localStorage; pour publication réelle pour tous les visiteurs, connecter ensuite les vidéos à Supabase Storage.
