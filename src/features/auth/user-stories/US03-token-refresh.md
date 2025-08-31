# US03 : Renouvellement de Token d'Accès

## 📋 User Story
**En tant qu'utilisateur dont le token d'accès a expiré, je veux pouvoir renouveler automatiquement mon accès sans saisir mes identifiants, pour une expérience continue et sécurisée.**

**Valeur métier :** Maintenir la session utilisateur active tout en limitant l'exposition des tokens d'accès à courte durée.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Renouvellement Réussi
```gherkin
GIVEN utilisateur avec refreshToken valide en base
AND refreshToken non expiré (createdAt + TTL > now)
AND refreshToken non révoqué
AND utilisateur toujours actif
WHEN POST /auth/refresh avec {"refreshToken": "uuid-valid"}
THEN status=200
AND response contient nouveau accessToken
AND response contient nouveau refreshToken (rotation)
AND ancien refreshToken marqué comme révoqué
```

### ❌ Scénario 2 : Refresh Token Invalide
```gherkin
GIVEN refreshToken "invalid-uuid" inexistant en base
WHEN POST /auth/refresh avec {"refreshToken": "invalid-uuid"}
THEN status=401
AND response={"error":"Invalid refresh token","code":"REFRESH_TOKEN_INVALID"}
AND tentative loggée pour sécurité
```

### ❌ Scénario 3 : Refresh Token Expiré
```gherkin
GIVEN refreshToken en base avec createdAt + TTL < now
WHEN POST /auth/refresh avec refreshToken expiré
THEN status=401
AND response={"error":"Refresh token expired","code":"REFRESH_TOKEN_EXPIRED"}
AND token expiré supprimé de la base
```

### ❌ Scénario 4 : Refresh Token Révoqué
```gherkin
GIVEN refreshToken avec isRevoked=true
WHEN POST /auth/refresh avec token révoqué
THEN status=401
AND response={"error":"Refresh token revoked","code":"REFRESH_TOKEN_REVOKED"}
```

### 🚫 Scénario 5 : Utilisateur Désactivé
```gherkin
GIVEN refreshToken valide mais user.isActive=false
WHEN POST /auth/refresh
THEN status=403
AND response={"error":"Account deactivated","code":"ACCOUNT_INACTIVE"}
AND tous les refreshTokens de l'utilisateur révoqués
```

### 🔄 Scénario 6 : Rotation Optionnelle
```gherkin
GIVEN configuration refresh.rotation=true
WHEN POST /auth/refresh avec token valide
THEN nouveau accessToken généré
AND nouveau refreshToken généré
AND ancien refreshToken marqué révoqué
AND nouveau refreshToken stocké en base
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité RefreshToken**
```typescript
class RefreshToken {
  props: {
    id: string;           // UUID v4 - identifiant unique
    userId: string;       // Référence vers User
    token: string;        // UUID v4 - token opaque
    isRevoked: boolean;   // Statut de révocation
    createdAt: Date;      // Date de création
    expiresAt: Date;      // Date d'expiration
    lastUsedAt?: Date;    // Dernière utilisation
    deviceInfo?: string;  // Métadonnées appareil (IP, User-Agent)
  }

  // Méthodes métier
  isExpired(): boolean
  isValid(): boolean      // !isRevoked && !isExpired()
  revoke(): void
  updateLastUsed(): void
  static create(userId: string, deviceInfo?: string): RefreshToken
}
```

**Value Object RefreshTokenValue**
```typescript
class RefreshTokenValue {
  private constructor(private readonly _value: string) {}

  static create(token: string): RefreshTokenValue {
    // Validation format UUID v4
    // Validation non-empty
  }

  get value(): string
  equals(other: RefreshTokenValue): boolean
}
```

**Exceptions Domain**
```typescript
class RefreshTokenNotFoundException extends DomainException {
  constructor(tokenId: string)
}

class RefreshTokenExpiredException extends DomainException {
  constructor(tokenId: string, expiresAt: Date)
}

class RefreshTokenRevokedException extends DomainException {
  constructor(tokenId: string)
}
```

### 📋 Application Layer - Orchestration

**Use Case : RefreshAccessTokenUseCase**
```typescript
class RefreshAccessTokenUseCase implements IUseCase<RefreshTokenRequest, RefreshTokenResponse> {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly configService: IConfigService
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>
}

type RefreshTokenRequest = {
  refreshToken: string;    // UUID string
  deviceInfo?: {           // Métadonnées optionnelles
    ip: string;
    userAgent: string;
  }
}

type RefreshTokenResponse = {
  accessToken: string;     // Nouveau JWT, exp=15min
  refreshToken: string;    // Nouveau UUID (si rotation activée)
  tokenType: "Bearer";
  expiresIn: number;       // 900 secondes
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }
}
```

**Flux d'Exécution du Use Case**
1. **Validation Format** : `RefreshTokenValue.create(token)` - validation UUID
2. **Recherche Token** : `refreshTokenRepository.findByToken(token)`
3. **Existence** : Si null → `RefreshTokenNotFoundException`
4. **Validité** : Si `!isValid()` → exception appropriée (expired/revoked)
5. **Recherche User** : `userRepository.findById(refreshToken.userId)`
6. **Statut User** : Si `!isActive` → révocation de tous ses tokens + exception
7. **Mise à jour** : `refreshToken.updateLastUsed()`
8. **Rotation** : Si activée → créer nouveau refresh token + révoquer ancien
9. **Génération** : 
   - `tokenService.generateAccessToken(userPayload)`
   - Si rotation : `tokenService.generateRefreshToken(userId)`
10. **Persistance** : Sauvegarder état des tokens
11. **Response** : Return `RefreshTokenResponse`

### 🔧 Infrastructure Layer - Implémentations

**Repository Pattern**
```typescript
interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>
  findByUserId(userId: string): Promise<RefreshToken[]>
  save(refreshToken: RefreshToken): Promise<void>
  create(refreshToken: RefreshToken): Promise<void>
  revokeAllByUserId(userId: string): Promise<void>
  deleteExpired(): Promise<number>  // Cleanup automatique
}

// Implémentation avec optimisations
class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  // Index sur token pour recherche O(1)
  // Index sur userId pour révocation par utilisateur
  // TTL automatique pour cleanup des tokens expirés
}
```

**Services Infrastructure**
```typescript
interface ITokenService {
  generateRefreshToken(userId: string, deviceInfo?: string): Promise<string>
  // ... autres méthodes existantes
}

class JwtTokenService implements ITokenService {
  async generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + this.configService.get('jwt.refreshTokenTTL') * 1000);
    
    const refreshToken = RefreshToken.create(userId, deviceInfo);
    await this.refreshTokenRepository.create(refreshToken);
    
    return token;
  }
}
```

### 🎮 Presentation Layer - API Contract

**Endpoint Specification**
```http
POST /auth/refresh
Content-Type: application/json

Request Body:
{
  "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  // Required, UUID v4
}

Response Success (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "new-uuid-if-rotation-enabled",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid",
    "email": "john@esn.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}

Response Error (401 - Invalid):
{
  "error": "Invalid refresh token",
  "code": "REFRESH_TOKEN_INVALID",
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (401 - Expired):
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED",
  "expiredAt": "2024-01-01T11:00:00Z",
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (403 - Account Disabled):
{
  "error": "Account deactivated",
  "code": "ACCOUNT_INACTIVE",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Validation Rules (DTO)**
```typescript
class RefreshTokenDto {
  @IsUUID(4, { message: 'RefreshToken doit être un UUID v4 valide' })
  @IsNotEmpty({ message: 'RefreshToken requis' })
  refreshToken: string;
}
```

**Controller Implementation**
```typescript
@Controller('auth')
export class AuthController {
  
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<RefreshTokenResponse> {
    return this.refreshAccessTokenUseCase.execute({
      refreshToken: refreshDto.refreshToken,
      deviceInfo: { ip, userAgent }
    });
  }
}
```

---

## 🔐 Spécifications Sécurité

### Configuration Tokens
```typescript
const TokenConfig = {
  refreshToken: {
    ttl: 30 * 24 * 60 * 60,      // 30 jours en secondes
    rotation: true,               // Rotation automatique activée
    maxActiveTokens: 5,          // Max 5 tokens actifs par utilisateur
    cleanupInterval: '0 2 * * *' // Cleanup quotidien à 2h
  },
  accessToken: {
    ttl: 15 * 60,                // 15 minutes
    algorithm: 'RS256'
  }
}
```

### Sécurité Renforcée
```typescript
// Détection d'usage suspect
interface RefreshTokenSecurityChecks {
  detectConcurrentRefresh(userId: string, token: string): Promise<boolean>  // Usage simultané
  detectGeographicAnomaly(userId: string, ip: string): Promise<boolean>     // Localisation suspecte
  rateLimitRefresh(userId: string): Promise<boolean>                        // Limite fréquence refresh
}
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "refresh_token_success",
  "userId": "user-uuid",
  "tokenId": "token-uuid",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "rotationEnabled": true,
  "duration": 85
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:01:00Z",
  "event": "refresh_token_failed",
  "reason": "token_expired",
  "tokenId": "token-uuid",
  "expiredAt": "2024-01-01T11:30:00Z",
  "ip": "192.168.1.100"
}

{
  "level": "CRITICAL",
  "timestamp": "2024-01-01T12:02:00Z",
  "event": "suspicious_refresh_activity",
  "userId": "user-uuid",
  "reason": "concurrent_usage",
  "details": "Same refresh token used from multiple IPs simultaneously"
}
```

### Métriques Business
- `auth.refresh.success.count` - Renouvellements réussis
- `auth.refresh.failure.count` - Échecs par raison (expired, invalid, revoked)
- `auth.refresh.duration.histogram` - Temps de traitement
- `auth.refresh.rotation.count` - Nombre de rotations effectuées
- `auth.refresh.cleanup.count` - Tokens expirés nettoyés

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('RefreshToken Entity', () => {
  it('should create refresh token with valid userId')
  it('should return true for isExpired when past expiresAt')
  it('should return false for isValid when revoked')
  it('should update lastUsedAt when updateLastUsed called')
  it('should generate unique token on creation')
})

describe('RefreshTokenValue VO', () => {
  it('should create from valid UUID v4')
  it('should throw exception for invalid UUID format')
  it('should return same hash for equal tokens')
})
```

### Tests Use Case Application
```typescript
describe('RefreshAccessTokenUseCase', () => {
  it('should return new tokens when refresh token valid')
  it('should throw RefreshTokenNotFoundException when token not found')
  it('should throw RefreshTokenExpiredException when token expired')
  it('should throw RefreshTokenRevokedException when token revoked')
  it('should revoke all user tokens when user deactivated')
  it('should rotate refresh token when rotation enabled')
  it('should update lastUsedAt on successful refresh')
  it('should cleanup expired token on expiration detection')
})
```

### Tests E2E Presentation
```typescript
describe('POST /auth/refresh', () => {
  it('returns 200 with new tokens when valid refresh token')
  it('returns 401 when refresh token not found')
  it('returns 401 when refresh token expired')
  it('returns 401 when refresh token revoked')
  it('returns 403 when user account deactivated')
  it('returns 400 when refresh token format invalid')
  it('rotates refresh token when rotation enabled')
  it('logs refresh events properly')
})
```

### Tests de Sécurité
```typescript
describe('Refresh Security Tests', () => {
  it('should detect concurrent refresh token usage')
  it('should rate limit refresh attempts per user')
  it('should revoke all tokens when suspicious activity detected')
  it('should cleanup expired tokens automatically')
  it('should limit max active tokens per user')
})
```

---

## 🔧 Tâches de Maintenance

### Cleanup Automatique
```typescript
// Job CRON pour nettoyage quotidien
@Cron('0 2 * * *')  // Tous les jours à 2h
async cleanupExpiredTokens(): Promise<void> {
  const deleted = await this.refreshTokenRepository.deleteExpired();
  this.logger.log(`Cleaned up ${deleted} expired refresh tokens`);
}
```

### Monitoring Santé
```typescript
// Health check pour les refresh tokens
@HealthIndicator()
async isRefreshTokenHealthy(): Promise<HealthIndicatorResult> {
  const activeTokens = await this.refreshTokenRepository.countActive();
  const isHealthy = activeTokens < 100000;  // Seuil d'alerte
  
  return this.getStatus('refresh_tokens', isHealthy, { activeTokens });
}
```

---

## 🎯 Performance Requirements

- **Refresh time** : p95 < 100ms
- **Database queries** : Max 3 par refresh (find, update, create)
- **Memory usage** : < 1KB per active refresh token
- **Cleanup efficiency** : < 5s pour 10k tokens expirés

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : RefreshToken entity + VO avec validations
- [ ] **Application** : RefreshAccessToken UseCase avec rotation
- [ ] **Infrastructure** : Repository avec index optimisés
- [ ] **Presentation** : Endpoint avec validation complète

### Security
- [ ] **Token rotation** : Implémenté selon configuration
- [ ] **Cleanup automatique** : Job CRON fonctionnel
- [ ] **Rate limiting** : Protection contre abus refresh
- [ ] **Audit trail** : Logs sécurité complets

### Quality
- [ ] **Tests** : Couverture 100% avec cas edge
- [ ] **Performance** : Refresh < 100ms p95
- [ ] **Monitoring** : Métriques et alertes configurées
- [ ] **Documentation** : Flow de refresh documenté

---

## 🔗 Dépendances

**Précédentes :** US01 (User Authentication) - Génération refresh tokens
**Suivantes :** US04 (User Logout) - Révocation des refresh tokens

---

**Priorité :** 🔶 **MEDIUM** - Améliore UX mais non bloquant pour MVP