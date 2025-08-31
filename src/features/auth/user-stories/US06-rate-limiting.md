# US06 : Protection Anti-Force Brute (Rate Limiting)

## 📋 User Story
**En tant que système de sécurité, je veux limiter automatiquement les tentatives de connexion échouées pour protéger les comptes utilisateurs contre les attaques par force brute et préserver les performances du système.**

**Valeur métier :** Prévenir les attaques automatisées, protéger les comptes utilisateurs, et maintenir la disponibilité du service.

---

## 🎯 Critères d'Acceptation Techniques

### 🛡️ Scénario 1 : Limitation par Email
```gherkin
GIVEN utilisateur avec email="john@esn.com" 
AND 5 tentatives échouées en moins de 15 minutes
WHEN nouvelle tentative POST /auth/login avec email="john@esn.com"
THEN status=429
AND response={"error":"Too many attempts","retryAfter":900,"code":"RATE_LIMITED"}
AND compteur d'échecs maintenu pendant 15 minutes
AND log de tentative bloquée généré
```

### 🛡️ Scénario 2 : Limitation par IP
```gherkin
GIVEN IP="192.168.1.100" avec 20 tentatives échouées en 15 minutes
AND tentatives sur différents emails depuis cette IP
WHEN nouvelle tentative depuis cette IP
THEN status=429  
AND response contient retryAfter approprié
AND toutes les tentatives depuis cette IP bloquées
```

### ✅ Scénario 3 : Reset après Succès
```gherkin
GIVEN email="john@esn.com" avec 3 tentatives échouées
WHEN POST /auth/login avec identifiants corrects
THEN status=200
AND compteur d'échecs pour email reset à 0
AND compteur d'échecs pour IP diminué
AND connexion réussie normale
```

### 🔄 Scénario 4 : Délai Progressif
```gherkin
GIVEN stratégie délai progressif activée
WHEN échecs successifs pour même email:
  - 1er échec: pas de délai
  - 2ème échec: 30 secondes
  - 3ème échec: 2 minutes  
  - 4ème échec: 5 minutes
  - 5ème échec: 15 minutes (maximum)
THEN délais appliqués progressivement
AND utilisateur informé du délai restant
```

### 🚨 Scénario 5 : Détection Attaque Sophistiquée
```gherkin
GIVEN attaque distributed depuis 50+ IPs différentes
AND même pattern temporel (100 req/min)
AND ciblage de comptes admin
WHEN détection de pattern suspect
THEN activation protection renforcée automatique
AND alertes sécurité déclenchées
AND blocage temporaire global pour comptes sensibles
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Value Object : RateLimit**
```typescript
class RateLimit {
  private constructor(
    private readonly _identifier: string,
    private readonly _attempts: number,
    private readonly _windowStart: Date,
    private readonly _blockedUntil?: Date
  ) {}

  static create(identifier: string): RateLimit
  static fromStorage(data: RateLimitData): RateLimit

  get identifier(): string
  get attempts(): number
  get windowStart(): Date
  get blockedUntil(): Date | undefined

  isBlocked(now: Date = new Date()): boolean
  canAttempt(maxAttempts: number, windowMs: number, now: Date = new Date()): boolean
  addAttempt(now: Date = new Date()): RateLimit
  reset(): RateLimit
  getRetryAfterSeconds(now: Date = new Date()): number
}

interface RateLimitData {
  identifier: string;
  attempts: number;
  windowStart: Date;
  blockedUntil?: Date;
}
```

**Service Domain : RateLimitService**
```typescript
class RateLimitService {
  constructor(
    private readonly rateLimitRepository: IRateLimitRepository,
    private readonly configService: IRateLimitConfigService
  ) {}

  async checkRateLimit(
    identifier: string, 
    type: RateLimitType
  ): Promise<RateLimitResult> {
    // Logique métier de vérification
  }

  async recordFailedAttempt(
    identifier: string, 
    type: RateLimitType
  ): Promise<RateLimitResult> {
    // Enregistrement d'une tentative échouée
  }

  async resetRateLimit(identifier: string, type: RateLimitType): Promise<void> {
    // Reset du compteur après succès
  }
}

enum RateLimitType {
  EMAIL = 'email',
  IP = 'ip',
  USER_ID = 'user_id',
  GLOBAL = 'global'
}

interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  maxAttempts: number;
  retryAfterSeconds?: number;
  windowStart: Date;
  resetAt: Date;
}
```

**Stratégies de Limitation**
```typescript
interface RateLimitStrategy {
  name: string;
  calculateDelay(attempts: number): number;
  getMaxAttempts(): number;
  getWindowMs(): number;
}

class FixedWindowStrategy implements RateLimitStrategy {
  name = 'FIXED_WINDOW';
  
  calculateDelay(attempts: number): number {
    return attempts >= this.getMaxAttempts() ? 15 * 60 : 0; // 15 min
  }
  
  getMaxAttempts(): number { return 5; }
  getWindowMs(): number { return 15 * 60 * 1000; } // 15 min
}

class ProgressiveDelayStrategy implements RateLimitStrategy {
  name = 'PROGRESSIVE_DELAY';
  
  calculateDelay(attempts: number): number {
    const delays = [0, 30, 120, 300, 900]; // 0s, 30s, 2min, 5min, 15min
    return delays[Math.min(attempts - 1, delays.length - 1)];
  }
  
  getMaxAttempts(): number { return 10; }
  getWindowMs(): number { return 60 * 60 * 1000; } // 1 hour
}
```

### 📋 Application Layer - Orchestration

**Use Case : CheckRateLimitUseCase**
```typescript
class CheckRateLimitUseCase implements IUseCase<CheckRateLimitRequest, CheckRateLimitResponse> {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly attackDetectionService: IAttackDetectionService
  ) {}

  async execute(request: CheckRateLimitRequest): Promise<CheckRateLimitResponse>
}

type CheckRateLimitRequest = {
  email?: string;              // Limitation par email
  ip: string;                 // Limitation par IP (toujours présente)
  userAgent?: string;         // Pour détection de patterns
  action: 'LOGIN' | 'REFRESH' | 'PASSWORD_RESET';
}

type CheckRateLimitResponse = {
  allowed: boolean;
  reason?: string;            // Raison du blocage si !allowed
  retryAfterSeconds?: number; // Délai avant prochaine tentative
  limits: {
    email?: RateLimitResult;
    ip: RateLimitResult;
  };
  attackDetected?: boolean;   // Attaque sophistiquée détectée
}
```

**Use Case : RecordFailedAttemptUseCase**
```typescript
class RecordFailedAttemptUseCase implements IUseCase<RecordFailedAttemptRequest, RecordFailedAttemptResponse> {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly attackDetectionService: IAttackDetectionService,
    private readonly alertService: IAlertService
  ) {}
}

type RecordFailedAttemptRequest = {
  email?: string;
  ip: string;
  userAgent?: string;
  action: 'LOGIN' | 'REFRESH' | 'PASSWORD_RESET';
  timestamp?: Date;
}

type RecordFailedAttemptResponse = {
  recorded: boolean;
  newLimits: {
    email?: RateLimitResult;
    ip: RateLimitResult;
  };
  alertTriggered?: boolean;
  emergencyMeasures?: string[];
}
```

### 🔧 Infrastructure Layer - Implémentations

**Repository Pattern**
```typescript
interface IRateLimitRepository {
  get(identifier: string, type: RateLimitType): Promise<RateLimit | null>
  set(rateLimit: RateLimit, type: RateLimitType, ttlSeconds: number): Promise<void>
  increment(identifier: string, type: RateLimitType, ttlSeconds: number): Promise<RateLimit>
  delete(identifier: string, type: RateLimitType): Promise<void>
  getMultiple(identifiers: string[], type: RateLimitType): Promise<Map<string, RateLimit>>
}

// Implémentation Redis optimisée
class RedisRateLimitRepository implements IRateLimitRepository {
  private readonly keyPrefix = 'rate_limit';
  
  private getKey(identifier: string, type: RateLimitType): string {
    return `${this.keyPrefix}:${type}:${identifier}`;
  }

  async increment(identifier: string, type: RateLimitType, ttlSeconds: number): Promise<RateLimit> {
    const key = this.getKey(identifier, type);
    const now = new Date();
    
    // Transaction atomique Redis
    const multi = this.redis.multi();
    multi.hincrby(key, 'attempts', 1);
    multi.hsetnx(key, 'windowStart', now.getTime());
    multi.expire(key, ttlSeconds);
    
    const results = await multi.exec();
    
    const attempts = results[0][1] as number;
    const windowStartMs = await this.redis.hget(key, 'windowStart');
    
    return RateLimit.fromStorage({
      identifier,
      attempts,
      windowStart: new Date(parseInt(windowStartMs)),
      blockedUntil: this.calculateBlockedUntil(attempts, now)
    });
  }
}
```

**Services Infrastructure**
```typescript
interface IAttackDetectionService {
  detectDistributedAttack(attempts: AttackAttempt[]): Promise<AttackAnalysis>
  detectBotBehavior(userAgent: string, timing: number[]): Promise<boolean>
  isHighValueTarget(email: string): Promise<boolean>
}

interface AttackAttempt {
  ip: string;
  email?: string;
  timestamp: Date;
  userAgent: string;
  success: boolean;
}

interface AttackAnalysis {
  isAttack: boolean;
  confidence: number;        // 0-1
  attackType: 'DISTRIBUTED' | 'BOT' | 'CREDENTIAL_STUFFING' | 'BRUTE_FORCE';
  targetedAccounts: string[];
  sourceIPs: string[];
  recommendations: string[];
}

class AttackDetectionService implements IAttackDetectionService {
  async detectDistributedAttack(attempts: AttackAttempt[]): Promise<AttackAnalysis> {
    // Analyse des patterns temporels
    // Détection de coordination entre IPs
    // Identification des comptes ciblés
    // Calcul de score de confiance
    
    const ipDistribution = this.analyzeIPDistribution(attempts);
    const temporalPatterns = this.analyzeTemporalPatterns(attempts);
    const targetAnalysis = this.analyzeTargets(attempts);
    
    return {
      isAttack: ipDistribution.suspicious && temporalPatterns.coordinated,
      confidence: this.calculateConfidence([ipDistribution, temporalPatterns, targetAnalysis]),
      attackType: this.classifyAttackType(attempts),
      targetedAccounts: targetAnalysis.highValueTargets,
      sourceIPs: ipDistribution.suspiciousIPs,
      recommendations: this.generateRecommendations(attempts)
    };
  }
}
```

### 🎮 Presentation Layer - Middleware & Guards

**Rate Limit Guard**
```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly checkRateLimitUseCase: CheckRateLimitUseCase
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Extraction des identifiants
    const ip = this.extractIP(request);
    const email = request.body?.email;
    const userAgent = request.headers['user-agent'];
    
    // Vérification rate limit
    const result = await this.checkRateLimitUseCase.execute({
      email,
      ip,
      userAgent,
      action: this.getActionFromRoute(request.route.path)
    });
    
    if (!result.allowed) {
      // Headers informatifs standard
      response.setHeader('X-RateLimit-Limit', this.getMaxAttempts());
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('X-RateLimit-Reset', this.calculateResetTime());
      
      if (result.retryAfterSeconds) {
        response.setHeader('Retry-After', result.retryAfterSeconds);
      }
      
      throw new HttpException({
        error: 'Too many attempts',
        code: 'RATE_LIMITED',
        retryAfter: result.retryAfterSeconds,
        timestamp: new Date().toISOString()
      }, HttpStatus.TOO_MANY_REQUESTS);
    }
    
    return true;
  }
}
```

**Decorator pour Configuration**
```typescript
// Decorator pour personnaliser le rate limiting par endpoint
export const RateLimit = (options: RateLimitOptions) => SetMetadata('rateLimit', options);

interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  strategy?: 'FIXED_WINDOW' | 'PROGRESSIVE_DELAY' | 'SLIDING_WINDOW';
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  identifiers?: ('IP' | 'EMAIL' | 'USER_ID')[];
}

// Usage
@Controller('auth')
export class AuthController {
  
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ 
    maxAttempts: 5, 
    windowMs: 15 * 60 * 1000,
    strategy: 'PROGRESSIVE_DELAY',
    identifiers: ['IP', 'EMAIL']
  })
  async login(@Body() loginDto: LoginDto) {
    // Implementation login
  }
  
  @Post('refresh')  
  @UseGuards(RateLimitGuard)
  @RateLimit({ 
    maxAttempts: 50, 
    windowMs: 60 * 1000,
    identifiers: ['IP']  // Refresh moins restrictif
  })
  async refresh(@Body() refreshDto: RefreshDto) {
    // Implementation refresh
  }
}
```

---

## 🔐 Configuration de Sécurité

### Configuration par Environnement
```typescript
const RateLimitConfig = {
  development: {
    enabled: true,
    strategies: {
      login: {
        maxAttempts: 10,       // Plus permissif en dev
        windowMs: 5 * 60 * 1000, // 5 minutes
        strategy: 'FIXED_WINDOW'
      }
    }
  },
  
  production: {
    enabled: true,
    strategies: {
      login: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        strategy: 'PROGRESSIVE_DELAY'
      },
      refresh: {
        maxAttempts: 100,
        windowMs: 60 * 1000, // 1 minute
        strategy: 'FIXED_WINDOW'
      },
      passwordReset: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 heure
        strategy: 'PROGRESSIVE_DELAY'
      }
    },
    attackDetection: {
      enabled: true,
      thresholds: {
        distributedAttackIPs: 10,     // 10+ IPs coordonnées
        botDetectionAccuracy: 0.8,    // 80% confiance
        emergencyLockdown: 0.95       // 95% confiance pour lockdown
      }
    }
  }
};
```

### Whitelist & Exceptions
```typescript
interface RateLimitExceptions {
  whitelistedIPs: string[];          // IPs exemptées (VPN d'entreprise, etc.)
  trustedUserAgents: string[];       // User agents de confiance
  emergencyBypass: {
    enabled: boolean;
    adminEmails: string[];           // Admins pouvant bypass
    bypassDuration: number;          // Durée du bypass en ms
  };
}
```

---

## 📊 Monitoring & Observabilité

### Métriques Temps Réel
```typescript
// Métriques Prometheus/Grafana
const RateLimitMetrics = {
  // Compteurs
  'rate_limit.attempts.total': 'Total tentatives par type/résultat',
  'rate_limit.blocks.total': 'Total blocages par raison',
  'rate_limit.attacks_detected.total': 'Attaques détectées',
  
  // Histogrammes
  'rate_limit.block_duration.histogram': 'Durée des blocages',
  'rate_limit.attempts_before_block.histogram': 'Tentatives avant blocage',
  
  // Jauges
  'rate_limit.active_blocks.gauge': 'Blocages actifs actuels',
  'rate_limit.attack_confidence.gauge': 'Niveau de confiance attaque'
};
```

### Dashboards de Sécurité
```json
{
  "dashboard": "Authentication Security",
  "panels": [
    {
      "title": "Login Attempts Rate",
      "query": "rate(auth_login_attempts_total[5m])",
      "alert": "rate > 10"
    },
    {
      "title": "Blocked IPs Map",
      "query": "rate_limit_blocks_by_ip",
      "visualization": "worldmap"
    },
    {
      "title": "Attack Confidence Score", 
      "query": "attack_detection_confidence",
      "alert": "confidence > 0.8"
    }
  ]
}
```

### Logs d'Analyse
```json
{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "rate_limit_exceeded",
  "identifier": "192.168.1.100",
  "identifierType": "IP",
  "attempts": 6,
  "maxAttempts": 5,
  "windowStart": "2024-01-01T11:45:00Z",
  "retryAfter": 900,
  "action": "LOGIN"
}

{
  "level": "CRITICAL",
  "timestamp": "2024-01-01T12:05:00Z", 
  "event": "distributed_attack_detected",
  "confidence": 0.92,
  "attackType": "DISTRIBUTED",
  "sourceIPs": ["192.168.1.100", "192.168.1.101", "..."],
  "targetedAccounts": ["admin@esn.com", "manager@esn.com"],
  "recommendedActions": ["EMERGENCY_LOCKDOWN", "NOTIFY_ADMINS"],
  "incidentId": "INC-2024-001235"
}
```

---

## 🚨 Réponse aux Incidents

### Procédures Automatiques
```typescript
interface AutomaticIncidentResponse {
  onHighConfidenceAttack(analysis: AttackAnalysis): Promise<void> {
    // 1. Blocage immédiat des IPs suspectes
    // 2. Protection renforcée des comptes ciblés  
    // 3. Notification admins + équipe sécurité
    // 4. Collecte logs étendus pour investigation
  }
  
  onEmergencyThresholdReached(): Promise<void> {
    // 1. Activation mode "lockdown" temporaire
    // 2. Blocage de tous les nouveaux logins (sauf whitelist)
    // 3. Révocation préventive de sessions suspectes
    // 4. Escalade vers équipe sécurité
  }
}
```

### Alertes & Notifications
```typescript
const AlertThresholds = {
  INFO: {
    dailyBlockedAttempts: 100,
    distinctBlockedIPs: 10
  },
  WARNING: {
    hourlyBlockedAttempts: 50,
    attackConfidence: 0.7,
    adminAccountTargeted: true
  },
  CRITICAL: {
    attackConfidence: 0.9,
    emergencyLockdownTriggered: true,
    massiveDistributedAttack: true
  }
};
```

---

## 🧪 Tests Spécifications

### Tests de Charge (Performance)
```typescript
describe('Rate Limiting Performance Tests', () => {
  it('should handle 1000 concurrent login attempts efficiently')
  it('should maintain Redis performance under high load') 
  it('should not impact legitimate users during attack')
  it('should scale horizontally across multiple instances')
})
```

### Tests de Sécurité (Penetration)
```typescript
describe('Rate Limiting Security Tests', () => {
  it('should block brute force attack after threshold')
  it('should detect distributed attack from multiple IPs')
  it('should prevent bypass attempts via header manipulation')
  it('should handle sophisticated timing attacks')
  it('should resist Redis cache evasion attempts')
})
```

### Tests d'Intégration
```typescript
describe('Rate Limiting Integration', () => {
  it('integrates correctly with login use case')
  it('preserves user experience for legitimate users')
  it('triggers proper alerts on attack detection')
  it('recovers gracefully from Redis failures')
})
```

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : RateLimit VO + RateLimitService avec stratégies
- [ ] **Application** : Check + Record UseCase avec détection attaque
- [ ] **Infrastructure** : Redis repository optimisé + détection service
- [ ] **Presentation** : Guard réutilisable + decorators

### Security
- [ ] **Attack detection** : IA simple détection patterns suspects
- [ ] **Emergency response** : Procédures automatiques lockdown
- [ ] **Whitelist management** : IPs/comptes exemptés configurables
- [ ] **Audit trail** : Traçabilité complète des blocages

### Operations
- [ ] **Monitoring** : Dashboards Grafana opérationnels
- [ ] **Alerting** : Notifications Slack/email configurées
- [ ] **Performance** : < 50ms impact sur login p95
- [ ] **Documentation** : Runbooks incident + configuration

---

## 🔗 Dépendances

**Précédentes :** US01 (User Authentication) - Intégration dans login
**Suivantes :** US07 (Security Monitoring) - Corrélation avec monitoring

---

**Priorité :** 🔥 **HIGH** - Sécurité critique contre attaques