# US03 : Gestion des Rôles & Compétences

## 📋 User Story
**En tant qu'administrateur RH, je veux gérer les rôles et leurs compétences associées pour structurer l'organisation et faciliter les interactions entre équipes.**

**Valeur métier :** Cartographier les compétences organisationnelles et optimiser la collaboration inter-équipes.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Récupération Rôles avec Filtres
```gherkin
GIVEN base contient 25 rôles actifs répartis sur 5 catégories
AND utilisateur authentifié avec permissions
WHEN GET /roles?category=Development&level=senior&search=react&includeSkills=true
THEN status=200
AND résultats filtrés par category="Development", level="senior"
AND recherche "react" appliquée sur name, description, skills
AND response inclut skills détaillées si includeSkills=true
AND rôles triés par category puis name
```

### ✅ Scénario 2 : Création Rôle avec Compétences
```gherkin
GIVEN administrateur RH authentifié
AND nom "Senior React Developer" n'existe pas
WHEN POST /roles avec {name:"Senior React Developer", icon:"💻", category:"Development", level:"senior", description:"Expert React/TypeScript", skills:["React", "TypeScript", "Redux", "Testing"], requirements:["5+ ans XP React"], responsibilities:["Code reviews", "Mentoring"]}
THEN status=201
AND rôle créé avec toutes compétences associées
AND skills normalisées (trim, capitalize)
AND level validé contre enum ['middle', 'senior', 'expert']
AND response contient rôle complet avec ID généré
```

### ✅ Scénario 3 : Récupération Rôle avec Détails Étendus
```gherkin
GIVEN rôle avec id="role-123" existe
AND rôle a des interactions associées et des utilisateurs assignés
WHEN GET /roles/role-123
THEN status=200
AND response contient rôle complet
AND inclut interactions[] liées au rôle
AND inclut users[] assignés au rôle
AND inclut skillsAnalysis avec distribution des compétences
```

### ✅ Scénario 4 : Mise à Jour Rôle avec Validation Métier
```gherkin
GIVEN rôle "Junior Developer" avec level="middle" existe
AND administrateur authentifié
WHEN PUT /roles/role-123 avec {level:"expert", skills:["React", "Node.js", "AWS", "Docker"]}
THEN status=200
AND level mis à jour vers "expert"
AND skills array remplacée complètement
AND updatedAt timestamp mis à jour
AND validation cohérence level/skills effectuée
AND log admin action "role_updated"
```

### ✅ Scénario 5 : Suppression Rôle avec Contraintes
```gherkin
GIVEN rôle avec id="role-123" existe
AND aucun utilisateur n'a ce rôle assigné
AND aucune interaction ne référence ce rôle
WHEN DELETE /roles/role-123
THEN status=200
AND rôle supprimé définitivement
AND log admin action "role_deleted"
```

### ❌ Scénario 6 : Suppression Rôle avec Contraintes Violées
```gherkin
GIVEN rôle avec id="role-123" existe
AND 5 utilisateurs ont ce rôle assigné
WHEN DELETE /roles/role-123
THEN status=409
AND response={error:"Cannot delete role: 5 users assigned", code:"ROLE_IN_USE"}
AND rôle non supprimé
```

### ✅ Scénario 7 : Statistiques et Analytics
```gherkin
GIVEN base contient rôles sur plusieurs catégories et niveaux
WHEN GET /roles/stats
THEN status=200
AND response contient totalRoles, byCategory{}, byLevel{}
AND skillsDistribution avec count par compétence
AND données agrégées en temps réel
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité Role**
```typescript
class Role extends BaseEntity {
  props: {
    id: string;                    // UUID v4
    name: string;                  // Unique par organisation
    icon: string;                  // Emoji ou code icône
    category: string;              // "Development", "Marketing", "HR", etc.
    level: RoleLevel;              // Value Object middle|senior|expert
    description: string;           // Description détaillée
    skills: string[];              // Array compétences techniques
    requirements?: string[];       // Prérequis du poste
    responsibilities?: string[];   // Responsabilités principales
    isActive: boolean;             // Rôle actif/archivé
    createdAt: Date;
    updatedAt: Date;
  }

  // Méthodes métier
  updateBasicInfo(name: string, description: string, icon: string): void
  updateSkills(skills: string[]): void
  updateLevel(level: RoleLevel): void
  updateCategory(category: string): void
  addRequirement(requirement: string): void
  removeRequirement(requirement: string): void
  addResponsibility(responsibility: string): void
  removeResponsibility(responsibility: string): void
  activate(): void
  deactivate(): void
  hasSkill(skill: string): boolean
  getSkillsCount(): number
  isExpertLevel(): boolean
  validateLevelConsistency(): boolean // Valide cohérence level/skills
}
```

**Value Object RoleLevel**
```typescript
class RoleLevel {
  private readonly _value: 'middle' | 'senior' | 'expert';
  
  static create(level: string): RoleLevel
  get value(): 'middle' | 'senior' | 'expert'
  isMiddle(): boolean
  isSenior(): boolean
  isExpert(): boolean
  getNumericLevel(): number // 1=middle, 2=senior, 3=expert
  equals(other: RoleLevel): boolean
  isHigherThan(other: RoleLevel): boolean
  isLowerThan(other: RoleLevel): boolean
}
```

**Exceptions Spécifiques**
```typescript
class RoleNameAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(`Role name "${name}" already exists`, 'ROLE_NAME_EXISTS');
  }
}

class RoleInUseException extends DomainException {
  constructor(roleId: string, usageCount: number) {
    super(`Cannot delete role: ${usageCount} dependencies`, 'ROLE_IN_USE');
  }
}

class InvalidRoleLevelException extends DomainException {
  constructor(level: string) {
    super(`Invalid role level: ${level}`, 'INVALID_ROLE_LEVEL');
  }
}

class RoleLevelSkillsMismatchException extends DomainException {
  constructor(level: string, skillsCount: number) {
    super(`Level ${level} inconsistent with ${skillsCount} skills`, 'LEVEL_SKILLS_MISMATCH');
  }
}
```

### 📋 Application Layer - Use Cases

**GetRolesUseCase**
```typescript
class GetRolesUseCase implements IUseCase<GetRolesRequest, GetRolesResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: GetRolesRequest): Promise<GetRolesResponse> {
    // 1. Vérifier permissions lecture rôles
    // 2. Construire filtres (category, level, search)
    // 3. Appliquer recherche full-text sur name, description, skills
    // 4. Inclure skills détaillées si demandé
    // 5. Trier par category puis name
    // 6. Transformer vers response models
  }
}

type GetRolesRequest = {
  category?: string;
  level?: 'middle' | 'senior' | 'expert';
  search?: string;
  includeSkills?: boolean;
  requesterId: string;
}

type GetRolesResponse = {
  roles: RoleResponseModel[];
}
```

**GetRoleByIdUseCase**
```typescript
class GetRoleByIdUseCase implements IUseCase<GetRoleByIdRequest, GetRoleByIdResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly interactionRepository: IInteractionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetRoleByIdRequest): Promise<GetRoleByIdResponse> {
    // 1. Récupérer rôle par ID
    // 2. Enrichir avec interactions liées
    // 3. Enrichir avec utilisateurs assignés
    // 4. Calculer analyse des compétences
    // 5. Transformer vers response model détaillé
  }
}

type GetRoleByIdResponse = {
  role: Role;
  interactions: Interaction[];
  users: User[];
  skillsAnalysis: {
    totalSkills: number;
    skillsDistribution: Record<string, number>;
    averageSkillsPerUser: number;
    topSkills: string[];
  };
}
```

**CreateRoleUseCase**
```typescript
class CreateRoleUseCase implements IUseCase<CreateRoleRequest, CreateRoleResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly skillsNormalizationService: ISkillsNormalizationService,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: CreateRoleRequest): Promise<CreateRoleResponse> {
    // 1. Vérifier permissions admin/RH
    // 2. Valider unicité nom rôle
    // 3. Créer RoleLevel VO et valider
    // 4. Normaliser skills (trim, capitalize, déduplication)
    // 5. Valider cohérence level/skills count
    // 6. Créer entité Role
    // 7. Sauvegarder en base
    // 8. Logger action admin
    // 9. Retourner rôle créé
  }
}

type CreateRoleRequest = {
  name: string;
  icon: string;
  category: string;
  level: 'middle' | 'senior' | 'expert';
  description: string;
  skills: string[];
  requirements?: string[];
  responsibilities?: string[];
  requesterId: string;
}
```

**UpdateRoleUseCase**
```typescript
class UpdateRoleUseCase implements IUseCase<UpdateRoleRequest, UpdateRoleResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly skillsNormalizationService: ISkillsNormalizationService,
    private readonly businessRuleValidator: IBusinessRuleValidator
  ) {}

  async execute(request: UpdateRoleRequest): Promise<UpdateRoleResponse> {
    // 1. Récupérer rôle existant
    // 2. Valider changements (ex: downgrade niveau interdit si users experts)
    // 3. Normaliser nouvelles skills si fournies
    // 4. Valider cohérence level/skills après update
    // 5. Appliquer modifications avec role.update()
    // 6. Sauvegarder
    // 7. Notifier changements aux utilisateurs concernés
    // 8. Logger action
  }
}
```

**DeleteRoleUseCase**
```typescript
class DeleteRoleUseCase implements IUseCase<DeleteRoleRequest, DeleteRoleResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository,
    private readonly interactionRepository: IInteractionRepository
  ) {}

  async execute(request: DeleteRoleRequest): Promise<DeleteRoleResponse> {
    // 1. Récupérer rôle
    // 2. Vérifier contraintes: compter users avec ce rôle
    // 3. Vérifier contraintes: compter interactions référençant ce rôle
    // 4. Si contraintes violées → RoleInUseException
    // 5. Si OK → supprimer définitivement
    // 6. Logger action
    // 7. Notifier suppression aux services concernés
  }
}
```

**GetRoleStatsUseCase**
```typescript
class GetRoleStatsUseCase implements IUseCase<GetRoleStatsRequest, GetRoleStatsResponse> {
  constructor(
    private readonly roleRepository: IRoleRepository
  ) {}

  async execute(request: GetRoleStatsRequest): Promise<GetRoleStatsResponse> {
    // 1. Compter total rôles actifs
    // 2. Grouper par category avec count
    // 3. Grouper par level avec count  
    // 4. Analyser distribution skills (fréquence)
    // 5. Calculer métriques agrégées
    // 6. Retourner statistiques complètes
  }
}

type GetRoleStatsResponse = {
  totalRoles: number;
  activeRoles: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  skillsDistribution: Record<string, number>;
  averageSkillsPerRole: number;
  topSkills: Array<{skill: string, count: number}>;
  categoriesDistribution: Array<{
    name: string;
    count: number; 
    percentage: number;
  }>;
}
```

### 🔧 Infrastructure Layer - Repository & Services

**IRoleRepository**
```typescript
interface IRoleRepository extends IRepository<Role> {
  // Queries spécifiques aux rôles
  findByCategory(category: string): Promise<Role[]>
  findByLevel(level: 'middle' | 'senior' | 'expert'): Promise<Role[]>
  findBySkill(skill: string): Promise<Role[]>
  findActiveRoles(): Promise<Role[]>
  findByNamePattern(pattern: string): Promise<Role[]>
  existsByName(name: string): Promise<boolean>
  
  // Recherche et filtrage avancé
  searchRoles(query: string, filters: RoleFilters): Promise<Role[]>
  findByCategoryAndLevel(category: string, level: string): Promise<Role[]>
  
  // Statistiques et agrégations
  countByCategory(): Promise<Record<string, number>>
  countByLevel(): Promise<Record<string, number>>
  getSkillsDistribution(): Promise<Record<string, number>>
  getCategories(): Promise<string[]>
  
  // Relations
  findRolesWithUsers(): Promise<Role[]>
  countUsersPerRole(roleId: string): Promise<number>
  findRolesWithInteractions(): Promise<Role[]>
  countInteractionsPerRole(roleId: string): Promise<number>
}

type RoleFilters = {
  category?: string;
  level?: 'middle' | 'senior' | 'expert';
  skills?: string[];
  isActive?: boolean;
  hasUsers?: boolean;
  hasInteractions?: boolean;
}
```

**Services Infrastructure**
```typescript
interface ISkillsNormalizationService {
  normalizeSkills(skills: string[]): string[]  // Trim, capitalize, dedupe
  suggestSkills(input: string): string[]       // Suggestions basées sur DB
  categorizeSkills(skills: string[]): Record<string, string[]> // Group par type
  validateSkillsFormat(skills: string[]): boolean
}

interface IBusinessRuleValidator {
  canUpdateRoleLevel(roleId: string, newLevel: string): Promise<boolean>
  canDeleteRole(roleId: string): Promise<{canDelete: boolean, reason?: string, dependenciesCount?: number}>
  validateRoleLevelConsistency(level: string, skillsCount: number): boolean
  validateCategoryExists(category: string): Promise<boolean>
}

interface IRoleAnalyticsService {
  analyzeRoleSkills(roleId: string): Promise<SkillAnalysis>
  compareRoles(roleId1: string, roleId2: string): Promise<RoleComparison>
  suggestSimilarRoles(roleId: string): Promise<Role[]>
  calculateRoleComplexityScore(role: Role): number
}
```

### 🎮 Presentation Layer - API Endpoints

**GET /roles - Liste avec filtres**
```http
GET /roles?category=Development&level=senior&search=react&includeSkills=true
Authorization: Bearer {jwt_token}

Response 200:
{
  "roles": [
    {
      "id": "role-123",
      "name": "Senior React Developer",
      "icon": "💻",
      "category": "Development", 
      "level": "senior",
      "description": "Expert React/TypeScript developer",
      "skills": ["React", "TypeScript", "Redux", "Jest", "Cypress"],
      "requirements": ["5+ years React experience", "Team leadership"],
      "responsibilities": ["Code reviews", "Architecture decisions", "Mentoring"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-05T10:30:00Z"
    }
  ]
}
```

**GET /roles/:id - Détails étendus**
```http
GET /roles/role-123
Authorization: Bearer {jwt_token}

Response 200:
{
  "role": {
    "id": "role-123",
    "name": "Senior React Developer",
    // ... autres champs
  },
  "interactions": [
    {
      "id": "interaction-456",
      "metadata": {"category": "interne", "priority": "high"},
      "vue1": {"roleId": "role-123", "title": "Fournit expertise React"},
      "vue2": {"roleId": "role-789", "title": "Attend spécifications UX"}
    }
  ],
  "users": [
    {
      "id": "user-789", 
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@esn.com"
    }
  ],
  "skillsAnalysis": {
    "totalSkills": 5,
    "skillsDistribution": {"React": 3, "TypeScript": 2, "Redux": 1},
    "averageSkillsPerUser": 4.2,
    "topSkills": ["React", "TypeScript", "Redux"]
  }
}
```

**POST /roles - Création**
```http
POST /roles
Authorization: Bearer {admin_jwt}

{
  "name": "Expert DevOps Engineer",
  "icon": "🔧",
  "category": "Infrastructure",
  "level": "expert",
  "description": "DevOps expert with cloud and automation expertise", 
  "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "Ansible", "Jenkins"],
  "requirements": ["7+ years DevOps", "Cloud certifications"],
  "responsibilities": ["Infrastructure design", "CI/CD pipelines", "Team training"]
}

Response 201:
{
  "id": "role-890",
  "name": "Expert DevOps Engineer",
  "icon": "🔧",
  "category": "Infrastructure",
  "level": "expert",
  "description": "DevOps expert with cloud and automation expertise",
  "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "Ansible", "Jenkins"],
  "requirements": ["7+ years DevOps", "Cloud certifications"], 
  "responsibilities": ["Infrastructure design", "CI/CD pipelines", "Team training"],
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**GET /roles/stats - Statistiques**
```http
GET /roles/stats
Authorization: Bearer {jwt_token}

Response 200:
{
  "totalRoles": 25,
  "activeRoles": 23,
  "byCategory": {
    "Development": 12,
    "Infrastructure": 4,
    "Marketing": 3,
    "HR": 2,
    "Sales": 4
  },
  "byLevel": {
    "middle": 10,
    "senior": 12, 
    "expert": 3
  },
  "skillsDistribution": {
    "JavaScript": 8,
    "React": 6,
    "Docker": 4,
    "AWS": 3,
    "Python": 5
  },
  "averageSkillsPerRole": 4.8,
  "topSkills": [
    {"skill": "JavaScript", "count": 8},
    {"skill": "React", "count": 6},
    {"skill": "Python", "count": 5}
  ],
  "categoriesDistribution": [
    {"name": "Development", "count": 12, "percentage": 48.0},
    {"name": "Infrastructure", "count": 4, "percentage": 16.0},
    {"name": "Marketing", "count": 3, "percentage": 12.0}
  ]
}
```

### 🛡️ Validation Rules

```typescript
class CreateRoleDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsString() @IsNotEmpty() @MaxLength(10) 
  icon: string;

  @IsString() @IsNotEmpty() @MaxLength(50)
  category: string;

  @IsIn(['middle', 'senior', 'expert'])
  level: string;

  @IsString() @IsNotEmpty() @MaxLength(500)
  description: string;

  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(20)
  @IsString({each: true}) @MaxLength(50, {each: true})
  skills: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(10)
  @IsString({each: true}) @MaxLength(200, {each: true})
  requirements?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(10)
  @IsString({each: true}) @MaxLength(200, {each: true})
  responsibilities?: string[];
}

class GetRolesQueryDto {
  @IsOptional() @IsString() @MaxLength(50)
  category?: string;

  @IsOptional() @IsIn(['middle', 'senior', 'expert'])
  level?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  search?: string;

  @IsOptional() @IsBoolean() @Transform(({value}) => value === 'true')
  includeSkills?: boolean;
}
```

---

## 🔐 Spécifications Sécurité

### Autorisations par Rôle
```typescript
const RolePermissions = {
  // Consultation rôles
  VIEW_ROLES: ['admin', 'hr', 'manager', 'user'],
  VIEW_ROLE_DETAILS: ['admin', 'hr', 'manager'],
  
  // Gestion rôles (admin + RH)
  CREATE_ROLE: ['admin', 'hr'],
  UPDATE_ROLE: ['admin', 'hr'],
  DELETE_ROLE: ['admin'],
  
  // Analytics et stats
  VIEW_ROLE_STATS: ['admin', 'hr', 'manager'],
  VIEW_SKILLS_ANALYTICS: ['admin', 'hr'],
  
  // Gestion catégories
  MANAGE_CATEGORIES: ['admin', 'hr']
}
```

### Règles de Validation Métier
```typescript
const BusinessRules = {
  // Contraintes niveau/compétences
  MIN_SKILLS_BY_LEVEL: {
    middle: 2,
    senior: 4, 
    expert: 6
  },
  
  // Contraintes suppression
  ALLOW_DELETE_WITH_DEPENDENCIES: false,
  MAX_DEPENDENCIES_FOR_SOFT_DELETE: 5,
  
  // Contraintes mise à jour
  ALLOW_LEVEL_DOWNGRADE: false, // Interdit expert -> senior si users experts
  REQUIRE_ADMIN_FOR_LEVEL_CHANGE: true
}
```

---

## 📊 Monitoring & Observabilité

### Logs Structurés
```json
{
  "level": "INFO",
  "event": "role_created", 
  "adminId": "admin-123",
  "roleId": "role-890",
  "roleName": "Expert DevOps Engineer",
  "category": "Infrastructure",
  "level": "expert",
  "skillsCount": 6
}

{
  "level": "INFO",
  "event": "role_deleted",
  "adminId": "admin-123", 
  "roleId": "role-456",
  "roleName": "Deprecated Role",
  "dependenciesChecked": {"users": 0, "interactions": 0}
}
```

### Métriques Business
- `roles.created.count` - Créations de rôles
- `roles.updated.count` - Modifications de rôles  
- `roles.deleted.count` - Suppressions de rôles
- `roles.search.queries.count` - Recherches effectuées
- `roles.skills.distribution` - Evolution des compétences
- `roles.level.distribution` - Répartition par niveau

---

## 🧪 Tests Spécifications

### Tests Domain 
```typescript
describe('Role Entity', () => {
  it('should update skills and normalize them')
  it('should validate level consistency with skills count')
  it('should throw when adding duplicate skill')
  it('should calculate correct complexity score')
})

describe('RoleLevel Value Object', () => {
  it('should create valid level from string')
  it('should compare levels correctly (expert > senior > middle)')
  it('should throw for invalid level')
})
```

### Tests Use Cases
```typescript
describe('CreateRoleUseCase', () => {
  it('should create role with normalized skills')
  it('should throw RoleNameAlreadyExistsException for duplicate name')
  it('should validate level/skills consistency')
  it('should require admin/hr permissions')
})

describe('DeleteRoleUseCase', () => {
  it('should delete role when no dependencies')
  it('should throw RoleInUseException when users assigned')
  it('should check interactions dependencies')
})
```

### Tests E2E
```typescript
describe('Roles API', () => {
  it('GET /roles filters by category and level correctly')
  it('GET /roles/:id includes extended details')
  it('POST /roles creates role with all validations')
  it('PUT /roles/:id updates role and validates business rules')
  it('DELETE /roles/:id respects dependencies constraints')
  it('GET /roles/stats returns accurate aggregations')
})
```

---

## 🎯 Performance Requirements

- **GET /roles (liste)** : p95 < 200ms avec 100+ rôles
- **GET /roles/:id (détails)** : p95 < 300ms avec données enrichies
- **POST /roles** : p95 < 300ms
- **Recherche full-text** : p95 < 400ms avec index sur name/description/skills
- **Statistiques** : p95 < 500ms avec cache Redis 5min

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : Role entity + RoleLevel VO + exceptions métier
- [ ] **Application** : 6 Use Cases (Get, GetById, Create, Update, Delete, GetStats)
- [ ] **Infrastructure** : RoleRepository complet + services support
- [ ] **Presentation** : Controller avec tous endpoints + validation

### Business Rules
- [ ] **Validation** : Cohérence level/skills implémentée
- [ ] **Contraintes** : Suppression avec dépendances gérée
- [ ] **Normalisation** : Skills normalisées automatiquement
- [ ] **Analytics** : Statistiques en temps réel

### Quality
- [ ] **Tests** : Coverage 100% avec cas métier complexes
- [ ] **Performance** : Index DB sur name/category/level/skills
- [ ] **Cache** : Statistiques cachées avec invalidation smart
- [ ] **Documentation** : OpenAPI avec exemples complets

---

## 🔗 Dépendances

**Précédentes :** US02 (User Management) - Utilise User.role pour assignation
**Suivantes :** US04 (Interactions) - Rôles utilisés dans interactions

---

**Priorité :** 🔥 **HIGH** - Fondement de la structuration organisationnelle