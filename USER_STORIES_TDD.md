# User Stories - Matrice ESN Backend (TDD Approach)

## 🎯 Test Strategy
- **70% Tests Unitaires** : Logique métier, Value Objects, Use Cases, Services
- **20% Tests E2E** : API endpoints, flows complets utilisateur
- **10% Tests Intégration** : Repository, Database, Services externes

---

# 🔐 Module AUTH - User Stories

## Epic: Authentication & User Management
**En tant qu'utilisateur de l'ESN, je veux pouvoir m'authentifier de manière sécurisée pour accéder aux fonctionnalités de l'application.**

---

## 📋 User Story 1: Login utilisateur
**En tant qu'utilisateur enregistré, je veux me connecter avec mon email et mot de passe pour accéder à l'application.**

### 🎯 Critères d'acceptation
- [ ] L'utilisateur peut se connecter avec un email valide et mot de passe correct
- [ ] Un token JWT est généré et retourné lors de la connexion réussie
- [ ] La date de dernière connexion est mise à jour
- [ ] Les tentatives de connexion sont trackées pour la sécurité
- [ ] Les credentials invalides renvoient une erreur appropriée
- [ ] Les comptes désactivés ne peuvent pas se connecter

### 🧪 Tests à implémenter (70% Unit)

#### Value Objects
- `Email.vo.ts`
  - ✅ Création d'email valide
  - ✅ Rejet d'email invalide (format)
  - ✅ Rejet d'email vide
  - ✅ Normalisation (lowercase, trim)
  - ✅ Extraction domaine et partie locale
  - ✅ Comparaison d'emails

#### Domain Entities
- `User.entity.ts`
  - ✅ Création d'utilisateur avec données valides
  - ✅ Mise à jour dernière connexion
  - ✅ Activation/Désactivation compte
  - ✅ Gestion token reset password
  - ✅ Validation token reset password
  - ✅ Mise à jour profil utilisateur

#### Domain Exceptions
- `InvalidCredentialsException`
- `AccountDeactivatedException`
- `UserNotFoundException`
- `InvalidEmailException`

#### Use Cases (Core Logic)
- `LoginUseCase`
  - ✅ Connexion réussie avec credentials valides
  - ✅ Échec avec email inexistant
  - ✅ Échec avec mot de passe incorrect
  - ✅ Échec avec compte désactivé
  - ✅ Mise à jour lastLoginAt
  - ✅ Génération des tokens JWT
  - ✅ Configuration auth récupérée

#### Application Services Interfaces
- `IPasswordService`
- `ITokenService`
- `IAuthConfigService`
- `IUserRepository`

### 🔌 Tests Intégration (10%)
- `TypeormUserRepository`
  - ✅ Sauvegarde utilisateur en base
  - ✅ Recherche par email
  - ✅ Mapping domain ↔ schema
- `NestAuthConfigService`
  - ✅ Lecture configuration environment

### 🌐 Tests E2E (20%)
- `POST /auth/login`
  - ✅ Login successful avec response 200
  - ✅ Login failed avec response 401 (invalid credentials)
  - ✅ Login failed avec response 403 (account disabled)
  - ✅ Login failed avec response 400 (invalid email format)
  - ✅ Structure de réponse conforme au DTO
  - ✅ Headers JWT token présent

---

## 📋 User Story 2: Logout utilisateur
**En tant qu'utilisateur connecté, je veux me déconnecter pour sécuriser ma session.**

### 🎯 Critères d'acceptation
- [ ] L'utilisateur peut se déconnecter
- [ ] Le refresh token est invalidé
- [ ] L'access token est ajouté à la blacklist
- [ ] Une confirmation de déconnexion est retournée

### 🧪 Tests à implémenter (70% Unit)
- `LogoutUseCase` (à créer)
  - ✅ Invalidation refresh token
  - ✅ Ajout access token à blacklist
  - ✅ Session clearing

### 🌐 Tests E2E (20%)
- `POST /auth/logout`
  - ✅ Logout successful avec response 204
  - ✅ Token invalidé après logout

---

## 📋 User Story 3: Refresh token
**En tant qu'utilisateur, je veux que mon token soit automatiquement renouvelé pour maintenir ma session.**

### 🎯 Critères d'acceptation
- [ ] Un nouveau access token est généré avec un refresh token valide
- [ ] Le refresh token peut être renouvelé avant expiration
- [ ] Les tokens expirés sont rejetés
- [ ] La rotation des refresh tokens est supportée

### 🧪 Tests à implémenter (70% Unit)
- `RefreshTokenUseCase` (à créer)
  - ✅ Génération nouveau access token
  - ✅ Validation refresh token
  - ✅ Rejet token expiré
  - ✅ Rotation refresh token

### 🌐 Tests E2E (20%)
- `POST /auth/refresh`
  - ✅ Refresh successful avec response 200
  - ✅ Refresh failed avec response 401 (invalid/expired token)

---

## 📋 User Story 4: Récupération profil utilisateur
**En tant qu'utilisateur connecté, je veux récupérer mes informations de profil.**

### 🎯 Critères d'acceptation
- [ ] L'utilisateur authentifié peut récupérer son profil
- [ ] Les informations sensibles ne sont pas exposées
- [ ] Le profil contient les données nécessaires à l'application

### 🧪 Tests à implémenter (70% Unit)
- `GetCurrentUserUseCase` (à créer)
  - ✅ Récupération profil utilisateur authentifié
  - ✅ Filtrage informations sensibles
  - ✅ Utilisateur non trouvé exception

### 🌐 Tests E2E (20%)
- `GET /auth/me`
  - ✅ Profile retrieval successful avec response 200
  - ✅ Unauthorized access avec response 401
  - ✅ Structure réponse conforme

---

## 📋 User Story 5: Reset password
**En tant qu'utilisateur, je veux pouvoir réinitialiser mon mot de passe si je l'oublie.**

### 🎯 Critères d'acceptation
- [ ] L'utilisateur peut demander un reset de mot de passe
- [ ] Un token de reset est généré et envoyé par email
- [ ] L'utilisateur peut réinitialiser avec le token valide
- [ ] Le token expire après utilisation ou délai

### 🧪 Tests à implémenter (70% Unit)
- `RequestPasswordResetUseCase` (à créer)
- `ResetPasswordUseCase` (à créer)
- Value Object `ResetPasswordToken` (à créer)

### 🌐 Tests E2E (20%)
- `POST /auth/password/reset-request`
- `POST /auth/password/reset`

---

## 🚀 Ordre d'implémentation TDD recommandé

### Phase 1: Foundation (Value Objects & Entities)
1. `Email.vo.ts` tests + implementation
2. `User.entity.ts` tests + implementation
3. Domain exceptions tests + implementation

### Phase 2: Core Logic (Use Cases)
4. `LoginUseCase` tests + implementation
5. Repository interfaces mock implementation
6. Service interfaces mock implementation

### Phase 3: Infrastructure
7. `TypeormUserRepository` tests + implementation
8. `NestAuthConfigService` tests + implementation

### Phase 4: API Layer
9. Controller tests + implementation
10. E2E tests + implementation

### Phase 5: Additional Features
11. Logout, Refresh, Profile, Reset Password

---

## 📊 Test Coverage Targets

| Couche | Coverage Target | Focus |
|--------|----------------|-------|
| **Domain** | 95%+ | Entities, Value Objects, Business Rules |
| **Application** | 90%+ | Use Cases, Application Services |
| **Infrastructure** | 80%+ | Repositories, External Services |
| **Presentation** | 70%+ | Controllers, DTOs |

---

**Prêt pour validation et implémentation TDD ! 🚀**