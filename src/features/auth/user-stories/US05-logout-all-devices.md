# US05 : Déconnexion de Tous les Appareils

## 📋 User Story
**En tant qu'utilisateur soucieux de la sécurité, je veux pouvoir me déconnecter de tous mes appareils/sessions en une seule action, pour m'assurer qu'aucun accès non autorisé ne persiste.**

**Valeur métier :** Renforcer la sécurité en permettant la révocation globale des sessions lors de suspicion de compromission ou changement de mot de passe.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Déconnexion Globale Réussie
```gherkin
GIVEN utilisateur authentifié avec 3 sessions actives sur différents appareils
AND chaque session a un refreshToken actif
WHEN POST /auth/logout-all avec "Authorization: Bearer {accessToken}"
THEN status=200
AND tous les refreshTokens de l'utilisateur révoqués (isRevoked=true)
AND toutes les sessions Redis/cache supprimées
AND response contient nombre de sessions terminées
AND utilisateur doit se reconnecter sur tous ses appareils
```

### 🔒 Scénario 2 : Déconnexion Globale par Admin
```gherkin
GIVEN admin authentifié avec rôle ADMIN
AND utilisateur cible avec plusieurs sessions actives
WHEN POST /admin/users/{userId}/logout-all
THEN status=200
AND tous les refreshTokens de l'utilisateur cible révoqués
AND notification envoyée à l'utilisateur (optionnel)
AND action auditée avec détails admin
```

### ❌ Scénario 3 : Aucune Session Active
```gherkin
GIVEN utilisateur authentifié mais aucun refreshToken actif en base
WHEN POST /auth/logout-all
THEN status=200
AND response={"message":"No active sessions found","sessionsTerminated":0}
AND action loggée comme déconnexion redondante
```

### ⚠️ Scénario 4 : Session Courante Préservée (Optionnel)
```gherkin
GIVEN configuration preserveCurrentSession=true
AND utilisateur avec 3 sessions dont 1 courante
WHEN POST /auth/logout-all avec paramètre keepCurrent=true
THEN status=200
AND 2 sessions terminées, 1 préservée (session courante)
AND response indique sessions terminées vs préservées
```

### 🚨 Scénario 5 : Déconnexion d'Urgence
```gherkin
GIVEN suspicion de compromission détectée par le système
WHEN déclenchement automatique de logout-all
THEN tous les refreshTokens utilisateur révoqués immédiatement
AND notification push/email envoyée à l'utilisateur
AND alerte sécurité générée pour investigation
AND utilisateur forcé à se reconnecter avec validation supplémentaire
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Service Domain : GlobalLogoutService**
```typescript
class GlobalLogoutService {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly sessionService: ISessionService,
    private readonly eventBus: IEventBus
  ) {}

  async logoutAllDevices(
    userId: string, 
    options: GlobalLogoutOptions
  ): Promise<GlobalLogoutResult> {
    // Logique métier de déconnexion globale
    // Gestion des options (préserver session courante, etc.)
    // Publication d'événements domain
  }
}

interface GlobalLogoutOptions {
  preserveCurrentSession?: boolean;    // Garder la session courante
  currentTokenId?: string;            // ID du token à préserver
  triggeredBy: 'USER' | 'ADMIN' | 'SYSTEM';  // Origine de la déconnexion
  reason?: string;                    // Raison (security, password_change, etc.)
  notifyUser?: boolean;              // Notification à l'utilisateur
}

interface GlobalLogoutResult {
  success: boolean;
  sessionsTerminated: number;
  tokensRevoked: number;
  sessionsPreserved: number;
  timestamp: Date;
  triggeredBy: string;
}
```

**Événements Domain**
```typescript
class AllDevicesLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionsTerminated: number,
    public readonly triggeredBy: 'USER' | 'ADMIN' | 'SYSTEM',
    public readonly reason?: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

class SecurityIncidentTriggeredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly incidentType: 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE' | 'MANUAL_REVOCATION',
    public readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    public readonly metadata: Record<string, any>
  ) {}
}
```

### 📋 Application Layer - Orchestration

**Use Case : LogoutAllDevicesUseCase**
```typescript
class LogoutAllDevicesUseCase implements IUseCase<LogoutAllRequest, LogoutAllResponse> {
  constructor(
    private readonly globalLogoutService: GlobalLogoutService,
    private readonly userRepository: IUserRepository,
    private readonly notificationService: INotificationService,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: LogoutAllRequest): Promise<LogoutAllResponse>
}

type LogoutAllRequest = {
  userId: string;                     // Utilisateur cible
  currentTokenId?: string;           // Token courant à préserver (optionnel)
  keepCurrentSession?: boolean;      // Préserver session courante
  triggeredBy: 'USER' | 'ADMIN' | 'SYSTEM';
  adminId?: string;                  // ID admin si déconnexion forcée
  reason?: string;                   // Raison de la déconnexion globale
  deviceInfo?: {
    ip: string;
    userAgent: string;
  }
}

type LogoutAllResponse = {
  message: string;                   // "All devices logged out successfully"
  code: string;                     // "LOGOUT_ALL_SUCCESS"
  sessionsTerminated: number;        // Nombre de sessions terminées
  tokensRevoked: number;            // Nombre de tokens révoqués  
  sessionsPreserved: number;        // Nombre de sessions préservées
  notificationSent: boolean;        // Notification utilisateur envoyée
  timestamp: Date;
}
```

**Flux d'Exécution du Use Case**
1. **Validation User** : `userRepository.findById(userId)` - vérifier existence
2. **Audit Début** : Enregistrer début de déconnexion globale
3. **Recherche Sessions** : `refreshTokenRepository.findActiveByUserId(userId)`
4. **Filtrage** : Si `keepCurrentSession=true` → exclure `currentTokenId`
5. **Révocation Batch** : Révoquer tous les tokens sélectionnés
6. **Nettoyage Sessions** : `sessionService.clearAllUserSessions(userId, exceptions)`
7. **Événements** : Publier `AllDevicesLoggedOutEvent`
8. **Notification** : Si `notifyUser=true` → notifier par email/push
9. **Audit Fin** : Enregistrer résultat avec statistiques
10. **Response** : Return `LogoutAllResponse`

### 🔧 Infrastructure Layer - Implémentations

**Extended Repository**
```typescript
interface IRefreshTokenRepository {
  // ... méthodes existantes
  findActiveByUserId(userId: string): Promise<RefreshToken[]>
  revokeAllByUserId(userId: string, except?: string[]): Promise<number>
  getActiveSessionsInfo(userId: string): Promise<SessionInfo[]>
}

interface SessionInfo {
  tokenId: string;
  deviceInfo: string;
  ip: string;
  lastUsed: Date;
  location?: string;  // Géolocalisation si disponible
}
```

**Notification Service**
```typescript
interface INotificationService {
  sendSecurityAlert(userId: string, event: SecurityAlertEvent): Promise<boolean>
  sendGlobalLogoutNotification(userId: string, details: LogoutDetails): Promise<boolean>
}

interface SecurityAlertEvent {
  type: 'ALL_DEVICES_LOGOUT';
  timestamp: Date;
  triggeredBy: string;
  sessionsAffected: number;
  reason?: string;
}
```

**Enhanced Session Service**
```typescript
interface ISessionService {
  // ... méthodes existantes
  clearAllUserSessions(userId: string, except?: string[]): Promise<number>
  getUserSessionsCount(userId: string): Promise<number>
  getSessionDetails(userId: string): Promise<SessionInfo[]>
}

class RedisSessionService implements ISessionService {
  async clearAllUserSessions(userId: string, except: string[] = []): Promise<number> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    // Filtrer les sessions à préserver
    const keysToDelete = except.length > 0 
      ? keys.filter(key => !except.some(exception => key.includes(exception)))
      : keys;
    
    if (keysToDelete.length > 0) {
      return await this.redis.del(...keysToDelete);
    }
    return 0;
  }
}
```

### 🎮 Presentation Layer - API Contract

**Endpoint Utilisateur**
```http
POST /auth/logout-all
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body (optionnel):
{
  "keepCurrentSession": false,    // Préserver session courante
  "reason": "security_concern"    // Raison de la déconnexion
}

Response Success (200):
{
  "message": "All devices logged out successfully",
  "code": "LOGOUT_ALL_SUCCESS", 
  "sessionsTerminated": 4,
  "tokensRevoked": 4,
  "sessionsPreserved": 0,
  "notificationSent": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Endpoint Admin**
```http
POST /admin/users/{userId}/logout-all
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "reason": "security_violation",     // Raison obligatoire pour admin
  "notifyUser": true                 // Notifier l'utilisateur
}

Response Success (200):
{
  "message": "User sessions terminated by admin",
  "code": "ADMIN_LOGOUT_ALL_SUCCESS",
  "userId": "target-user-id",
  "sessionsTerminated": 3,
  "tokensRevoked": 3, 
  "adminId": "admin-user-id",
  "reason": "security_violation",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Controller Implementations**
```typescript
@Controller('auth')
export class AuthController {
  
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(
    @CurrentUser() user: UserContext,
    @Body() logoutAllDto: LogoutAllDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('authorization') authHeader: string
  ): Promise<LogoutAllResponse> {
    
    const currentToken = this.tokenService.extractTokenFromHeader(authHeader);
    
    return this.logoutAllDevicesUseCase.execute({
      userId: user.id,
      currentTokenId: logoutAllDto.keepCurrentSession ? currentToken : undefined,
      keepCurrentSession: logoutAllDto.keepCurrentSession,
      triggeredBy: 'USER',
      reason: logoutAllDto.reason,
      deviceInfo: { ip, userAgent }
    });
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  
  @Post('users/:userId/logout-all')
  @HttpCode(200)
  async adminLogoutAll(
    @Param('userId') targetUserId: string,
    @CurrentUser() admin: UserContext,
    @Body() adminLogoutDto: AdminLogoutAllDto
  ): Promise<LogoutAllResponse> {
    
    return this.logoutAllDevicesUseCase.execute({
      userId: targetUserId,
      triggeredBy: 'ADMIN',
      adminId: admin.id,
      reason: adminLogoutDto.reason,
      deviceInfo: undefined // Admin actions don't need device info
    });
  }
}
```

**Validation DTOs**
```typescript
class LogoutAllDto {
  @IsOptional()
  @IsBoolean()
  keepCurrentSession?: boolean = false;
  
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

class AdminLogoutAllDto {
  @IsNotEmpty({ message: 'Reason required for admin logout' })
  @IsString()
  @MaxLength(500)
  reason: string;
  
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}
```

---

## 🔐 Spécifications Sécurité

### Matrice d'Autorisation
```typescript
const LogoutAllPermissions = {
  USER: {
    canLogoutOwnDevices: true,
    canPreserveCurrentSession: true,
    requiresReason: false
  },
  ADMIN: {
    canLogoutOtherUsers: true,
    canLogoutOwnDevices: true,
    requiresReason: true,
    auditRequired: true
  },
  SYSTEM: {
    canForceLogoutAny: true,
    bypassAllChecks: true,
    criticalAudit: true
  }
};
```

### Déclencheurs Automatiques
```typescript
// Situations déclenchant un logout automatique
const AutoLogoutTriggers = {
  PASSWORD_CHANGE: true,        // Changement de mot de passe
  ACCOUNT_COMPROMISE: true,     // Détection de compromission
  ADMIN_SUSPENSION: true,       // Suspension par admin
  SECURITY_POLICY: true,        // Violation politique sécurité
  INACTIVITY_THRESHOLD: false   // Inactivité prolongée (configurable)
};
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "logout_all_devices_success",
  "userId": "user-uuid",
  "triggeredBy": "USER",
  "sessionsTerminated": 4,
  "tokensRevoked": 4,
  "sessionsPreserved": 0,
  "reason": "security_concern",
  "ip": "192.168.1.100",
  "duration": 120
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:01:00Z",
  "event": "admin_forced_logout_all",
  "adminId": "admin-uuid",
  "targetUserId": "user-uuid",
  "reason": "security_violation",
  "sessionsTerminated": 3,
  "notificationSent": true,
  "auditTrail": "ADMIN_ACTION_002451"
}

{
  "level": "CRITICAL",
  "timestamp": "2024-01-01T12:02:00Z",
  "event": "system_triggered_logout_all",
  "userId": "user-uuid",
  "trigger": "ACCOUNT_COMPROMISE",
  "severity": "HIGH",
  "sessionsTerminated": 5,
  "incidentId": "INC-2024-001234"
}
```

### Métriques Business
- `auth.logout_all.success.count` - Déconnexions globales réussies
- `auth.logout_all.triggered_by.count` - Par origine (user/admin/system)
- `auth.logout_all.sessions_terminated.histogram` - Sessions terminées par opération
- `auth.logout_all.duration.histogram` - Temps de traitement
- `auth.logout_all.notifications_sent.count` - Notifications envoyées

### Dashboards de Sécurité
```typescript
// Métriques pour tableau de bord sécurité
const SecurityMetrics = {
  dailyGlobalLogouts: 'Déconnexions globales par jour',
  adminForcedLogouts: 'Déconnexions forcées par admin',
  systemTriggeredLogouts: 'Déconnexions automatiques système',
  averageSessionsPerUser: 'Nombre moyen de sessions par utilisateur',
  suspiciousLogoutPatterns: 'Patterns de déconnexion suspects'
};
```

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('GlobalLogoutService', () => {
  it('should revoke all refresh tokens for user')
  it('should preserve current session when requested')
  it('should clear all user sessions except preserved ones')
  it('should publish AllDevicesLoggedOutEvent on success')
  it('should handle empty active sessions gracefully')
})
```

### Tests Use Case Application
```typescript
describe('LogoutAllDevicesUseCase', () => {
  it('should logout all devices successfully for user request')
  it('should logout all devices for admin request with audit')
  it('should preserve current session when keepCurrentSession=true')
  it('should send notification when notifyUser=true')
  it('should handle user with no active sessions')
  it('should record audit trail for admin actions')
  it('should publish security incident events')
})
```

### Tests E2E Presentation
```typescript
describe('POST /auth/logout-all', () => {
  it('returns 200 and terminates all user sessions')
  it('preserves current session when keepCurrentSession=true')
  it('requires authentication')
  it('logs events properly')
})

describe('POST /admin/users/:id/logout-all', () => {
  it('allows admin to logout user sessions')
  it('requires admin role')
  it('requires reason for admin logout')
  it('sends notification to target user')
  it('creates admin audit trail')
})
```

### Tests de Sécurité
```typescript
describe('Logout All Security Tests', () => {
  it('should prevent non-admin from logout other users')
  it('should audit all admin forced logouts')
  it('should handle concurrent logout-all requests')
  it('should validate session preservation correctly')
  it('should trigger security alerts for suspicious patterns')
})
```

---

## 🚨 Gestion des Incidents

### Procédures d'Urgence
```typescript
// API d'urgence pour incident de sécurité
interface EmergencyLogoutProcedure {
  logoutAllUsersInDepartment(department: string): Promise<number>
  logoutAllUsersWithRole(role: string): Promise<number>
  logoutUsersWithSuspiciousActivity(): Promise<number>
  emergencySystemWideLogout(): Promise<number>  // Déconnexion totale système
}
```

### Notifications d'Urgence
```typescript
const EmergencyNotificationTemplates = {
  SECURITY_INCIDENT: {
    subject: '🚨 Déconnexion de sécurité - Action requise',
    message: 'Votre compte a été déconnecté de tous les appareils suite à une activité suspecte détectée.',
    actions: ['Changer mot de passe', 'Vérifier activité récente', 'Contacter support']
  },
  ADMIN_ACTION: {
    subject: '🔒 Déconnexion administrative',
    message: 'Vos sessions ont été terminées par un administrateur.',
    actions: ['Contacter administrateur', 'Consulter politique sécurité']
  }
};
```

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : GlobalLogoutService + Events avec gestion options
- [ ] **Application** : LogoutAllDevices UseCase user + admin
- [ ] **Infrastructure** : Repository batch operations + sessions étendues
- [ ] **Presentation** : Endpoints user + admin avec validations

### Security
- [ ] **Authorization** : Matrice permissions user/admin/system
- [ ] **Audit trail** : Traçabilité complète des actions
- [ ] **Notifications** : Alertes sécurité configurées
- [ ] **Emergency procedures** : Procédures d'urgence définies

### Quality
- [ ] **Tests** : Couverture 100% avec scénarios sécurité
- [ ] **Performance** : Logout-all < 300ms p95 même avec nombreuses sessions
- [ ] **Monitoring** : Dashboards sécurité opérationnels
- [ ] **Documentation** : Procédures admin + utilisateur

---

## 🔗 Dépendances

**Précédentes :** US04 (User Logout) - Base de déconnexion
**Suivantes :** US07 (Security Monitoring) - Détection activités suspectes

---

**Priorité :** 🔶 **MEDIUM** - Important pour sécurité avancée