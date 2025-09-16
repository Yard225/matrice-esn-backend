# US02 : Gestion des Utilisateurs

## 📋 User Story
**En tant qu'administrateur de l'ESN, je veux gérer les utilisateurs (CRUD) pour maintenir l'annuaire des employés à jour.**

**Valeur métier :** Centraliser la gestion des utilisateurs et maintenir la cohérence des données RH.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Récupération Utilisateurs avec Pagination
```gherkin
GIVEN base contient 50 utilisateurs actifs
AND utilisateur authentifié avec rôle ADMIN
WHEN GET /users?page=2&limit=10&search=john&department=IT&status=active&sortBy=firstName&sortOrder=asc
THEN status=200
AND response contient 10 utilisateurs max
AND résultats filtrés par search="john", department="IT", status="active"
AND triés par firstName ASC
AND pagination={page:2, limit:10, total:50, totalPages:5}
```

### ✅ Scénario 2 : Création Utilisateur Réussie
```gherkin
GIVEN administrateur authentifié
AND email "newuser@esn.com" n'existe pas
WHEN POST /users avec {firstName:"John", lastName:"Doe", email:"newuser@esn.com", password:"SecurePass123", role:"user", department:"IT", position:"Developer"}
THEN status=201
AND utilisateur créé avec mot de passe hashé bcrypt
AND email de bienvenue envoyé (async)
AND response contient utilisateur sans password
AND log admin action "user_created"
```

### ❌ Scénario 3 : Email Déjà Existant
```gherkin
GIVEN utilisateur avec email="existing@esn.com" existe
WHEN POST /users avec email="existing@esn.com"
THEN status=409
AND response={error:"Email already exists", code:"EMAIL_CONFLICT"}
AND aucune modification en base
```

### ✅ Scénario 4 : Mise à Jour Utilisateur
```gherkin
GIVEN utilisateur avec id="user-123" existe
AND administrateur authentifié
WHEN PUT /users/user-123 avec {firstName:"Jane", department:"HR"}
THEN status=200
AND seuls firstName et department mis à jour
AND autres champs inchangés
AND updatedAt timestamp mis à jour
AND response contient utilisateur complet
```

### ✅ Scénario 5 : Suppression Utilisateur (Soft Delete)
```gherkin
GIVEN utilisateur avec id="user-123" existe et isActive=true
WHEN DELETE /users/user-123
THEN status=200
AND utilisateur.isActive = false (soft delete)
AND sessions utilisateur invalidées
AND log admin action "user_deleted"
AND response={message:"User deleted successfully"}
```

### 🔐 Scénario 6 : Changement Mot de Passe
```gherkin
GIVEN utilisateur avec id="user-123"
AND currentPassword correct
WHEN PUT /users/user-123/password avec {currentPassword:"oldpass", newPassword:"NewSecurePass123"}
THEN status=200
AND nouveau password hashé avec bcrypt cost=12
AND tokens existants invalidés
AND email notification envoyé
AND log action "password_changed"
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Utilisation User Entity existante**
```typescript
// Réutilise src/features/auth/domain/entities/User.entity.ts
class User extends BaseEntity {
  props: {
    id: string;
    email: Email;          // Value Object existant
    firstName: string;
    lastName: string;
    password: string;      // Hash bcrypt
    role: string;          // USER, ADMIN, MANAGER
    department?: string;
    position?: string;
    isActive: boolean;
    lastLoginAt?: Date;
  }

  // Méthodes métier héritées + nouvelles
  updateProfile(data: Partial<UserProps>): void
  changeRole(newRole: string): void
  assignDepartment(department: string): void
  softDelete(): void
  restore(): void
}
```

**Value Object Status**
```typescript
class UserStatus {
  private readonly _value: 'active' | 'inactive' | 'suspended';
  
  static create(status: string): UserStatus
  get value(): string
  isActive(): boolean
  equals(other: UserStatus): boolean
}
```

**Exceptions Spécifiques**
```typescript
class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} already exists`, 'EMAIL_CONFLICT');
  }
}

class UserNotCreatableException extends DomainException {
  constructor(reason: string) {
    super(`Cannot create user: ${reason}`, 'USER_NOT_CREATABLE');
  }
}

class InvalidUserUpdateException extends DomainException {
  constructor(field: string, reason: string) {
    super(`Cannot update ${field}: ${reason}`, 'INVALID_UPDATE');
  }
}
```

### 📋 Application Layer - Use Cases

**GetUsersUseCase**
```typescript
class GetUsersUseCase implements IUseCase<GetUsersRequest, GetUsersResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: GetUsersRequest): Promise<GetUsersResponse> {
    // 1. Vérifier permissions admin
    // 2. Construire filtres (search, department, status)
    // 3. Appliquer pagination et tri
    // 4. Transformer entities vers response models
    // 5. Retourner résultats paginés
  }
}

type GetUsersRequest = {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'suspended';
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  requesterId: string; // Pour vérification permissions
}

type GetUsersResponse = {
  users: UserResponseModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**CreateUserUseCase**
```typescript
class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
    private readonly emailService: IEmailService,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. Vérifier permissions admin
    // 2. Valider email unique
    // 3. Créer Email VO et valider format
    // 4. Hasher password avec bcrypt
    // 5. Créer entité User
    // 6. Sauvegarder en base
    // 7. Envoyer email bienvenue (async)
    // 8. Logger action admin
    // 9. Retourner utilisateur créé (sans password)
  }
}

type CreateUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  position: string;
  startDate?: string;
  requesterId: string;
}
```

**UpdateUserUseCase**
```typescript
class UpdateUserUseCase implements IUseCase<UpdateUserRequest, UpdateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    // 1. Vérifier permissions (admin ou self pour certains champs)
    // 2. Récupérer utilisateur existant
    // 3. Valider données à mettre à jour
    // 4. Vérifier email unique si changement email
    // 5. Appliquer modifications avec user.update()
    // 6. Sauvegarder
    // 7. Logger action
    // 8. Retourner utilisateur mis à jour
  }
}
```

**DeleteUserUseCase (Soft Delete)**
```typescript
class DeleteUserUseCase implements IUseCase<DeleteUserRequest, DeleteUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    // 1. Vérifier permissions admin
    // 2. Récupérer utilisateur
    // 3. Vérifier contraintes business (peut être supprimé?)
    // 4. Soft delete: user.softDelete()
    // 5. Invalider sessions actives
    // 6. Sauvegarder
    // 7. Logger action
    // 8. Notifier autres services si nécessaire
  }
}
```

### 🔧 Infrastructure Layer - Repository Extended

**IUserRepository Extended**
```typescript
interface IUserRepository extends IRepository<User> {
  // Hérite des méthodes de base + spécifiques users
  findByEmail(email: string): Promise<User | null>
  findActiveUsers(): Promise<User[]>
  findByDepartment(department: string): Promise<User[]>
  findByRole(role: string): Promise<User[]>
  findBySearch(query: string): Promise<User[]>
  existsByEmail(email: string): Promise<boolean>
  countByDepartment(department: string): Promise<number>
  
  findPaginatedWithFilters(
    page: number,
    limit: number,
    filters: UserFilters,
    sort: UserSort
  ): Promise<PaginatedResult<User>>
}

type UserFilters = {
  search?: string;
  department?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdFrom?: Date;
  createdTo?: Date;
}

type UserSort = {
  field: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastLoginAt';
  direction: 'asc' | 'desc';
}
```

**Services Infrastructure**
```typescript
interface IEmailService {
  sendWelcomeEmail(user: User): Promise<void>
  sendPasswordChangeNotification(user: User): Promise<void>
  sendAccountDeactivationNotification(user: User): Promise<void>
}

interface IAuthorizationService {
  canManageUsers(requesterId: string): Promise<boolean>
  canViewUser(requesterId: string, targetUserId: string): Promise<boolean>
  canUpdateUser(requesterId: string, targetUserId: string, fields: string[]): Promise<boolean>
  canDeleteUser(requesterId: string, targetUserId: string): Promise<boolean>
}
```

### 🎮 Presentation Layer - Controllers

**GET /users - Liste avec filtres**
```http
GET /users?page=1&limit=20&search=john&department=IT&status=active&sortBy=firstName&sortOrder=asc
Authorization: Bearer {jwt_token}

Response 200:
{
  "users": [
    {
      "id": "user-123",
      "firstName": "John",
      "lastName": "Doe", 
      "email": "john@esn.com",
      "role": "user",
      "department": "IT",
      "position": "Developer",
      "status": "active",
      "lastLoginAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**POST /users - Création**
```http
POST /users
Authorization: Bearer {admin_jwt}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@esn.com",
  "password": "SecurePass123",
  "role": "user", 
  "department": "HR",
  "position": "HR Manager",
  "startDate": "2024-02-01"
}

Response 201:
{
  "id": "user-456",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@esn.com",
  "role": "user",
  "department": "HR", 
  "position": "HR Manager",
  "status": "active",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**PUT /users/:id - Mise à jour**
```http
PUT /users/user-123
Authorization: Bearer {admin_jwt}

{
  "firstName": "John Updated",
  "department": "Engineering"
}

Response 200:
{
  "id": "user-123",
  "firstName": "John Updated",
  "lastName": "Doe",
  "email": "john@esn.com", 
  "role": "user",
  "department": "Engineering",
  "position": "Developer",
  "status": "active",
  "updatedAt": "2024-01-01T13:00:00Z"
}
```

**PUT /users/:id/password - Changement mot de passe**
```http
PUT /users/user-123/password
Authorization: Bearer {jwt_token}

{
  "currentPassword": "oldpass",
  "newPassword": "NewSecurePass123"
}

Response 200:
{
  "message": "Password updated successfully"
}
```

**DELETE /users/:id - Suppression (soft)**
```http
DELETE /users/user-123
Authorization: Bearer {admin_jwt}

Response 200:
{
  "message": "User deleted successfully"
}
```

### 🛡️ Validation Rules (DTOs)

```typescript
class CreateUserDto {
  @IsString() @IsNotEmpty()
  firstName: string;

  @IsString() @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsIn(['user', 'admin', 'manager'])
  role: string;

  @IsString() @IsNotEmpty()
  department: string;

  @IsString() @IsNotEmpty()
  position: string;

  @IsOptional() @IsISO8601()
  startDate?: string;
}

class GetUsersQueryDto {
  @IsOptional() @Type(() => Number) @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @Min(1) @Max(100)
  limit?: number = 20;

  @IsOptional() @IsString() @MinLength(2)
  search?: string;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsIn(['active', 'inactive', 'suspended'])
  status?: string;

  @IsOptional() @IsIn(['firstName', 'lastName', 'email', 'createdAt'])
  sortBy?: string;

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
```

---

## 🔐 Spécifications Sécurité

### Autorisations
```typescript
const UserPermissions = {
  // Admin peut tout faire
  MANAGE_ALL_USERS: ['admin'],
  
  // Manager peut gérer son département
  MANAGE_DEPARTMENT_USERS: ['admin', 'manager'],
  
  // User peut voir profil limité et modifier le sien
  VIEW_USER_PROFILE: ['admin', 'manager', 'user'],
  UPDATE_OWN_PROFILE: ['admin', 'manager', 'user'],
  
  // Seul admin peut créer/supprimer
  CREATE_USER: ['admin'],
  DELETE_USER: ['admin'],
  
  // Admin et manager peuvent voir liste filtrée
  LIST_USERS: ['admin', 'manager']
}
```

### Filtrage des Données
```typescript
// Selon le rôle, certains champs sont masqués
const FieldVisibility = {
  admin: ['*'], // Tous champs
  manager: ['id', 'firstName', 'lastName', 'email', 'role', 'department', 'position', 'status'],
  user: ['id', 'firstName', 'lastName', 'email', 'department', 'position'] // Pas de role/status
}
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "event": "user_created",
  "adminId": "admin-123",
  "createdUserId": "user-456", 
  "email": "jane@esn.com",
  "department": "HR",
  "role": "user"
}

{
  "level": "INFO", 
  "event": "user_updated",
  "adminId": "admin-123",
  "targetUserId": "user-123",
  "updatedFields": ["firstName", "department"],
  "oldValues": {"firstName": "John", "department": "IT"},
  "newValues": {"firstName": "John Updated", "department": "Engineering"}
}
```

### Métriques Business
- `users.created.count` - Utilisateurs créés
- `users.updated.count` - Modifications profil
- `users.deleted.count` - Suppressions (soft)
- `users.search.queries.count` - Recherches effectuées
- `users.list.requests.duration` - Performance requêtes liste

---

## 🧪 Tests Spécifications

### Tests Use Case
```typescript
describe('GetUsersUseCase', () => {
  it('should return paginated users with filters applied')
  it('should throw UnauthorizedException when user not admin')
  it('should apply search filter across firstName, lastName, email')
  it('should sort results by specified field and order')
  it('should limit results to max 100 per page')
})

describe('CreateUserUseCase', () => {
  it('should create user with hashed password')
  it('should throw EmailAlreadyExistsException when email exists')
  it('should send welcome email after creation')
  it('should validate email format using Email VO')
  it('should require admin permissions')
})
```

### Tests E2E
```typescript
describe('Users Management API', () => {
  it('GET /users returns 200 with paginated results for admin')
  it('GET /users returns 403 for non-admin user')
  it('POST /users creates user and returns 201 for admin')
  it('POST /users returns 409 when email exists')
  it('PUT /users/:id updates user and returns 200')
  it('DELETE /users/:id soft deletes and returns 200')
  it('PUT /users/:id/password changes password with validation')
})
```

---

## 🎯 Performance Requirements

- **GET /users (liste)** : p95 < 300ms avec 1000+ utilisateurs
- **POST /users** : p95 < 500ms (inclut hash bcrypt)
- **PUT /users/:id** : p95 < 200ms
- **Recherche** : p95 < 400ms avec index full-text
- **Pagination** : Support jusqu'à 10000 utilisateurs

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : User entity étendue + UserStatus VO + exceptions
- [ ] **Application** : 5 Use Cases (Get, GetById, Create, Update, Delete, ChangePassword)
- [ ] **Infrastructure** : UserRepository étendu + EmailService + AuthorizationService
- [ ] **Presentation** : Controller avec 6 endpoints + validation DTOs

### Security
- [ ] **Authorization** : Permissions par rôle implémentées
- [ ] **Validation** : Données entrée validées (email unique, password fort)
- [ ] **Audit** : Actions admin loggées
- [ ] **Data filtering** : Champs sensibles filtrés selon rôle

### Quality
- [ ] **Tests** : Coverage 100% Use Cases + E2E API
- [ ] **Performance** : Requirements respectés avec 1000+ users
- [ ] **Documentation** : OpenAPI avec exemples
- [ ] **Monitoring** : Logs et métriques en place

---

## 🔗 Dépendances

**Précédentes :** US01 (Authentication) - Réutilise User entity et services auth
**Suivantes :** US03 (Roles Management), US04 (Profile Management)

---

**Priorité :** 🔥 **HIGH** - Fondement de la gestion utilisateurs