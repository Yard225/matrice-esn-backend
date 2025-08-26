# 🏗️ Matrice ESN Backend

Backend API pour la Matrice d'Habilitation ESN construit avec **NestJS** et **Clean Architecture Core + Features-Based**.

## 🚀 Description

Cette application implémente une architecture Clean Architecture organisée par features métier avec un core centralisé. Elle fournit les APIs pour :

- 🔐 **Authentification** : Login, JWT, gestion des sessions
- 👥 **Utilisateurs** : CRUD utilisateurs, profils, permissions
- 🎭 **Rôles** : Gestion des rôles et catégories
- 🔄 **Interactions** : Matrice d'interactions entre rôles
- 📊 **Rapports** : Rapports hebdomadaires, WSJF, analytics
- 🎨 **Branding** : Personnalisation de l'application

## 📁 Architecture

```
src/
├── core/                     # Éléments métier partagés
│   ├── domain/              # Entités, Value Objects, Exceptions
│   ├── application/         # Interfaces, DTOs, Services partagés
│   └── infrastructure/      # Infrastructure de base
├── shared/                  # Infrastructure technique
│   ├── config/             # Configurations (DB, JWT, etc.)
│   ├── guards/             # Guards globaux
│   ├── interceptors/       # Interceptors globaux
│   ├── filters/            # Exception filters
│   └── ...                 # Autres composants partagés
├── features/               # Features métier
│   ├── auth/              # Feature Authentification
│   ├── users/             # Feature Utilisateurs
│   ├── roles/             # Feature Rôles
│   ├── interactions/      # Feature Interactions
│   ├── reports/           # Feature Rapports
│   └── branding/          # Feature Branding
└── app.module.ts          # Module racine
```

## ⚙️ Installation

### Prérequis

- Node.js >= 18.x
- PostgreSQL >= 13.x
- npm ou pnpm

### 1. Cloner le projet

```bash
git clone <repository-url>
cd matrice-esn-backend
```

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

### 3. Configuration

Copier le fichier d'environnement :

```bash
cp .env.example .env
```

Modifier les variables d'environnement dans `.env` :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=matrice_esn

# JWT
JWT_SECRET=your-super-secure-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Autres configurations...
```

### 4. Base de données

```bash
# Créer la base de données
createdb matrice_esn

# Exécuter les migrations
npm run db:create

# (Optionnel) Insérer des données de test
npm run db:seed
```

## 🚀 Démarrage

```bash
# Mode développement avec hot-reload
npm run start:dev

# Mode production
npm run start:prod

# Mode debug
npm run start:debug
```

L'application sera disponible sur :
- **API** : http://localhost:3000/api/v1
- **Documentation** : http://localhost:3000/api/docs
- **Health Check** : http://localhost:3000/api/v1/health

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📖 API Documentation

La documentation Swagger est automatiquement générée et disponible sur :
- **Development** : http://localhost:3000/api/docs
- **Staging** : https://api-staging.matrice-esn.com/api/docs

### Endpoints principaux

#### 🔐 Authentification
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### 👥 Utilisateurs
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

#### 📊 Rapports
```
GET    /api/v1/reports/weekly
POST   /api/v1/reports/weekly/generate
GET    /api/v1/reports/wsjf
POST   /api/v1/reports/wsjf/calculate
```

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run start:dev          # Démarrage avec hot-reload
npm run start:debug        # Démarrage en mode debug

# Build
npm run build              # Build de production
npm run prebuild           # Nettoyage avant build

# Qualité de code
npm run lint               # Correction automatique
npm run lint:check         # Vérification seule
npm run format             # Format du code avec Prettier

# Base de données
npm run db:create          # Exécuter les migrations
npm run db:migrate         # Générer une nouvelle migration
npm run db:revert          # Annuler la dernière migration
npm run db:seed            # Insérer des données de test
npm run db:drop            # Supprimer toutes les tables
```

## 📊 Monitoring & Observabilité

### Health Checks
```bash
curl http://localhost:3000/api/v1/health
```

### Logs
Les logs sont structurés et incluent :
- Request ID pour le tracing
- Métriques de performance
- Erreurs avec stack traces
- Audit trails

### Métriques
- Temps de réponse des APIs
- Taux d'erreur
- Utilisation ressources
- Métriques métier personnalisées

## 🔒 Sécurité

- **Authentication** : JWT avec refresh tokens
- **Authorization** : Guards basés sur les rôles
- **Rate Limiting** : Protection contre le spam
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Configuration cross-origin
- **Validation** : Validation automatique des inputs
- **Encryption** : Chiffrement des données sensibles

## 🚀 Déploiement

### Variables d'environnement de production

```env
NODE_ENV=production
DB_SSL=true
JWT_SECRET=production-secret
LOG_LEVEL=warn
CORS_ORIGINS=https://app.matrice-esn.com
```

### Docker

```bash
# Build de l'image
docker build -t matrice-esn-backend .

# Démarrage avec docker-compose
docker-compose up -d
```

## Wallaby.js

[![Wallaby.js](https://img.shields.io/badge/wallaby.js-powered-blue.svg?style=for-the-badge&logo=github)](https://wallabyjs.com/oss/)

This repository contributors are welcome to use
[Wallaby.js OSS License](https://wallabyjs.com/oss/) to get
test results immediately as you type, and see the results in
your editor right next to your code.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence privée. Tous droits réservés.

## 📞 Support

Pour toute question ou support :
- 📧 Email : support@matrice-esn.com
- 📱 Slack : #matrice-esn-dev
- 🐛 Issues : GitHub Issues

## 🎯 Roadmap

- [ ] Tests unitaires complets
- [ ] Tests d'intégration
- [ ] CI/CD Pipeline
- [ ] Monitoring avancé
- [ ] Cache Redis
- [ ] WebSockets pour temps réel
- [ ] API versioning
- [ ] Rate limiting avancé