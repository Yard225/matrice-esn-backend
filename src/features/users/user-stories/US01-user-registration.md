# US01 : Enregistrement d'Utilisateur

## 📋 User Story
**En tant qu'administrateur RH, je veux créer de nouveaux comptes utilisateurs pour les employés de l'ESN afin qu'ils puissent accéder aux systèmes de l'entreprise.**

**Valeur métier :** Onboarding rapide des nouveaux employés et gestion centralisée des accès aux systèmes d'information.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Création Utilisateur Réussie
```gherkin
GIVEN administrateur authentifié avec rôle ADMIN ou HR_MANAGER
AND email "nouvel.employe@esn.com" non existant en base
WHEN POST /api/users avec payload complet et valide
THEN status=201
AND utilisateur créé avec status=PENDING_ACTIVATION
AND email de bienvenue envoyé avec lien d'activation
AND response contient ID utilisateur et détails (sans password)
```

### ❌ Scénario 2 : Email Déjà Existant
```gherkin
GIVEN email "existant@esn.com" déjà présent en base
WHEN POST /api/users avec cet email
THEN status=409
AND response={"error":"Email already exists","code":"EMAIL_CONFLICT"}
AND aucun utilisateur créé
AND tentative loggée pour audit
```

### ❌ Scénario 3 : Données Invalides
```gherkin
GIVEN payload avec email format invalide ou champs requis manquants
WHEN POST /api/users
THEN status=400
AND response contient détails de validation pour chaque champ
AND erreurs groupées par champ avec messages explicites
```

### 🔒 Scénario 4 : Permissions Insuffisantes
```gherkin
GIVEN utilisateur avec rôle USER (non admin)
WHEN POST /api/users
THEN status=403
AND response={"error":"Insufficient permissions","code":"INSUFFICIENT_PERMISSIONS"}
AND action auditée comme tentative non autorisée
```

### 📧 Scénario 5 : Activation par Email
```gherkin
GIVEN utilisateur créé avec status=PENDING_ACTIVATION
AND email de bienvenue avec token d'activation envoyé
WHEN GET /auth/activate/{activationToken}
THEN utilisateur status=ACTIVE
AND redirection vers page définition mot de passe
AND token d'activation marqué comme utilisé
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité User (Extended)**
```typescript
class User extends BaseEntity {
  constructor(
    public props: UserProps,
    private readonly passwordService?: IPasswordService
  ) {
    super(props.id);
  }

  static create(props: CreateUserProps): User {
    // Validation métier
    // Génération ID si non fourni
    // Status initial PENDING_ACTIVATION
    return new User({
      ...props,
      id: props.id || generateUUID(),
      status: UserStatus.PENDING_ACTIVATION,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  activate(activationToken: string): void {
    if (this.props.activationToken !== activationToken) {
      throw new InvalidActivationTokenException();
    }
    if (this.props.status !== UserStatus.PENDING_ACTIVATION) {
      throw new UserAlreadyActivatedException();
    }
    if (this.isActivationTokenExpired()) {
      throw new ActivationTokenExpiredException();
    }
    
    this.props.status = UserStatus.ACTIVE;
    this.props.activatedAt = new Date();
    this.props.activationToken = undefined;
    this.setUpdatedAt();
  }

  setInitialPassword(plainPassword: string): void {
    if (this.props.status !== UserStatus.ACTIVE) {
      throw new UserNotActivatedException();
    }
    // Password sera hashé par le service d'infrastructure
    this.props.hasInitialPassword = true;
    this.setUpdatedAt();
  }

  isActivationTokenExpired(): boolean {
    const expirationHours = 24; // 24h pour activer
    return this.props.createdAt < new Date(Date.now() - expirationHours * 60 * 60 * 1000);
  }
}

interface UserProps {
  id: string;
  email: Email;
  firstName: string;
  lastName: string;
  password?: string;        // Optionnel à la création
  role: UserRole;
  department: string;
  position: string;
  managerId?: string;       // ID du manager (hiérarchie)
  status: UserStatus;
  isActive: boolean;
  hasInitialPassword: boolean;
  activationToken?: string;
  activatedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserProps {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  position: string;
  managerId?: string;
}

enum UserStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}

enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}
```

**Value Objects**
```typescript
class ActivationToken {
  private constructor(private readonly _value: string) {}

  static generate(): ActivationToken {
    // Génère token sécurisé (UUID + entropy)
    const token = generateSecureToken(32);
    return new ActivationToken(token);
  }

  static create(token: string): ActivationToken {
    if (!this.isValidFormat(token)) {
      throw new InvalidActivationTokenException();
    }
    return new ActivationToken(token);
  }

  get value(): string {
    return this._value;
  }

  private static isValidFormat(token: string): boolean {
    return /^[a-zA-Z0-9]{32}$/.test(token);
  }
}

class Department {
  private constructor(private readonly _name: string) {}

  static create(name: string): Department {
    const validDepartments = [
      'DEVELOPMENT', 'QA', 'DEVOPS', 'MANAGEMENT', 
      'HR', 'SALES', 'MARKETING', 'FINANCE'
    ];
    
    if (!validDepartments.includes(name.toUpperCase())) {
      throw new InvalidDepartmentException(name);
    }
    
    return new Department(name.toUpperCase());
  }

  get value(): string {
    return this._name;
  }
}
```

**Exceptions Domain**
```typescript
class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS');
  }
}

class InvalidActivationTokenException extends DomainException {
  constructor() {
    super('Invalid activation token', 'INVALID_ACTIVATION_TOKEN');
  }
}

class ActivationTokenExpiredException extends DomainException {
  constructor() {
    super('Activation token has expired', 'ACTIVATION_TOKEN_EXPIRED');
  }
}

class UserAlreadyActivatedException extends DomainException {
  constructor() {
    super('User already activated', 'USER_ALREADY_ACTIVATED');
  }
}
```

### 📋 Application Layer - Orchestration

**Use Case : CreateUserUseCase**
```typescript
class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse>
}

type CreateUserRequest = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  position: string;
  managerId?: string;
  createdBy: string;        // ID de l'admin créateur
}

type CreateUserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  position: string;
  status: UserStatus;
  activationLink: string;   // Lien d'activation généré
  createdAt: Date;
}
```

**Flux d'Exécution du Use Case**
1. **Validation Permissions** : Vérifier que `createdBy` a le rôle requis (ADMIN/HR_MANAGER)
2. **Validation Email** : `Email.create(email)` + vérifier unicité
3. **Validation Manager** : Si `managerId` fourni, vérifier existence et hiérarchie
4. **Création User** : `User.create()` avec génération token d'activation
5. **Persistance** : `userRepository.save(user)`
6. **Email Welcome** : `emailService.sendWelcomeEmail()` avec lien d'activation
7. **Événements** : Publier `UserCreatedEvent`
8. **Response** : Return `CreateUserResponse`

**Use Case : ActivateUserUseCase**
```typescript
class ActivateUserUseCase implements IUseCase<ActivateUserRequest, ActivateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}
}

type ActivateUserRequest = {
  activationToken: string;
}

type ActivateUserResponse = {
  userId: string;
  email: string;
  activated: boolean;
  redirectUrl: string;      // URL pour définir mot de passe
}
```

### 🔧 Infrastructure Layer - Implémentations

**Repository Extensions**
```typescript
interface IUserRepository {
  // Méthodes existantes...
  findByActivationToken(token: string): Promise<User | null>
  existsByEmail(email: Email): Promise<boolean>
  findByManagerId(managerId: string): Promise<User[]>
  findPendingActivation(): Promise<User[]>
  countByDepartment(department: string): Promise<number>
}
```

**Email Service**
```typescript
interface IEmailService {
  sendWelcomeEmail(user: User, activationToken: string): Promise<boolean>
  sendActivationReminder(user: User): Promise<boolean>
  sendPasswordSetupInstructions(user: User): Promise<boolean>
}

class SmtpEmailService implements IEmailService {
  async sendWelcomeEmail(user: User, activationToken: string): Promise<boolean> {
    const activationUrl = `${this.configService.get('app.frontendUrl')}/auth/activate/${activationToken}`;
    
    const emailTemplate = {
      to: user.props.email.value,
      subject: 'Bienvenue chez ESN - Activez votre compte',
      template: 'welcome-template',
      context: {
        firstName: user.props.firstName,
        lastName: user.props.lastName,
        department: user.props.department,
        position: user.props.position,
        activationUrl,
        expirationHours: 24
      }
    };

    return this.mailerService.sendMail(emailTemplate);
  }
}
```

**Event Handlers**
```typescript
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  constructor(
    private readonly auditService: IAuditService,
    private readonly slackService: ISlackService
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // Audit trail
    await this.auditService.log({
      action: 'USER_CREATED',
      userId: event.userId,
      createdBy: event.createdBy,
      metadata: { 
        email: event.email,
        department: event.department 
      }
    });

    // Notification Slack RH
    if (event.department === 'MANAGEMENT') {
      await this.slackService.notifyChannel('#management-team', {
        message: `Nouveau compte manager créé : ${event.firstName} ${event.lastName}`,
        priority: 'HIGH'
      });
    }
  }
}
```

### 🎮 Presentation Layer - API Contract

**Endpoint Specification**
```http
POST /api/users
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "email": "nouvel.employe@esn.com",
  "firstName": "Jean",
  "lastName": "Dupont", 
  "role": "USER",
  "department": "DEVELOPMENT",
  "position": "Développeur Full-Stack",
  "managerId": "manager-uuid-123"
}

Response Success (201):
{
  "id": "user-uuid-456",
  "email": "nouvel.employe@esn.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "USER",
  "department": "DEVELOPMENT", 
  "position": "Développeur Full-Stack",
  "status": "PENDING_ACTIVATION",
  "activationLink": "https://app.esn.com/auth/activate/abc123...",
  "createdAt": "2024-01-01T12:00:00Z"
}

Response Error (409 - Email exists):
{
  "error": "Email already exists",
  "code": "EMAIL_CONFLICT",
  "details": {
    "email": "nouvel.employe@esn.com"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}

Response Error (400 - Validation):
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Email format is invalid"],
    "firstName": ["First name is required"],
    "role": ["Role must be one of: USER, MANAGER, HR_MANAGER, ADMIN"]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Activation Endpoint**
```http
GET /auth/activate/{activationToken}

Response Success (200):
{
  "userId": "user-uuid-456",
  "email": "nouvel.employe@esn.com",
  "activated": true,
  "redirectUrl": "/auth/set-password?token=temp-token-123"
}

Response Error (400 - Invalid/Expired token):
{
  "error": "Invalid or expired activation token",
  "code": "ACTIVATION_TOKEN_INVALID",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Controller Implementation**
```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  
  @Post()
  @UseGuards(RoleGuard)
  @Roles('ADMIN', 'HR_MANAGER')
  @HttpCode(201)
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: UserContext
  ): Promise<CreateUserResponse> {
    
    return this.createUserUseCase.execute({
      ...createUserDto,
      createdBy: currentUser.id
    });
  }
}

@Controller('auth')
export class AuthController {
  
  @Get('activate/:token')
  @HttpCode(200)
  async activateUser(
    @Param('token') activationToken: string
  ): Promise<ActivateUserResponse> {
    
    return this.activateUserUseCase.execute({ activationToken });
  }
}
```

**Validation DTOs**
```typescript
class CreateUserDto {
  @IsEmail({}, { message: 'Email format invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Prénom doit être une chaîne' })
  @IsNotEmpty({ message: 'Prénom requis' })
  @MinLength(2, { message: 'Prénom minimum 2 caractères' })
  @MaxLength(50, { message: 'Prénom maximum 50 caractères' })
  firstName: string;

  @IsString({ message: 'Nom doit être une chaîne' })
  @IsNotEmpty({ message: 'Nom requis' })
  @MinLength(2, { message: 'Nom minimum 2 caractères' })
  @MaxLength(50, { message: 'Nom maximum 50 caractères' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Rôle invalide' })
  role: UserRole;

  @IsString({ message: 'Département requis' })
  @IsIn(['DEVELOPMENT', 'QA', 'DEVOPS', 'MANAGEMENT', 'HR', 'SALES', 'MARKETING', 'FINANCE'], {
    message: 'Département invalide'
  })
  department: string;

  @IsString({ message: 'Poste requis' })
  @IsNotEmpty({ message: 'Poste requis' })
  @MaxLength(100, { message: 'Poste maximum 100 caractères' })
  position: string;

  @IsOptional()
  @IsUUID(4, { message: 'Manager ID doit être un UUID valide' })
  managerId?: string;
}
```

---

## 📧 Templates Email

### Email de Bienvenue
```html
<!-- welcome-template.hbs -->
<!DOCTYPE html>
<html>
<head>
    <title>Bienvenue chez ESN</title>
</head>
<body>
    <h1>Bienvenue {{firstName}} {{lastName}} !</h1>
    
    <p>Votre compte a été créé avec succès. Vous avez été affecté(e) au département <strong>{{department}}</strong> en tant que <strong>{{position}}</strong>.</p>
    
    <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
    
    <a href="{{activationUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Activer mon compte
    </a>
    
    <p><small>Ce lien expire dans {{expirationHours}} heures.</small></p>
    
    <p>Une fois votre compte activé, vous pourrez définir votre mot de passe et accéder aux systèmes de l'entreprise.</p>
    
    <p>Cordialement,<br>L'équipe IT</p>
</body>
</html>
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "user_created",
  "userId": "user-uuid-456",
  "email": "nouvel.employe@esn.com",
  "department": "DEVELOPMENT",
  "role": "USER",
  "createdBy": "admin-uuid-123",
  "duration": 245
}

{
  "level": "INFO", 
  "timestamp": "2024-01-01T12:30:00Z",
  "event": "user_activated",
  "userId": "user-uuid-456",
  "email": "nouvel.employe@esn.com",
  "activationTime": "30 minutes after creation"
}

{
  "level": "WARNING",
  "timestamp": "2024-01-02T12:00:00Z", 
  "event": "activation_token_expired",
  "userId": "user-uuid-789",
  "email": "retard@esn.com",
  "hoursAfterCreation": 25
}
```

### Métriques Business
- `users.created.total` - Utilisateurs créés par département/rôle
- `users.activation.rate` - Taux d'activation (24h, 7j)
- `users.activation.duration.histogram` - Temps entre création et activation
- `users.pending_activation.gauge` - Utilisateurs en attente d'activation

---

## 🔄 Processus d'Onboarding Automatisé

### Workflow d'Intégration
```typescript
class OnboardingWorkflowService {
  async startOnboarding(user: User): Promise<void> {
    // 1. Création compte technique (AD, email, etc.)
    await this.provisioningService.createTechnicalAccounts(user);
    
    // 2. Attribution des accès par défaut selon département
    await this.accessService.grantDefaultAccess(user);
    
    // 3. Planification des tâches d'onboarding
    await this.taskService.createOnboardingTasks(user);
    
    // 4. Notification manager et RH
    await this.notificationService.notifyStakeholders(user);
  }
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;      // Manager, RH, IT
  dueDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
```

### Tâches Automatiques par Département
```typescript
const DepartmentOnboardingTasks = {
  DEVELOPMENT: [
    { title: 'Configurer environnement de développement', assignedTo: 'MANAGER', priority: 'HIGH' },
    { title: 'Accès aux repositories Git', assignedTo: 'IT', priority: 'HIGH' },
    { title: 'Formation sécurité développement', assignedTo: 'HR', priority: 'MEDIUM' }
  ],
  SALES: [
    { title: 'Configuration CRM', assignedTo: 'IT', priority: 'HIGH' },
    { title: 'Formation processus commercial', assignedTo: 'MANAGER', priority: 'HIGH' },
    { title: 'Présentation équipe commerciale', assignedTo: 'HR', priority: 'MEDIUM' }
  ]
};
```

---

## 🧪 Tests Spécifications

### Tests Unitaires Domain
```typescript
describe('User Entity', () => {
  it('should create user with PENDING_ACTIVATION status')
  it('should generate activation token on creation')
  it('should activate user with valid token')
  it('should throw exception for invalid activation token')
  it('should throw exception for expired activation token')
  it('should throw exception when already activated')
})

describe('Email Value Object', () => {
  it('should validate email format correctly')
  it('should normalize email to lowercase')
  it('should throw exception for invalid formats')
})
```

### Tests Use Case Application
```typescript
describe('CreateUserUseCase', () => {
  it('should create user successfully with valid data')
  it('should throw exception when email already exists')
  it('should throw exception when creator lacks permissions')
  it('should send welcome email after creation')
  it('should publish UserCreatedEvent')
  it('should validate manager exists when provided')
})

describe('ActivateUserUseCase', () => {
  it('should activate user with valid token')
  it('should throw exception for invalid token')
  it('should throw exception for expired token')
  it('should throw exception for already activated user')
})
```

### Tests E2E Presentation
```typescript
describe('POST /api/users', () => {
  it('returns 201 when admin creates user with valid data')
  it('returns 409 when email already exists')
  it('returns 403 when user lacks permissions')
  it('returns 400 when validation fails')
  it('sends welcome email with activation link')
})

describe('GET /auth/activate/:token', () => {
  it('returns 200 and activates user with valid token')
  it('returns 400 with invalid token')
  it('returns 400 with expired token')
  it('redirects to password setup after activation')
})
```

---

## 🎯 Performance Requirements

- **User creation** : p95 < 300ms
- **Email sending** : Asynchrone, max 5s timeout
- **Database writes** : Transactionnelles et ACID
- **Activation rate** : > 90% dans 24h

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : User entity + ActivationToken VO + exceptions
- [ ] **Application** : CreateUser + ActivateUser use cases
- [ ] **Infrastructure** : Email service + repository extensions
- [ ] **Presentation** : API endpoints + validation DTOs

### Business Process
- [ ] **Email templates** : Welcome + reminder templates
- [ ] **Onboarding workflow** : Tâches automatiques par département
- [ ] **Notifications** : Stakeholders notifiés (manager, RH)
- [ ] **Permissions** : Seuls ADMIN/HR_MANAGER peuvent créer

### Quality
- [ ] **Tests** : Couverture 100% avec tous les cas edge
- [ ] **Performance** : Création < 300ms p95
- [ ] **Security** : Tokens sécurisés + validation permissions
- [ ] **Monitoring** : Métriques onboarding configurées

---

## 🔗 Dépendances

**Précédentes :** Aucune (Story fondamentale)
**Suivantes :** US03 (Password Management) - Définition mot de passe après activation

---

**Priorité :** 🔥 **HIGH** - Fondamental pour gestion utilisateurs