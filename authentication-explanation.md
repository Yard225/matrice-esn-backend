# Authentification robuste avec Access Token et Refresh Token

## Vue d'ensemble

L'authentification basée sur les tokens JWT (JSON Web Tokens) avec système d'Access Token et Refresh Token est une approche moderne et sécurisée pour gérer l'authentification dans les applications web et mobiles.

## Architecture du système

### Composants principaux

1. **Access Token (JWT)**
   - Token de courte durée de vie (15-30 minutes)
   - Contient les informations d'identification de l'utilisateur
   - Utilisé pour accéder aux ressources protégées
   - Stateless (auto-contenu)

2. **Refresh Token**
   - Token de longue durée de vie (7-30 jours)
   - Utilisé uniquement pour obtenir de nouveaux Access Tokens
   - Stocké de manière sécurisée côté serveur
   - Peut être révoqué à tout moment

## Flux d'authentification

### 1. Connexion initiale
1. L'utilisateur fournit ses identifiants (email/mot de passe)
2. Le serveur valide les identifiants
3. Si valides, le serveur génère :
   - Un Access Token JWT (courte durée)
   - Un Refresh Token (longue durée)
4. Le Refresh Token est stocké en base de données
5. Les deux tokens sont renvoyés au client

### 2. Accès aux ressources protégées
1. Le client inclut l'Access Token dans l'en-tête Authorization
2. Le serveur valide le token (signature, expiration, structure)
3. Si valide, l'accès est accordé
4. Si expiré, retour d'une erreur 401 Unauthorized

### 3. Renouvellement des tokens
1. Quand l'Access Token expire, le client utilise le Refresh Token
2. Le serveur valide le Refresh Token en base de données
3. Si valide, génération d'un nouvel Access Token
4. Optionnel : rotation du Refresh Token pour plus de sécurité

## Bonnes pratiques de sécurité

### Structure des tokens

#### Access Token (JWT)
- **Algorithme** : RS256 ou ES256 (asymétrique) préféré à HS256
- **Durée de vie** : 15-30 minutes maximum
- **Claims essentiels** :
  - `sub` (subject) : ID utilisateur
  - `iat` (issued at) : timestamp de création
  - `exp` (expiration) : timestamp d'expiration
  - `aud` (audience) : application cible
  - `iss` (issuer) : serveur d'authentification
  - Rôles et permissions utilisateur

#### Refresh Token
- **Format** : Token opaque (UUID v4 ou chaîne aléatoire cryptographiquement sûre)
- **Durée de vie** : 7-30 jours
- **Stockage** : Base de données avec informations associées
- **Métadonnées** : user_id, device_id, IP, user_agent, date_création

### Stockage sécurisé

#### Côté client
- **Access Token** : Mémoire de l'application (variable JavaScript)
- **Refresh Token** : 
  - Web : Cookie HttpOnly, Secure, SameSite
  - Mobile : Keychain (iOS) / Keystore (Android)
- **Jamais** dans localStorage ou sessionStorage

#### Côté serveur
- **Clés de signature** : Variables d'environnement ou gestionnaire de secrets
- **Refresh Tokens** : Base de données avec index sur user_id
- **Rotation** : Historique des tokens pour détecter les réutilisations

### Protection contre les attaques

#### XSS (Cross-Site Scripting)
- Sanitisation de toutes les entrées utilisateur
- Content Security Policy (CSP) strict
- Stockage des tokens sensibles hors de la portée JavaScript

#### CSRF (Cross-Site Request Forgery)
- Cookies avec attribut SameSite=Strict
- Validation de l'origine des requêtes
- Double Submit Cookie pattern si nécessaire

#### Token Hijacking
- HTTPS obligatoire en production
- Rotation automatique des Refresh Tokens
- Détection d'anomalies (IP, user-agent, géolocalisation)
- Invalidation immédiate en cas de suspicion

#### Replay Attacks
- Validation stricte de l'expiration des tokens
- Nonce ou timestamp dans les requêtes sensibles
- Rate limiting sur les endpoints d'authentification

### Gestion des sessions et révocation

#### Révocation des tokens
- Blacklist des Access Tokens (si nécessaire, mais coûteux)
- Suppression des Refresh Tokens de la base
- Révocation par device_id ou user_id
- Déconnexion globale (tous les appareils)

#### Détection de comportements suspects
- Connexions simultanées inhabituelles
- Changement brutal de géolocalisation
- Tentatives de connexion répétées
- Utilisation de Refresh Tokens expirés

## Implémentation des endpoints

### Endpoints essentiels

1. **POST /auth/login**
   - Validation des identifiants
   - Génération des tokens
   - Logging des connexions

2. **POST /auth/refresh**
   - Validation du Refresh Token
   - Génération nouveau Access Token
   - Rotation optionnelle du Refresh Token

3. **POST /auth/logout**
   - Révocation du Refresh Token
   - Nettoyage des cookies

4. **POST /auth/logout-all**
   - Révocation de tous les Refresh Tokens de l'utilisateur

### Validation et middleware

#### Validation d'Access Token
- Vérification de la signature JWT
- Validation des claims (exp, aud, iss)
- Vérification du format et de la structure
- Gestion des erreurs avec codes HTTP appropriés

#### Rate Limiting
- Limitation stricte sur /auth/login (5 tentatives/15 minutes)
- Limitation sur /auth/refresh (10 requêtes/minute)
- Captcha après plusieurs échecs

## Monitoring et audit

### Logs de sécurité
- Toutes les tentatives d'authentification
- Génération et utilisation des tokens
- Tentatives d'accès avec tokens expirés
- Révocations et déconnexions

### Métriques importantes
- Taux de succès/échec des authentifications
- Nombre de tokens actifs par utilisateur
- Fréquence d'utilisation des Refresh Tokens
- Anomalies géographiques ou temporelles

### Alertes automatiques
- Tentatives de connexion suspectes
- Utilisation de tokens révoqués
- Pic de génération de tokens
- Échecs répétés de validation

## Configuration recommandée

### Variables d'environnement
```
# Clés JWT
JWT_PRIVATE_KEY=<clé privée RS256>
JWT_PUBLIC_KEY=<clé publique RS256>
JWT_ACCESS_TOKEN_TTL=1800  # 30 minutes
JWT_REFRESH_TOKEN_TTL=2592000  # 30 jours

# Sécurité
BCRYPT_ROUNDS=12
COOKIE_SECRET=<chaîne aléatoire>
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=5
```

### Rotation des clés
- Rotation régulière des clés de signature (tous les 6 mois)
- Support de multiples clés pour transition en douceur
- Procédure documentée de rotation d'urgence

## Conclusion

Cette architecture offre un équilibre optimal entre sécurité et expérience utilisateur. La combinaison d'Access Tokens de courte durée et de Refresh Tokens sécurisés, associée aux bonnes pratiques de sécurité, crée un système robuste contre la plupart des vecteurs d'attaque modernes.

L'implémentation doit être accompagnée d'un monitoring rigoureux et d'une stratégie de réponse aux incidents pour maintenir un niveau de sécurité optimal.