# US02 : Accès aux Ressources Protégées

## 📋 User Story
**En tant qu'utilisateur authentifié, je veux accéder aux fonctionnalités protégées sans me reconnecter à chaque requête, en utilisant mon token d'accès.**

**Valeur métier :** Assurer une expérience utilisateur fluide tout en maintenant la sécurité des données sensibles.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Accès Autorisé avec Token Valide
```gherkin
GIVEN utilisateur authentifié avec accessToken valide
AND token contient claims valides (sub, exp, iat)
AND utilisateur existe et est actif en base
WHEN GET /api/protected-resource avec "Authorization: Bearer {token}"
THEN status=200
AND ressource est retournée
AND user context injecté dans request
```

### ❌ Scénario 2 : Token Manquant
```gherkin
GIVEN aucun header Authorization
WHEN GET /api/protected-resource
THEN status=401
AND response={"error":"Authentication required","code":"AUTH_MISSING"}
```

### ❌ Scénario 3 : Token Expiré
```gherkin
GIVEN accessToken avec exp < Date.now()
WHEN GET /api/protected-resource avec token expiré
THEN status=401
AND response={"error":"Token expired","code":"TOKEN_EXPIRED"}
AND log de tentative d'accès avec token expiré
```

### ❌ Scénario 4 : Token Invalide/Corrompu
```gherkin
GIVEN accessToken avec signature invalide ou malformé
WHEN GET /api/protected-resource avec token invalide
THEN status=401
AND response={"error":"Invalid token","code":"TOKEN_INVALID"}
AND incident loggé pour analyse sécurité
```

### ❌ Scénario 5 : Utilisateur Désactivé
```gherkin
GIVEN accessToken valide mais user.isActive=false
WHEN GET /api/protected-resource
THEN status=403
AND response={"error":"Account disabled","code":"ACCOUNT_DISABLED"}
```

### 🔒 Scénario 6 : Accès Basé sur les Rôles
```gherkin
GIVEN accessToken valide avec role="USER"
WHEN GET /api/admin-resource (require role="ADMIN")
THEN status=403
AND response={"error":"Insufficient permissions","code":"INSUFFICIENT_PERMISSIONS"}
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Validation Métier

**Value Object AccessToken**
```typescript
class AccessToken {
  private constructor(private readonly _value: string, private readonly _payload: TokenPayload) {}

  static fromJwtString(token: string): AccessToken {
    // Validation format JWT (3 parties séparées par points)
    // Validation encodage Base64URL
    // Extraction payload (sans vérification signature)
    // Validation présence claims obligatoires
  }

  static create(payload: TokenPayload): AccessToken {
    // Pour les tests et cas spéciaux
  }

  get value(): string
  get payload(): TokenPayload
  get sub(): string
  get role(): string
  get email(): string
  isExpired(): boolean
  hasRole(requiredRole: string): boolean
}

interface TokenPayload {
  sub: string;        // User ID
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat: number;        // Issued at
  exp: number;        // Expires at
  iss?: string;       // Issuer
  aud?: string;       // Audience
}
```

**Exceptions Domain**
```typescript
class InvalidTokenException extends DomainException {
  constructor(message: string = 'Invalid token format')
}

class TokenExpiredException extends DomainException {
  constructor(message: string = 'Token has expired')
}

class InsufficientPermissionsException extends DomainException {
  constructor(requiredRole: string, userRole: string)
}
```

### 📋 Application Layer - Orchestration

**Use Case : ValidateTokenUseCase**
```typescript
class ValidateTokenUseCase implements IUseCase<ValidateTokenRequest, ValidateTokenResponse> {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: ValidateTokenRequest): Promise<ValidateTokenResponse>
}

type ValidateTokenRequest = {
  token: string;               // JWT string extrait du header
  requiredRole?: string;       // Rôle requis pour l'accès (optionnel)
}

type ValidateTokenResponse = {
  isValid: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
  permissions: string[];       // Liste des permissions utilisateur
}
```

**Flux d'Exécution du Use Case**
1. **Format Validation** : `AccessToken.fromJwtString(token)` - validation structure
2. **Signature Verification** : `tokenService.verifyAccessToken(token)` - cryptographie
3. **Expiration Check** : Vérifier `exp` claim vs `Date.now()`
4. **User Existence** : `userRepository.findById(payload.sub)`
5. **User Status** : Vérifier `user.isActive`
6. **Role Check** : Si `requiredRole` → vérifier `user.role`
7. **Success** : Return `ValidateTokenResponse` avec user data

### 🔧 Infrastructure Layer - Implémentations

**Services Infrastructure**
```typescript
interface ITokenService {
  verifyAccessToken(token: string): Promise<TokenPayload>     // Vérification signature RS256
  extractTokenFromHeader(authHeader: string): string | null   // "Bearer {token}" extraction
}

class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.publicKey'),
      algorithms: ['RS256'],
      issuer: this.configService.get<string>('jwt.issuer'),
      audience: this.configService.get<string>('jwt.audience')
    });
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
  }
}
```

### 🎮 Presentation Layer - Guards & Middlewares

**Auth Guard Implementation**
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly validateTokenUseCase: ValidateTokenUseCase
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader) {
      throw new UnauthorizedException({
        error: 'Authentication required',
        code: 'AUTH_MISSING'
      });
    }

    const token = this.extractToken(authHeader);
    if (!token) {
      throw new UnauthorizedException({
        error: 'Invalid authorization format',
        code: 'AUTH_FORMAT_INVALID'
      });
    }

    try {
      const result = await this.validateTokenUseCase.execute({ token });
      request.user = result.user;  // Injection user context
      return true;
    } catch (error) {
      this.handleAuthError(error);
    }
  }
}
```

**Role Guard Implementation**
```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}
```

**Decorators**
```typescript
// Custom decorator pour extraction user
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Custom decorator pour rôles requis
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usage Examples**
```typescript
@Controller('api')
export class ProtectedController {
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: UserContext) {
    return { message: `Hello ${user.firstName}!` };
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  getUsers(@CurrentUser() user: UserContext) {
    return this.userService.findAll();
  }
}
```

---

## 🔐 Spécifications Sécurité

### Headers de Sécurité
```typescript
// Headers obligatoires pour les réponses
const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
};
```

### Configuration JWT
```typescript
const JwtConfig = {
  publicKey: process.env.JWT_PUBLIC_KEY,    // Clé publique RSA pour vérification
  privateKey: process.env.JWT_PRIVATE_KEY,  // Clé privée RSA pour signature
  algorithm: 'RS256',
  issuer: 'matrice-esn-api',
  audience: 'matrice-esn-frontend',
  clockTolerance: 30  // 30 secondes de tolérance pour sync horloges
};
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "token_validation_success",
  "userId": "user-uuid",
  "resource": "/api/profile",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "duration": 25
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:01:00Z",
  "event": "token_validation_failed",
  "reason": "token_expired",
  "resource": "/api/admin/users",
  "ip": "192.168.1.100",
  "tokenClaims": {
    "sub": "user-uuid",
    "exp": 1704067100
  }
}

{
  "level": "CRITICAL",
  "timestamp": "2024-01-01T12:02:00Z",
  "event": "invalid_token_access_attempt",
  "reason": "signature_invalid",
  "resource": "/api/sensitive-data",
  "ip": "192.168.1.100",
  "suspiciousActivity": true
}
```

### Métriques Business
- `auth.token.validation.success.count` - Validations réussies
- `auth.token.validation.failure.count` - Échecs par raison (expired, invalid, missing)
- `auth.token.validation.duration.histogram` - Temps de validation
- `auth.access.denied.count` - Accès refusés par rôle insuffisant

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('AccessToken Value Object', () => {
  it('should create from valid JWT string')
  it('should throw InvalidTokenException for malformed JWT')
  it('should throw InvalidTokenException for invalid Base64URL')
  it('should extract correct payload from JWT')
  it('should return true for isExpired when exp < now')
  it('should return true for hasRole when user role matches required')
})
```

### Tests Use Case Application
```typescript
describe('ValidateTokenUseCase', () => {
  it('should return valid response when token is valid and user active')
  it('should throw InvalidTokenException when token format invalid')
  it('should throw TokenExpiredException when token expired')
  it('should throw UserNotFoundException when user not found')
  it('should throw AccountDisabledException when user inactive')
  it('should throw InsufficientPermissionsException when role insufficient')
})
```

### Tests E2E Presentation
```typescript
describe('Auth Guard Integration', () => {
  it('allows access with valid token')
  it('blocks access without Authorization header')
  it('blocks access with malformed token')
  it('blocks access with expired token')
  it('blocks access when user account disabled')
  it('injects user context into request when valid')
  it('blocks role-protected endpoint with insufficient role')
})
```

### Tests de Sécurité
```typescript
describe('Security Tests', () => {
  it('should reject JWT with invalid signature')
  it('should reject JWT with tampered payload')
  it('should reject JWT from wrong issuer')
  it('should handle clock skew within tolerance')
  it('should log suspicious token access attempts')
})
```

---

## 🎯 Performance Requirements

- **Token validation** : p95 < 50ms
- **Guard execution** : p95 < 25ms
- **Cache hit ratio** : > 95% (pour user data)
- **Memory usage** : < 10MB per 1000 concurrent users

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : AccessToken VO avec validation complète
- [ ] **Application** : ValidateToken UseCase avec gestion erreurs
- [ ] **Infrastructure** : JWT service avec RS256
- [ ] **Presentation** : Guards réutilisables + decorators

### Security  
- [ ] **Token validation** : Signature, expiration, claims
- [ ] **Role-based access** : Guards par rôle implémentés
- [ ] **Security headers** : Headers sécurité configurés
- [ ] **Audit logs** : Événements sécurité loggés

### Quality
- [ ] **Tests** : Couverture 100% avec cas de sécurité
- [ ] **Performance** : Validation < 50ms p95
- [ ] **Documentation** : Guards usage + exemples
- [ ] **Integration** : Compatible avec tous controllers

---

## 🔗 Dépendances

**Précédentes :** US01 (User Authentication) - Génération des tokens
**Suivantes :** US03 (Token Refresh) - Renouvellement tokens expirés

---

**Priorité :** 🔥 **HIGH** - Nécessaire pour toute fonctionnalité protégée