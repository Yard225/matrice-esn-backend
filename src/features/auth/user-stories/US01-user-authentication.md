# US01 : Authentification Utilisateur

## 📋 User Story
**En tant qu'utilisateur de l'ESN, je veux m'authentifier avec email/password pour accéder aux ressources protégées.**

**Valeur métier :** Sécuriser l'accès aux données sensibles de l'entreprise et identifier les utilisateurs.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Login Réussi
```gherkin
GIVEN un utilisateur existe avec email="john@esn.com" et password hashé en base
AND l'utilisateur est actif (isActive=true)
WHEN POST /auth/login avec {"email":"john@esn.com","password":"plaintext123"}
THEN status=200
AND response contient accessToken JWT valide
AND response contient refreshToken opaque
AND user.lastLoginAt est mis à jour
```

### ❌ Scénario 2 : Email Inexistant
```gherkin
GIVEN aucun utilisateur avec email="unknown@esn.com"
WHEN POST /auth/login avec {"email":"unknown@esn.com","password":"any"}
THEN status=401
AND response={"error":"Invalid credentials","code":"AUTH_FAILED"}
AND tentative est loggée avec niveau WARNING
```

### ❌ Scénario 3 : Mot de Passe Incorrect
```gherkin
GIVEN utilisateur existe avec email="john@esn.com" 
AND password stocké != hash("wrongpassword")
WHEN POST /auth/login avec {"email":"john@esn.com","password":"wrongpassword"}
THEN status=401
AND response={"error":"Invalid credentials","code":"AUTH_FAILED"}
AND compteur d'échecs augmente de 1
```

### 🚫 Scénario 4 : Compte Désactivé
```gherkin
GIVEN utilisateur avec email="john@esn.com" et isActive=false
WHEN POST /auth/login avec identifiants corrects
THEN status=403
AND response={"error":"Account deactivated","code":"ACCOUNT_INACTIVE"}
```

### 🛡️ Scénario 5 : Rate Limiting
```gherkin
GIVEN 5 tentatives échouées pour email="john@esn.com" en moins de 15 minutes
WHEN nouvelle tentative de login
THEN status=429
AND response={"error":"Too many attempts","retryAfter":900,"code":"RATE_LIMITED"}
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité User**
```typescript
class User {
  props: {
    id: string;           // UUID v4
    email: Email;         // Value Object avec validation RFC
    password: string;     // Hash bcrypt (coût 12)
    firstName: string;
    lastName: string;
    role: string;         // USER, ADMIN, MANAGER
    department?: string;
    isActive: boolean;    // Statut du compte
    lastLoginAt?: Date;   // Timestamp dernière connexion
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Méthodes métier
  updateLastLogin(): void
  activate(): void
  deactivate(): void
  update(data: Partial<UserProps>): void
  get fullName(): string
}
```

**Value Object Email**
```typescript
class Email {
  private readonly _value: string;
  
  // Validation : format RFC 5322
  // Normalisation : toLowerCase(), trim()
  // Immutable après création
  
  static create(email: string): Email
  get value(): string
  equals(other: Email): boolean
}
```

**Exceptions Domain**
```typescript
class UserNotFoundException extends DomainException {
  constructor(message: string, code: string = 'USER_NOT_FOUND')
}

class InvalidCredentialsException extends DomainException {
  constructor(message: string = 'Invalid credentials provided')
}

class AccountDeactivatedException extends DomainException {
  constructor(message: string = 'Account is deactivated')
}

class TooManyAttemptsException extends DomainException {
  constructor(message: string, retryAfter: number)
}
```

### 📋 Application Layer - Orchestration

**Use Case : LoginUserUseCase**
```typescript
interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>
}

class LoginUserUseCase implements IUseCase<LoginRequest, LoginResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
    private readonly tokenService: ITokenService,
    private readonly rateLimitService: IRateLimitService
  )
}

type LoginRequest = {
  email: string;      // Format validé par DTO
  password: string;   // Plaintext (sera hashé pour comparaison)
}

type LoginResponse = {
  accessToken: string;    // JWT signé, exp=15min
  refreshToken: string;   // UUID v4, exp=30days
  tokenType: "Bearer";
  expiresIn: number;      // 900 secondes
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
1. **Rate Limiting** : `rateLimitService.canAttempt(email)`
2. **Validation** : `Email.create(email)` - validation format
3. **Recherche** : `userRepository.findByEmail(email)`
4. **Existence** : Si null → `UserNotFoundException`
5. **Statut** : Si `!isActive` → `AccountDeactivatedException`  
6. **Password** : `hashingService.verify(plaintext, stored)` 
7. **Vérification** : Si false → `InvalidCredentialsException` + `rateLimitService.recordFailure(email)`
8. **Succès** : 
   - `user.updateLastLogin()`
   - `userRepository.save(user)`
   - `rateLimitService.resetFailures(email)`
   - `tokenService.generateAccessToken(payload)`
   - `tokenService.generateRefreshToken(userId)`
   - Return `LoginResponse`

### 🔧 Infrastructure Layer - Implémentations

**Repository Pattern**
```typescript
interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  save(user: User): Promise<void>
  create(user: User): Promise<void>
}

// Implémentation TypeORM avec optimisation
class TypeOrmUserRepository implements IUserRepository {
  // Index sur email pour performance
  // Requêtes préparées pour sécurité
}
```

**Services Infrastructure**
```typescript
interface IHashingService {
  hash(plaintext: string): Promise<string>     // bcrypt.hash(password, 12)
  verify(plaintext: string, hash: string): Promise<boolean>
}

interface ITokenService {
  generateAccessToken(payload: TokenPayload): Promise<string>  // JWT RS256
  generateRefreshToken(userId: string): Promise<string>        // UUID stocké en DB
}

interface IRateLimitService {
  canAttempt(identifier: string): Promise<boolean>             // Redis: key=email, value=count
  recordFailure(identifier: string): Promise<void>             // TTL=15min
  resetFailures(identifier: string): Promise<void>
}
```

### 🎮 Presentation Layer - API Contract

**Endpoint Specification**
```http
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@esn.com",      // Required, email format
  "password": "mypassword123"   // Required, min 8 chars
}

Response Success (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3d4-...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "john@esn.com", 
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}

Response Error (401):
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED",
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (403):
{
  "error": "Account deactivated",
  "code": "ACCOUNT_INACTIVE",
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (429):
{
  "error": "Too many attempts",
  "code": "RATE_LIMITED",
  "retryAfter": 900,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Validation Rules (DTO)**
```typescript
class LoginDto {
  @IsEmail({}, { message: 'Email format invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Password doit être une string' })
  @MinLength(8, { message: 'Password min 8 caractères' })
  @IsNotEmpty({ message: 'Password requis' })
  password: string;
}
```

---

## 🔐 Spécifications Sécurité

### JWT Access Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "john@esn.com", 
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "iat": 1704067200,
    "exp": 1704068100,
    "iss": "matrice-esn-api",
    "aud": "matrice-esn-frontend"
  },
  "signature": "RS256_SIGNATURE" 
}
```

### Configuration Sécurité
```typescript
const SecurityConfig = {
  jwt: {
    algorithm: 'RS256',
    accessTokenTTL: 15 * 60,        // 15 minutes
    refreshTokenTTL: 30 * 24 * 60 * 60, // 30 jours
    issuer: 'matrice-esn-api',
    audience: 'matrice-esn-frontend'
  },
  bcrypt: {
    saltRounds: 12  // Coût recommandé 2024
  },
  rateLimiting: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,  // 15 minutes
    blockDurationMs: 15 * 60 * 1000
  }
}
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "user_login_success",
  "userId": "user-uuid",
  "email": "john@esn.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "duration": 145
}

{
  "level": "WARNING", 
  "timestamp": "2024-01-01T12:01:00Z",
  "event": "user_login_failed",
  "email": "john@esn.com",
  "reason": "invalid_credentials",
  "ip": "192.168.1.100",
  "attemptCount": 3
}
```

### Métriques Business
- `auth.login.success.count` - Connexions réussies
- `auth.login.failure.count` - Échecs par raison
- `auth.login.duration.histogram` - Temps de traitement
- `auth.rate_limit.blocked.count` - Blocages rate limit

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('User Entity', () => {
  it('should update lastLoginAt when updateLastLogin called')
  it('should deactivate user when deactivate called')
  it('should return fullName as "firstName lastName"')
})

describe('Email Value Object', () => {
  it('should create valid email from "test@domain.com"')
  it('should normalize email to lowercase')
  it('should throw InvalidEmailException for "invalid-email"')
  it('should return same hash for equal emails')
})
```

### Tests Use Case Application
```typescript
describe('LoginUserUseCase', () => {
  it('should return LoginResponse when valid credentials')
  it('should throw UserNotFoundException when email not found') 
  it('should throw InvalidCredentialsException when wrong password')
  it('should throw AccountDeactivatedException when user inactive')
  it('should throw TooManyAttemptsException when rate limited')
  it('should update user lastLoginAt on success')
  it('should reset rate limit counter on success')
  it('should record failure count on invalid credentials')
})
```

### Tests E2E Presentation
```typescript
describe('POST /auth/login', () => {
  it('returns 200 with tokens when valid credentials')
  it('returns 401 when invalid credentials') 
  it('returns 403 when account deactivated')
  it('returns 429 when rate limited')
  it('returns 400 when email format invalid')
  it('returns 400 when password too short')
  it('logs successful login event')
  it('logs failed login attempt')
})
```

---

## 🎯 Performance Requirements

- **Response time** : p95 < 200ms
- **Throughput** : 1000 req/s
- **Availability** : 99.9%
- **Error rate** : < 0.1%

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : Entités + VOs + Exceptions avec tests unitaires (100% coverage)
- [ ] **Application** : Use Case avec couverture 100% branches
- [ ] **Infrastructure** : Services implémentés avec tests intégration
- [ ] **Presentation** : Controller + validation + gestion erreurs

### Security
- [ ] **Rate limiting** : Implémenté et testé
- [ ] **Logging** : Events sécurité loggés
- [ ] **Monitoring** : Métriques en place
- [ ] **Review** : Code review sécurité validé

### Quality
- [ ] **Tests** : E2E passants + performance < 200ms p95
- [ ] **Documentation** : OpenAPI + README technique
- [ ] **Lint** : Code style respecté
- [ ] **Type safety** : TypeScript strict mode

---

## 🔗 Dépendances

**Précédentes :** Aucune (Story fondamentale)
**Suivantes :** US02 (Accès ressources protégées), US06 (Rate limiting)

---

**Priorité :** 🔥 **CRITICAL** - Fondement de tout le système d'authentification