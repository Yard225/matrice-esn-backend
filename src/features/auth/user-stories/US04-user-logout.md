# US04 : Déconnexion Utilisateur

## 📋 User Story
**En tant qu'utilisateur connecté, je veux pouvoir me déconnecter proprement de l'application pour sécuriser mon compte, particulièrement sur des appareils partagés.**

**Valeur métier :** Terminer la session de manière sécurisée et empêcher tout accès non autorisé avec les tokens existants.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Déconnexion Réussie
```gherkin
GIVEN utilisateur authentifié avec accessToken valide
AND refreshToken associé existe en base
WHEN POST /auth/logout avec "Authorization: Bearer {accessToken}"
THEN status=200
AND refreshToken révoqué en base (isRevoked=true)
AND response={"message":"Logged out successfully","code":"LOGOUT_SUCCESS"}
AND événement de déconnexion loggé
```

### ❌ Scénario 2 : Token d'Accès Invalide
```gherkin
GIVEN accessToken invalide ou expiré
WHEN POST /auth/logout avec token invalide
THEN status=401
AND response={"error":"Invalid token","code":"TOKEN_INVALID"}
AND aucune action de déconnexion effectuée
```

### ❌ Scénario 3 : Refresh Token Déjà Révoqué
```gherkin
GIVEN accessToken valide mais refreshToken déjà révoqué
WHEN POST /auth/logout
THEN status=200
AND response={"message":"Already logged out","code":"ALREADY_LOGGED_OUT"}
AND action loggée comme déconnexion redondante
```

### 🚫 Scénario 4 : Utilisateur Inexistant
```gherkin
GIVEN accessToken valide mais utilisateur supprimé de la base
WHEN POST /auth/logout
THEN status=404
AND response={"error":"User not found","code":"USER_NOT_FOUND"}
AND tentative loggée pour audit
```

### 🔒 Scénario 5 : Déconnexion avec Nettoyage Session
```gherkin
GIVEN utilisateur connecté avec données de session stockées
WHEN POST /auth/logout
THEN refreshToken révoqué
AND données de session supprimées (cache, Redis)
AND cookies de session invalidés
AND historique de connexion mis à jour
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Service de Déconnexion (Domain Service)**
```typescript
class LogoutService {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly sessionService: ISessionService
  ) {}

  async logoutUser(userId: string, tokenId?: string): Promise<LogoutResult> {
    // Logique métier de déconnexion
    // Révocation des tokens
    // Nettoyage des sessions
  }
}

interface LogoutResult {
  success: boolean;
  tokensRevoked: number;
  sessionsCleaned: number;
  timestamp: Date;
}
```

**Événements Domain**
```typescript
class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly deviceInfo: string,
    public readonly timestamp: Date,
    public readonly voluntary: boolean = true  // true si déconnexion volontaire
  ) {}
}

class SessionTerminatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly reason: 'LOGOUT' | 'EXPIRED' | 'REVOKED'
  ) {}
}
```

**Exceptions Domain**
```typescript
class LogoutFailedException extends DomainException {
  constructor(userId: string, reason: string)
}

class SessionNotFoundException extends DomainException {
  constructor(sessionId: string)
}
```

### 📋 Application Layer - Orchestration

**Use Case : LogoutUserUseCase**
```typescript
class LogoutUserUseCase implements IUseCase<LogoutRequest, LogoutResponse> {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly sessionService: ISessionService,
    private readonly logoutService: LogoutService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(request: LogoutRequest): Promise<LogoutResponse>
}

type LogoutRequest = {
  userId: string;          // Extrait du token d'accès
  tokenId?: string;        // ID du refresh token à révoquer (optionnel)
  deviceInfo?: {
    ip: string;
    userAgent: string;
  }
}

type LogoutResponse = {
  message: string;         // "Logged out successfully"
  code: string;           // "LOGOUT_SUCCESS"
  tokensRevoked: number;   // Nombre de tokens révoqués
  timestamp: Date;        // Horodatage de la déconnexion
}
```

**Flux d'Exécution du Use Case**
1. **Validation User** : `userRepository.findById(userId)` - vérifier existence
2. **Recherche Tokens** : `refreshTokenRepository.findByUserId(userId)`
3. **Révocation** : Marquer tous les refresh tokens comme révoqués
   - Si `tokenId` spécifié → révoquer seulement ce token
   - Sinon → révoquer tous les tokens de l'utilisateur
4. **Nettoyage Session** : `sessionService.clearUserSessions(userId)`
5. **Persistance** : Sauvegarder les tokens révoqués
6. **Événements** : Publier `UserLoggedOutEvent` et `SessionTerminatedEvent`
7. **Response** : Return `LogoutResponse` avec statistiques

### 🔧 Infrastructure Layer - Implémentations

**Session Service**
```typescript
interface ISessionService {
  clearUserSessions(userId: string): Promise<number>           // Nettoyage Redis/cache
  clearUserSession(userId: string, sessionId: string): Promise<boolean>
  invalidateCookies(response: Response): void                  // Invalidation cookies HTTP
}

class RedisSessionService implements ISessionService {
  async clearUserSessions(userId: string): Promise<number> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      return await this.redis.del(...keys);
    }
    return 0;
  }
}
```

**Repository Extensions**
```typescript
interface IRefreshTokenRepository {
  // ... méthodes existantes
  revokeByUserId(userId: string): Promise<number>              // Révoquer tous les tokens user
  revokeByTokenId(tokenId: string): Promise<boolean>           // Révoquer token spécifique
  findActiveByUserId(userId: string): Promise<RefreshToken[]>   // Tokens actifs seulement
}
```

**Event Handlers**
```typescript
@EventHandler(UserLoggedOutEvent)
export class UserLoggedOutHandler {
  constructor(
    private readonly notificationService: INotificationService,
    private readonly auditService: IAuditService
  ) {}

  async handle(event: UserLoggedOutEvent): Promise<void> {
    // Notification optionnelle à l'utilisateur
    // Enregistrement pour audit de sécurité
    // Nettoyage de caches dérivés
  }
}
```

### 🎮 Presentation Layer - API Contract

**Endpoint Specification**
```http
POST /auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body (optionnel):
{
  "logoutAll": false     // false = déconnexion appareil courant, true = tous appareils
}

Response Success (200):
{
  "message": "Logged out successfully",
  "code": "LOGOUT_SUCCESS",
  "tokensRevoked": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Success (200 - Already logged out):
{
  "message": "Already logged out",
  "code": "ALREADY_LOGGED_OUT",
  "tokensRevoked": 0,
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (401):
{
  "error": "Invalid token",
  "code": "TOKEN_INVALID",
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (404):
{
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Controller Implementation**
```typescript
@Controller('auth')
export class AuthController {
  
  @Post('logout')
  @UseGuards(JwtAuthGuard)  // Authentification requise
  @HttpCode(200)
  async logout(
    @CurrentUser() user: UserContext,
    @Body() logoutDto: LogoutDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<LogoutResponse> {
    
    const result = await this.logoutUserUseCase.execute({
      userId: user.id,
      deviceInfo: { ip, userAgent }
    });

    // Invalidation des cookies de session
    this.sessionService.invalidateCookies(response);
    
    return result;
  }
}
```

**Validation DTO**
```typescript
class LogoutDto {
  @IsOptional()
  @IsBoolean({ message: 'logoutAll doit être un boolean' })
  logoutAll?: boolean = false;
}
```

---

## 🔐 Spécifications Sécurité

### Gestion des Cookies
```typescript
// Configuration cookies sécurisés
const CookieConfig = {
  httpOnly: true,           // Pas d'accès JavaScript
  secure: true,            // HTTPS uniquement
  sameSite: 'strict',      // Protection CSRF
  maxAge: 0,               // Expiration immédiate pour logout
  domain: process.env.COOKIE_DOMAIN,
  path: '/'
};
```

### Audit de Sécurité
```typescript
interface LogoutAuditEntry {
  userId: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  voluntary: boolean;      // true = déconnexion utilisateur, false = révocation admin
  tokensRevoked: number;
  sessionsCleaned: number;
  reason?: string;         // Raison si déconnexion forcée
}
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "user_logout_success",
  "userId": "user-uuid",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "tokensRevoked": 1,
  "sessionsCleaned": 3,
  "voluntary": true,
  "duration": 45
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:01:00Z",
  "event": "logout_attempt_invalid_token",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "tokenPrefix": "eyJhbG...",
  "reason": "token_expired"
}

{
  "level": "INFO",
  "timestamp": "2024-01-01T12:02:00Z",
  "event": "redundant_logout_attempt",
  "userId": "user-uuid",
  "ip": "192.168.1.100",
  "message": "User already logged out, no action taken"
}
```

### Métriques Business
- `auth.logout.success.count` - Déconnexions réussies
- `auth.logout.failure.count` - Échecs par raison
- `auth.logout.tokens_revoked.histogram` - Nombre de tokens révoqués par logout
- `auth.logout.sessions_cleaned.histogram` - Sessions nettoyées par logout
- `auth.logout.duration.histogram` - Temps de traitement logout

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('LogoutService', () => {
  it('should revoke all refresh tokens for user')
  it('should clear all user sessions')
  it('should return correct logout statistics')
  it('should publish UserLoggedOutEvent on success')
})

describe('Domain Events', () => {
  it('should create UserLoggedOutEvent with correct data')
  it('should create SessionTerminatedEvent with logout reason')
})
```

### Tests Use Case Application
```typescript
describe('LogoutUserUseCase', () => {
  it('should logout user successfully when valid token')
  it('should throw UserNotFoundException when user not found')
  it('should handle already logged out user gracefully')
  it('should revoke only specified token when tokenId provided')
  it('should revoke all tokens when no tokenId specified')
  it('should clear user sessions on logout')
  it('should publish domain events on successful logout')
})
```

### Tests E2E Presentation
```typescript
describe('POST /auth/logout', () => {
  it('returns 200 with success message when valid token')
  it('returns 401 when no authorization header')
  it('returns 401 when token invalid/expired')
  it('returns 404 when user not found')
  it('clears session cookies on successful logout')
  it('logs logout events properly')
  it('handles concurrent logout requests gracefully')
})
```

### Tests de Sécurité
```typescript
describe('Logout Security Tests', () => {
  it('should prevent logout without valid authentication')
  it('should clear all sessions and tokens completely')
  it('should invalidate cookies securely')
  it('should audit all logout attempts')
  it('should handle race conditions on concurrent logouts')
})
```

---

## 🎯 Performance Requirements

- **Logout time** : p95 < 150ms
- **Token revocation** : Batch operations optimisées
- **Session cleanup** : Non-blocking ou async
- **Concurrent logouts** : Support 100 req/s

---

## 💡 Considérations UX

### Feedback Utilisateur
```typescript
// Messages contextuels selon la situation
const LogoutMessages = {
  SUCCESS: "Vous avez été déconnecté avec succès",
  ALREADY_OUT: "Vous étiez déjà déconnecté",
  EXPIRED: "Votre session a expiré, vous avez été déconnecté automatiquement",
  FORCED: "Votre session a été terminée par un administrateur"
};
```

### Redirection Post-Logout
```typescript
// Configuration redirections
const PostLogoutConfig = {
  redirectUrl: '/login',
  preserveRedirectParam: true,    // ?redirect=/dashboard
  clearLocalStorage: true,        // Nettoyage côté client
  showNotification: true          // Toast de confirmation
};
```

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : LogoutService + Events avec logique métier
- [ ] **Application** : LogoutUser UseCase avec gestion complète
- [ ] **Infrastructure** : Session service + repositories étendus
- [ ] **Presentation** : Endpoint avec gestion cookies

### Security
- [ ] **Token revocation** : Révocation complète et sécurisée
- [ ] **Session cleanup** : Nettoyage de tous les caches
- [ ] **Cookie invalidation** : Cookies sécurisés invalidés
- [ ] **Audit trail** : Tous les logouts tracés

### Quality
- [ ] **Tests** : Couverture 100% avec cas concurrents
- [ ] **Performance** : Logout < 150ms p95
- [ ] **UX** : Messages clairs et redirections
- [ ] **Monitoring** : Métriques logout configurées

---

## 🔗 Dépendances

**Précédentes :** US02 (Access Protected Resources) - Authentification requise
**Suivantes :** US05 (Logout All Devices) - Extension de la déconnexion

---

**Priorité :** 🔶 **MEDIUM** - Important pour sécurité mais non bloquant MVP