# Artywiz App - TODO & Documentation pour Prochaine Mise à Jour

## ✅ Fonctionnalités Complétées (v1.0)

### Écran "Mes Comptes" (profile-selection.tsx)
- [x] Popup multi-étapes pour créer un compte (équipe, club, district, ligue)
- [x] Animation Tetris sur les cartes de compte
- [x] Suppression de compte (protégé : ne peut pas supprimer le dernier compte)
- [x] Activation d'un compte par clic
- [x] Texte de bienvenue pour nouveaux utilisateurs
- [x] Bouton "Continuer" désactivé si pas de compte

### Écran "Docs" (creer.tsx)
- [x] Animation Tetris sur les cartes de documents
- [x] Mockups à 50% de largeur
- [x] Structure 4 lignes de texte (Date, Type, Description, Équipe)
- [x] Indicateurs d'état visuels (cercle clignotant, vert fixe, icône check)
- [x] Badges sponsoring (★XX€)
- [x] 5 profils avec données réelles :
  - AS Strasbourg - Séniors 1
  - AS Strasbourg (Club)
  - Ligue LGEF
  - Ligue Normandie
  - Ligue Alsace

### Système de Persistance
- [x] Zustand avec middleware persist
- [x] Stockage hybride (localStorage web + AsyncStorage natif)
- [x] Logs de debug pour diagnostique

---

## 🔧 TODO - Prochaine Mise à Jour (v1.1)

### Navigation
- [ ] Ajouter bouton retour sur tous les écrans secondaires
- [ ] Implémenter navigation par gestes (swipe back)
- [ ] Vérifier que le bouton retour Android fonctionne

### Fonctionnalités à Ajouter
- [ ] Écran de détail d'un document (sélection des supports)
- [ ] Écran de publication (Facebook, Instagram, etc.)
- [ ] Notifications push pour alertes de documents prêts
- [ ] Intégration avec l'API Artywiz réelle

### UX/UI
- [ ] Ajouter confirmation visuelle lors de la sauvegarde
- [ ] Toast/Snackbar pour les actions réussies
- [ ] Pull-to-refresh sur l'écran Docs
- [ ] Skeleton loading pendant le chargement

### Persistance & Sync
- [ ] Synchronisation avec backend Artywiz
- [ ] Gestion des conflits de données
- [ ] Mode hors-ligne avec queue de sync

### Performance
- [ ] Lazy loading des images de mockup
- [ ] Pagination sur la liste de documents
- [ ] Cache des images avec expo-image

---

## 🐛 Bugs Connus

1. **Video background** : Redémarre à chaque navigation (priorité basse)
2. **Expo Go** : QR code ne fonctionne pas en environnement CI

---

## 📁 Architecture des Fichiers

```
/app/frontend/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Navigation par onglets
│   │   ├── index.tsx        # Dashboard
│   │   └── creer.tsx        # Écran Docs (liste des documents)
│   ├── index.tsx            # Écran d'accueil/Welcome
│   ├── login.tsx            # Connexion
│   ├── signup.tsx           # Inscription
│   └── profile-selection.tsx # Mes Comptes
├── services/
│   ├── asStrasbourgDataService.ts    # Données équipe Seniors 1
│   ├── asStrasbourgClubDataService.ts # Données club AS Strasbourg
│   ├── lgefDataService.ts            # Données Ligue LGEF
│   ├── normandieDataService.ts       # Données Ligue Normandie
│   └── alsaceDataService.ts          # Données Ligue Alsace
├── stores/
│   ├── authStore.ts          # État d'authentification
│   └── userPreferencesStore.ts # Préférences utilisateur
└── assets/
    └── documents/
        ├── AS Strasbourg - Team Senior 1/
        ├── AS Strasbourg/
        ├── LGEF/
        ├── Normandie/
        └── Alsace/
```

---

## 🔑 Points d'Attention pour le Développeur

1. **Ne pas supprimer l'écran intro/welcome** - Les utilisateurs en ont besoin pour se connecter/s'inscrire
2. **Tester sur web ET mobile** - Le stockage hybride a des comportements différents
3. **Vérifier les profils avant de naviguer au dashboard**
4. **Les images mockup sont incluses via require()** - Pas de chargement dynamique pour l'instant

---

## 📅 Dernière Mise à Jour

Date: 21 décembre 2025
Version: 1.0.0
