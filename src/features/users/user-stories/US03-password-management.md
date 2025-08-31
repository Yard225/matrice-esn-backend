# US03 : Gestion des Mots de Passe

## 📋 User Story
**En tant qu'utilisateur, je veux pouvoir définir, modifier et réinitialiser mon mot de passe de manière sécurisée pour maintenir la sécurité de mon compte.**

**Valeur métier :** Sécuriser les accès utilisateurs par une gestion robuste des mots de passe conforme aux standards de sécurité d'entreprise.

---

## 🎯 Critères d'Acceptation Techniques

### 🔐 Scénario 1 : Définition Mot de Passe Initial
```gherkin
GIVEN utilisateur activé sans mot de passe défini
AND token de définition mot de passe valide
WHEN POST /auth/set-password avec password conforme aux règles
THEN status=200
AND mot de passe hashé et stocké sécurisé
AND user.hasInitialPassword=true
AND redirection vers page de connexion
```

### 🔄 Scénario 2 : Changement Mot de Passe
```gherkin
GIVEN utilisateur authentifié
WHEN PUT /api/users/me/password avec ancien+nouveau password
THEN validation ancien mot de passe
AND nouveau mot de passe conforme aux règles de sécurité
AND status=200 avec confirmation
AND révocation de tous les refresh tokens existants
AND notification email de sécurité envoyée
```

### 🆘 Scénario 3 : Réinitialisation par Oubli
```gherkin
GIVEN utilisateur oublie son mot de passe
WHEN POST /auth/forgot-password avec email
THEN email de réinitialisation envoyé (même si email inexistant)
AND token de reset généré avec TTL 1h
AND status=200 toujours (pas de révélation d'existence compte)
```

### ✅ Scénario 4 : Reset avec Token Valide
```gherkin
GIVEN token de reset valide et non expiré
WHEN POST /auth/reset-password avec token+nouveau_password
THEN validation token et expiration
AND nouveau mot de passe défini
AND tous les tokens d'accès révoqués
AND confirmation envoyée par email
```

### 🚫 Scénario 5 : Validation Force du Mot de Passe
```gherkin
GIVEN règles: 12+ caractères, majuscule, minuscule, chiffre, caractère spécial
AND pas de mots du dictionnaire ou données personnelles
WHEN tentative définition mot de passe faible
THEN status=400
AND détails des règles non respectées
AND suggestions d'amélioration
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Value Object Password**
```typescript
class Password {
  private constructor(private readonly _hashedValue: string) {}

  static async create(plainPassword: string, hashingService: IPasswordService): Promise<Password> {
    // Validation des règles de sécurité
    this.validatePasswordStrength(plainPassword);
    
    // Hachage sécurisé
    const hashedValue = await hashingService.hash(plainPassword);
    
    return new Password(hashedValue);
  }

  static fromHash(hashedValue: string): Password {
    return new Password(hashedValue);
  }

  async verify(plainPassword: string, hashingService: IPasswordService): Promise<boolean> {
    return hashingService.verify(plainPassword, this._hashedValue);
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  private static validatePasswordStrength(password: string): void {
    const rules: PasswordRule[] = [
      new MinimumLengthRule(12),
      new UppercaseRule(),
      new LowercaseRule(), 
      new NumberRule(),
      new SpecialCharacterRule(),
      new NoCommonPasswordRule(),
      new NoPersonalDataRule()
    ];

    const violations = rules
      .map(rule => rule.validate(password))
      .filter(result => !result.isValid);

    if (violations.length > 0) {
      throw new WeakPasswordException(violations);
    }
  }
}

interface PasswordRule {
  validate(password: string): PasswordValidationResult;
}

interface PasswordValidationResult {
  isValid: boolean;
  message: string;
  suggestion?: string;
}

class MinimumLengthRule implements PasswordRule {
  constructor(private readonly minLength: number) {}

  validate(password: string): PasswordValidationResult {
    const isValid = password.length >= this.minLength;
    return {
      isValid,
      message: isValid ? '' : `Le mot de passe doit contenir au moins ${this.minLength} caractères`,
      suggestion: isValid ? undefined : 'Ajoutez plus de caractères pour renforcer votre mot de passe'
    };
  }
}

class NoCommonPasswordRule implements PasswordRule {
  private readonly commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
    'password123', 'admin123', '123456789', 'qwerty123'
  ];

  validate(password: string): PasswordValidationResult {
    const isValid = !this.commonPasswords.includes(password.toLowerCase());
    return {
      isValid,
      message: isValid ? '' : 'Ce mot de passe est trop commun',
      suggestion: isValid ? undefined : 'Utilisez une combinaison unique de mots et caractères'
    };
  }
}
```

**Service Domain : PasswordPolicyService**
```typescript
class PasswordPolicyService {
  constructor(
    private readonly passwordHistoryRepository: IPasswordHistoryRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async validatePasswordChange(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<PasswordChangeValidation> {
    // 1. Vérifier mot de passe actuel
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundException(userId);

    const currentIsValid = await user.props.password.verify(currentPassword, this.hashingService);
    if (!currentIsValid) {
      throw new InvalidCurrentPasswordException();
    }

    // 2. Vérifier force nouveau mot de passe
    const strengthValidation = this.validatePasswordStrength(newPassword);

    // 3. Vérifier historique (pas de réutilisation des 5 derniers)
    const historyValidation = await this.validatePasswordHistory(userId, newPassword);

    // 4. Vérifier données personnelles (nom, email, etc.)
    const personalDataValidation = await this.validateAgainstPersonalData(userId, newPassword);

    return {
      isValid: strengthValidation.isValid && historyValidation.isValid && personalDataValidation.isValid,
      violations: [
        ...strengthValidation.violations,
        ...historyValidation.violations,
        ...personalDataValidation.violations
      ],
      strength: this.calculatePasswordStrength(newPassword)
    };
  }

  private calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
      entropy: this.calculateEntropy(password)
    };

    score += checks.length ? 25 : 0;
    score += checks.uppercase ? 15 : 0;
    score += checks.lowercase ? 15 : 0;
    score += checks.numbers ? 15 : 0;
    score += checks.symbols ? 15 : 0;
    score += checks.entropy > 3.0 ? 15 : 0;

    return {
      score,
      level: score >= 85 ? 'VERY_STRONG' : 
             score >= 70 ? 'STRONG' : 
             score >= 50 ? 'MEDIUM' : 
             score >= 30 ? 'WEAK' : 'VERY_WEAK',
      checks
    };
  }
}

interface PasswordStrength {
  score: number;          // 0-100
  level: 'VERY_WEAK' | 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    entropy: boolean;
  };
}
```

**Entités de Gestion**
```typescript
class PasswordResetToken {
  constructor(
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
    public isUsed: boolean = false
  ) {}

  static generate(userId: string, ttlMinutes: number = 60): PasswordResetToken {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    return new PasswordResetToken(token, userId, expiresAt);
  }

  isValid(): boolean {
    return !this.isUsed && this.expiresAt > new Date();
  }

  use(): void {
    if (!this.isValid()) {
      throw new TokenExpiredOrUsedException();
    }
    this.isUsed = true;
  }

  private static generateSecureToken(): string {
    // Génère token sécurisé 256-bit
    return crypto.randomBytes(32).toString('hex');
  }
}

class PasswordHistory {
  constructor(
    public readonly userId: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
```

### 📋 Application Layer - Orchestration

**Use Case : ChangePasswordUseCase**
```typescript
class ChangePasswordUseCase implements IUseCase<ChangePasswordRequest, ChangePasswordResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly passwordHistoryRepository: IPasswordHistoryRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly emailService: IEmailService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(request: ChangePasswordRequest): Promise<ChangePasswordResponse>
}

type ChangePasswordRequest = {
  userId: string;
  currentPassword: string;
  newPassword: string;
  deviceInfo?: {
    ip: string;
    userAgent: string;
  };
}

type ChangePasswordResponse = {
  success: boolean;
  strength: PasswordStrength;
  tokensRevoked: number;
  securityEmailSent: boolean;
}
```

**Flux d'Exécution Change Password**
1. **Validation Current Password** : Vérifier mot de passe actuel
2. **Password Policy Check** : Valider nouveau mot de passe selon règles
3. **History Check** : Vérifier non-réutilisation des derniers mots de passe
4. **Password Update** : Hasher et sauvegarder nouveau mot de passe
5. **History Update** : Ajouter ancien mot de passe à l'historique
6. **Tokens Revocation** : Révoquer tous les refresh tokens existants
7. **Security Notification** : Envoyer email de notification changement
8. **Event Publication** : Publier PasswordChangedEvent
9. **Response** : Retourner confirmation avec détails

**Use Case : ResetPasswordUseCase**
```typescript
class ResetPasswordUseCase implements IUseCase<ResetPasswordRequest, ResetPasswordResponse> {
  constructor(
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}
}

type ResetPasswordRequest = {
  resetToken: string;
  newPassword: string;
  deviceInfo?: {
    ip: string;
    userAgent: string;
  };
}

type ResetPasswordResponse = {
  success: boolean;
  userId: string;
  tokensRevoked: number;
  requiresReauthentication: boolean;
}
```

### 🔧 Infrastructure Layer - Implémentations

**Password Hashing Service**
```typescript
interface IPasswordService {
  hash(plainPassword: string): Promise<string>
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>
  needsRehashing(hashedPassword: string): boolean  // Pour migration vers algo plus récent
}

class ArgonPasswordService implements IPasswordService {
  private readonly options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,      // 64 MB
    timeCost: 3,              // 3 itérations
    parallelism: 1,           // 1 thread
  };

  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, this.options);
  }

  async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      // Log l'erreur mais ne révèle pas d'infos
      this.logger.warn('Password verification failed', { error: error.message });
      return false;
    }
  }

  needsRehashing(hashedPassword: string): boolean {
    // Vérifier si le hash utilise des paramètres obsolètes
    return !hashedPassword.startsWith('$argon2id$v=19$m=65536,t=3,p=1$');
  }
}
```

**Email Service Extensions**
```typescript
interface IPasswordEmailService {
  sendResetPasswordEmail(user: User, resetToken: string): Promise<boolean>
  sendPasswordChangedNotification(user: User, deviceInfo?: DeviceInfo): Promise<boolean>
  sendPasswordSetInstructions(user: User, setPasswordToken: string): Promise<boolean>
}

class PasswordEmailService implements IPasswordEmailService {
  async sendResetPasswordEmail(user: User, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/auth/reset-password?token=${resetToken}`;
    
    const emailTemplate = {
      to: user.props.email.value,
      subject: '🔐 Réinitialisation de votre mot de passe',
      template: 'password-reset-template',
      context: {
        firstName: user.props.firstName,
        resetUrl,
        expirationMinutes: 60,
        supportEmail: this.configService.get('app.supportEmail')
      }
    };

    return this.mailerService.sendMail(emailTemplate);
  }

  async sendPasswordChangedNotification(user: User, deviceInfo?: DeviceInfo): Promise<boolean> {
    const emailTemplate = {
      to: user.props.email.value,
      subject: '🛡️ Mot de passe modifié avec succès',
      template: 'password-changed-template',
      context: {
        firstName: user.props.firstName,
        changeDate: new Date().toISOString(),
        deviceInfo: deviceInfo ? {
          ip: deviceInfo.ip,
          location: await this.geoService.getLocation(deviceInfo.ip),
          browser: this.parseUserAgent(deviceInfo.userAgent)
        } : null,
        securityTips: this.getSecurityTips()
      }
    };

    return this.mailerService.sendMail(emailTemplate);
  }
}
```

### 🎮 Presentation Layer - API Contract

**Change Password Endpoint**
```http
PUT /api/users/me/password
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "currentPassword": "current_secret_123",
  "newPassword": "New$ecur3P@ssw0rd2024!"
}

Response Success (200):
{
  "success": true,
  "strength": {
    "score": 92,
    "level": "VERY_STRONG",
    "checks": {
      "length": true,
      "uppercase": true,
      "lowercase": true,
      "numbers": true,
      "symbols": true,
      "entropy": true
    }
  },
  "tokensRevoked": 3,
  "securityEmailSent": true,
  "message": "Mot de passe modifié avec succès"
}

Response Error (400 - Weak Password):
{
  "error": "Password does not meet security requirements",
  "code": "WEAK_PASSWORD",
  "violations": [
    {
      "rule": "minimum_length",
      "message": "Le mot de passe doit contenir au moins 12 caractères",
      "suggestion": "Ajoutez plus de caractères pour renforcer votre mot de passe"
    },
    {
      "rule": "special_character",
      "message": "Le mot de passe doit contenir au moins un caractère spécial",
      "suggestion": "Ajoutez des symboles comme !@#$%^&* pour plus de sécurité"
    }
  ],
  "currentStrength": {
    "score": 45,
    "level": "WEAK"
  }
}
```

**Reset Password Flow**
```http
POST /auth/forgot-password
Content-Type: application/json

Request Body:
{
  "email": "user@esn.com"
}

Response Success (200):
{
  "message": "Si cette adresse email existe, un lien de réinitialisation a été envoyé",
  "emailSent": true
}

---

POST /auth/reset-password  
Content-Type: application/json

Request Body:
{
  "resetToken": "abc123def456...",
  "newPassword": "MyN3w$ecur3P@ssw0rd!"
}

Response Success (200):
{
  "success": true,
  "userId": "user-uuid-123",
  "tokensRevoked": 2,
  "requiresReauthentication": true,
  "message": "Mot de passe réinitialisé avec succès"
}

Response Error (400 - Invalid Token):
{
  "error": "Invalid or expired reset token",
  "code": "INVALID_RESET_TOKEN",
  "message": "Le lien de réinitialisation est invalide ou a expiré"
}
```

**Controller Implementation**
```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class PasswordController {
  
  @Put('me/password')
  @HttpCode(200)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: UserContext,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<ChangePasswordResponse> {
    
    return this.changePasswordUseCase.execute({
      userId: user.id,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
      deviceInfo: { ip, userAgent }
    });
  }
}

@Controller('auth')
export class AuthPasswordController {
  
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<ForgotPasswordResponse> {
    
    return this.forgotPasswordUseCase.execute({
      email: forgotPasswordDto.email
    });
  }
  
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<ResetPasswordResponse> {
    
    return this.resetPasswordUseCase.execute({
      resetToken: resetPasswordDto.resetToken,
      newPassword: resetPasswordDto.newPassword,
      deviceInfo: { ip, userAgent }
    });
  }
}
```

---

## 📧 Templates Email

### Reset Password Template
```html
<!-- password-reset-template.hbs -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>🔐 Réinitialisation de votre mot de passe</h2>
  
  <p>Bonjour {{firstName}},</p>
  
  <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Réinitialiser mon mot de passe
    </a>
  </div>
  
  <p><strong>⏰ Ce lien expire dans {{expirationMinutes}} minutes.</strong></p>
  
  <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
    <p><strong>⚠️ Important :</strong></p>
    <ul>
      <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
      <li>Ne partagez jamais ce lien avec personne</li>
      <li>Utilisez un mot de passe fort et unique</li>
    </ul>
  </div>
  
  <p>Besoin d'aide ? Contactez le support : {{supportEmail}}</p>
</div>
```

### Password Changed Template
```html
<!-- password-changed-template.hbs -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>🛡️ Mot de passe modifié avec succès</h2>
  
  <p>Bonjour {{firstName}},</p>
  
  <p>Votre mot de passe a été modifié avec succès le {{changeDate}}.</p>
  
  {{#if deviceInfo}}
  <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
    <p><strong>📍 Détails de la modification :</strong></p>
    <ul>
      <li><strong>Adresse IP :</strong> {{deviceInfo.ip}}</li>
      <li><strong>Localisation :</strong> {{deviceInfo.location}}</li>
      <li><strong>Navigateur :</strong> {{deviceInfo.browser}}</li>
    </ul>
  </div>
  {{/if}}
  
  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
    <p><strong>🔒 Conseils de sécurité :</strong></p>
    <ul>
      {{#each securityTips}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </div>
  
  <p><strong>Si ce n'était pas vous, contactez immédiatement le support !</strong></p>
</div>
```

---

## 📊 Monitoring & Sécurité

### Logs de Sécurité
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "password_changed",
  "userId": "user-uuid-123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "strength": {
    "score": 92,
    "level": "VERY_STRONG"
  },
  "tokensRevoked": 3
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:05:00Z",
  "event": "weak_password_attempt",
  "userId": "user-uuid-456",
  "violations": ["minimum_length", "no_uppercase"],
  "attemptCount": 3
}

{
  "level": "CRITICAL",
  "timestamp": "2024-01-01T12:10:00Z",
  "event": "password_reset_abuse",
  "email": "target@esn.com",
  "ip": "suspicious-ip",
  "requestCount": 10,
  "timeWindow": "5 minutes"
}
```

### Métriques de Sécurité
- `passwords.strength.distribution` - Distribution des forces de mots de passe
- `passwords.changes.total` - Changements par période
- `passwords.reset_requests.total` - Demandes de reset
- `passwords.policy_violations.total` - Violations par règle

---

## ✅ Definition of Done

### Security
- [ ] **Password hashing** : Argon2id avec paramètres sécurisés 2024
- [ ] **Password policy** : Règles strictes + validation côté serveur
- [ ] **Reset tokens** : Génération sécurisée + TTL + single-use
- [ ] **History tracking** : Historique des 5 derniers mots de passe

### User Experience  
- [ ] **Strength indicator** : Score temps réel + suggestions
- [ ] **Email notifications** : Templates sécurisés + informations contextuelles
- [ ] **Error messages** : Clairs sans révéler d'informations sensibles
- [ ] **Mobile compatibility** : Interface adaptée tous écrans

### Operations
- [ ] **Monitoring** : Métriques sécurité + alertes abus
- [ ] **Audit trail** : Traçabilité complète changements
- [ ] **Rate limiting** : Protection contre brute force reset
- [ ] **Compliance** : Conformité RGPD + standards sécurité

---

## 🔗 Dépendances

**Précédentes :** US01 (User Registration) - Définition mot de passe initial
**Suivantes :** Auth stories - Intégration avec système authentification

---

**Priorité :** 🔥 **CRITICAL** - Sécurité fondamentale du système