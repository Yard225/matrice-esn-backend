# US02 : Gestion des Profils Utilisateurs

## 📋 User Story
**En tant qu'utilisateur authentifié, je veux consulter et modifier mon profil personnel pour maintenir mes informations à jour, et en tant qu'administrateur, je veux gérer les profils de tous les utilisateurs.**

**Valeur métier :** Maintien de données utilisateurs précises pour la gestion RH, communication interne, et personnalisation de l'expérience utilisateur.

---

## 🎯 Critères d'Acceptation Techniques

### 👤 Scénario 1 : Consultation Profil Personnel
```gherkin
GIVEN utilisateur authentifié "john@esn.com"
WHEN GET /api/users/me
THEN status=200
AND response contient profil complet (sans password/tokens)
AND données personnelles + professionnelles + préférences
AND dernière connexion et informations de compte
```

### ✏️ Scénario 2 : Modification Profil Personnel
```gherkin
GIVEN utilisateur authentifié peut modifier ses données personnelles
WHEN PUT /api/users/me avec modifications valides
THEN status=200
AND seuls champs autorisés modifiés (pas email/rôle/département)
AND historique des modifications conservé
AND notification manager si changement critique (téléphone, adresse)
```

### 👥 Scénario 3 : Consultation Profil Autre Utilisateur
```gherkin
GIVEN utilisateur authentifié
AND utilisateur cible dans même département ou équipe
WHEN GET /api/users/{userId}/profile
THEN status=200
AND response contient profil public (nom, poste, département, photo)
AND données sensibles filtrées selon permissions
```

### 🔒 Scénario 4 : Modification par Admin
```gherkin
GIVEN administrateur avec rôle ADMIN ou HR_MANAGER
WHEN PUT /api/users/{userId} avec modifications
THEN status=200
AND tous champs modifiables (y compris email/rôle/statut)
AND audit trail complet des modifications
AND notification utilisateur des changements critiques
```

### 📸 Scénario 5 : Upload Photo de Profil
```gherkin
GIVEN utilisateur authentifié
WHEN POST /api/users/me/avatar avec image valide
THEN status=200
AND image redimensionnée et optimisée automatiquement
AND formats multiples générés (thumbnail, medium, large)
AND ancienne photo supprimée du stockage
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité UserProfile (Aggregate)**
```typescript
class UserProfile {
  constructor(
    public readonly userId: string,
    private _personalInfo: PersonalInfo,
    private _professionalInfo: ProfessionalInfo,
    private _contactInfo: ContactInfo,
    private _preferences: UserPreferences,
    private _privacySettings: PrivacySettings
  ) {}

  updatePersonalInfo(info: Partial<PersonalInfo>, updatedBy: string): void {
    // Validation des données personnelles
    this.validatePersonalInfoUpdate(info);
    
    // Audit des changements
    const changes = this.detectChanges(this._personalInfo, info);
    
    // Application des changements
    this._personalInfo = { ...this._personalInfo, ...info };
    
    // Événement domain
    DomainEvents.raise(new ProfileUpdatedEvent(this.userId, changes, updatedBy));
  }

  updateProfessionalInfo(info: Partial<ProfessionalInfo>, updatedBy: string): void {
    // Seuls admin/manager peuvent modifier certains champs
    this.validateProfessionalInfoUpdate(info, updatedBy);
    
    const changes = this.detectChanges(this._professionalInfo, info);
    this._professionalInfo = { ...this._professionalInfo, ...info };
    
    DomainEvents.raise(new ProfessionalInfoUpdatedEvent(this.userId, changes, updatedBy));
  }

  getPublicProfile(): PublicProfile {
    // Filtre selon paramètres de confidentialité
    return {
      userId: this.userId,
      displayName: this._personalInfo.getDisplayName(),
      position: this._professionalInfo.position,
      department: this._professionalInfo.department,
      avatar: this._personalInfo.avatar,
      isOnline: this._preferences.showOnlineStatus,
      // Autres champs selon privacy settings
    };
  }

  canBeViewedBy(viewerUserId: string, viewerRole: UserRole): boolean {
    // Logique de permissions pour consultation profil
    if (viewerUserId === this.userId) return true;
    if (['ADMIN', 'HR_MANAGER'].includes(viewerRole)) return true;
    
    // Même département si autorisé dans privacy
    if (this._privacySettings.allowDepartmentView) {
      // Vérification département via service domain
      return true;
    }
    
    return false;
  }

  canBeModifiedBy(modifierUserId: string, modifierRole: UserRole): ProfileModificationPermissions {
    if (modifierUserId === this.userId) {
      return {
        personalInfo: true,
        contactInfo: true,
        preferences: true,
        professionalInfo: false,  // Seul admin peut modifier
        privacySettings: true
      };
    }
    
    if (['ADMIN', 'HR_MANAGER'].includes(modifierRole)) {
      return {
        personalInfo: true,
        contactInfo: true,
        preferences: false,       // Respect de la vie privée
        professionalInfo: true,
        privacySettings: false
      };
    }
    
    return this.getNoPermissions();
  }
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: Date;
  avatar?: string;          // URL de l'image
  bio?: string;            // Description personnelle
  
  getDisplayName(): string;
}

interface ProfessionalInfo {
  position: string;
  department: string;
  managerId?: string;
  startDate: Date;
  skills: string[];
  certifications: Certification[];
  previousRoles: PreviousRole[];
}

interface ContactInfo {
  workEmail: string;        // Email pro (non modifiable par user)
  personalEmail?: string;   // Email perso (optionnel)
  workPhone?: string;
  mobilePhone?: string;
  address?: Address;
}

interface UserPreferences {
  language: 'fr' | 'en';
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  showOnlineStatus: boolean;
}

interface PrivacySettings {
  allowDepartmentView: boolean;     // Collègues peuvent voir profil
  allowContactInfoView: boolean;    // Afficher infos contact
  allowSkillsView: boolean;         // Afficher compétences
  profileVisibility: 'PUBLIC' | 'DEPARTMENT' | 'TEAM' | 'PRIVATE';
}
```

**Value Objects**
```typescript
class Avatar {
  private constructor(
    private readonly _originalUrl: string,
    private readonly _thumbnailUrl: string,
    private readonly _mediumUrl: string
  ) {}

  static async create(imageFile: Buffer, fileName: string): Promise<Avatar> {
    // Validation format/taille
    this.validateImageFile(imageFile, fileName);
    
    // Génération des différentes tailles
    const variants = await ImageProcessor.generateVariants(imageFile);
    
    return new Avatar(variants.original, variants.thumbnail, variants.medium);
  }

  get originalUrl(): string { return this._originalUrl; }
  get thumbnailUrl(): string { return this._thumbnailUrl; }
  get mediumUrl(): string { return this._mediumUrl; }

  private static validateImageFile(imageFile: Buffer, fileName: string): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (imageFile.length > maxSize) {
      throw new ImageTooLargeException(maxSize);
    }
    
    const mimeType = this.detectMimeType(imageFile);
    if (!allowedTypes.includes(mimeType)) {
      throw new UnsupportedImageFormatException(allowedTypes);
    }
  }
}

class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly zipCode: string,
    public readonly country: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.street || !this.city || !this.zipCode || !this.country) {
      throw new InvalidAddressException('All address fields are required');
    }
    
    // Validation format code postal selon pays
    if (!this.isValidZipCode()) {
      throw new InvalidZipCodeException(this.zipCode, this.country);
    }
  }

  toString(): string {
    return `${this.street}, ${this.city} ${this.zipCode}, ${this.country}`;
  }
}
```

### 📋 Application Layer - Orchestration

**Use Case : GetUserProfileUseCase**
```typescript
class GetUserProfileUseCase implements IUseCase<GetUserProfileRequest, GetUserProfileResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IUserProfileRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse>
}

type GetUserProfileRequest = {
  targetUserId: string;        // ID du profil à consulter
  viewerUserId: string;        // ID de celui qui consulte
  includePrivateData?: boolean; // Pour admin: inclure données sensibles
}

type GetUserProfileResponse = {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    avatar?: {
      thumbnail: string;
      medium: string;
      original?: string;    // Seulement si propriétaire
    };
    bio?: string;
  };
  professionalInfo: {
    position: string;
    department: string;
    startDate: Date;
    skills: string[];
    manager?: {
      id: string;
      name: string;
    };
  };
  contactInfo?: {            // Selon permissions
    workEmail?: string;
    workPhone?: string;
  };
  accountInfo: {
    lastLoginAt?: Date;
    status: UserStatus;
    memberSince: Date;
  };
  permissions: {            // Ce que le viewer peut faire
    canEdit: boolean;
    canViewPrivateInfo: boolean;
    canMessage: boolean;
  };
}
```

**Use Case : UpdateUserProfileUseCase**
```typescript
class UpdateUserProfileUseCase implements IUseCase<UpdateUserProfileRequest, UpdateUserProfileResponse> {
  constructor(
    private readonly profileRepository: IUserProfileRepository,
    private readonly auditService: IAuditService,
    private readonly notificationService: INotificationService
  ) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse>
}

type UpdateUserProfileRequest = {
  targetUserId: string;
  updatedBy: string;
  updates: {
    personalInfo?: Partial<PersonalInfo>;
    professionalInfo?: Partial<ProfessionalInfo>;
    contactInfo?: Partial<ContactInfo>;
    preferences?: Partial<UserPreferences>;
    privacySettings?: Partial<PrivacySettings>;
  };
}

type UpdateUserProfileResponse = {
  success: boolean;
  updatedFields: string[];
  warnings?: string[];      // Champs ignorés par manque de permissions
  auditId: string;
}
```

**Flux d'Exécution Update Profile**
1. **Permission Check** : Vérifier que `updatedBy` peut modifier `targetUserId`
2. **Field Validation** : Valider chaque champ selon les règles métier
3. **Permission Filtering** : Filtrer les champs selon les permissions
4. **Profile Update** : Appliquer les modifications via l'agrégat
5. **Audit Logging** : Enregistrer toutes les modifications
6. **Notifications** : Notifier utilisateur/manager si changements critiques
7. **Cache Invalidation** : Invalider caches de profil
8. **Response** : Retourner résultat avec détails

### 🔧 Infrastructure Layer - Implémentations

**Repository Pattern**
```typescript
interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>
  save(profile: UserProfile): Promise<void>
  findByDepartment(department: string): Promise<UserProfile[]>
  findBySkills(skills: string[]): Promise<UserProfile[]>
  searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult>
}

interface ProfileSearchCriteria {
  query?: string;           // Recherche textuelle
  department?: string;
  skills?: string[];
  location?: string;
  availableForProjects?: boolean;
  limit?: number;
  offset?: number;
}

class TypeOrmUserProfileRepository implements IUserProfileRepository {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const entity = await this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.manager', 'manager')
      .where('profile.userId = :userId', { userId })
      .getOne();
    
    if (!entity) return null;
    
    return this.toDomainEntity(entity);
  }

  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult> {
    const queryBuilder = this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user');

    // Filtres dynamiques
    if (criteria.query) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR profile.position ILIKE :query)',
        { query: `%${criteria.query}%` }
      );
    }

    if (criteria.department) {
      queryBuilder.andWhere('profile.department = :department', { 
        department: criteria.department 
      });
    }

    if (criteria.skills?.length) {
      queryBuilder.andWhere('profile.skills && :skills', { 
        skills: criteria.skills 
      });
    }

    // Pagination
    if (criteria.limit) {
      queryBuilder.take(criteria.limit);
    }
    if (criteria.offset) {
      queryBuilder.skip(criteria.offset);
    }

    const [entities, total] = await queryBuilder.getManyAndCount();
    
    return {
      profiles: entities.map(e => this.toDomainEntity(e)),
      total,
      hasMore: total > (criteria.offset || 0) + entities.length
    };
  }
}
```

**Image Processing Service**
```typescript
interface IImageProcessingService {
  processAvatar(imageBuffer: Buffer, fileName: string): Promise<AvatarVariants>
  deleteAvatar(avatarUrls: string[]): Promise<void>
  generateThumbnail(imageBuffer: Buffer, size: number): Promise<Buffer>
}

interface AvatarVariants {
  original: string;       // URL image originale
  medium: string;         // 200x200
  thumbnail: string;      // 64x64
}

class SharpImageProcessingService implements IImageProcessingService {
  async processAvatar(imageBuffer: Buffer, fileName: string): Promise<AvatarVariants> {
    const fileId = generateUUID();
    const baseUrl = this.configService.get('storage.avatars.baseUrl');
    
    // Original (optimisé mais taille conservée)
    const optimizedOriginal = await sharp(imageBuffer)
      .jpeg({ quality: 85 })
      .toBuffer();
    
    // Medium 200x200
    const medium = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Thumbnail 64x64
    const thumbnail = await sharp(imageBuffer)
      .resize(64, 64, { fit: 'cover' })
      .jpeg({ quality: 75 })
      .toBuffer();
    
    // Upload vers stockage (S3, local, etc.)
    await Promise.all([
      this.storageService.upload(`avatars/${fileId}/original.jpg`, optimizedOriginal),
      this.storageService.upload(`avatars/${fileId}/medium.jpg`, medium),
      this.storageService.upload(`avatars/${fileId}/thumbnail.jpg`, thumbnail)
    ]);
    
    return {
      original: `${baseUrl}/${fileId}/original.jpg`,
      medium: `${baseUrl}/${fileId}/medium.jpg`,
      thumbnail: `${baseUrl}/${fileId}/thumbnail.jpg`
    };
  }
}
```

### 🎮 Presentation Layer - API Contract

**Profile Consultation**
```http
GET /api/users/me
Authorization: Bearer {accessToken}

Response Success (200):
{
  "userId": "user-uuid-123",
  "personalInfo": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "preferredName": "JD",
    "avatar": {
      "thumbnail": "https://cdn.esn.com/avatars/123/thumbnail.jpg",
      "medium": "https://cdn.esn.com/avatars/123/medium.jpg",
      "original": "https://cdn.esn.com/avatars/123/original.jpg"
    },
    "bio": "Développeur passionné par les nouvelles technologies"
  },
  "professionalInfo": {
    "position": "Senior Developer",
    "department": "DEVELOPMENT", 
    "startDate": "2022-03-15T00:00:00Z",
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
    "manager": {
      "id": "manager-uuid-456",
      "name": "Marie Martin"
    }
  },
  "contactInfo": {
    "workEmail": "jean.dupont@esn.com",
    "workPhone": "+33123456789",
    "personalEmail": "jean@gmail.com"
  },
  "preferences": {
    "language": "fr",
    "timezone": "Europe/Paris",
    "theme": "dark",
    "showOnlineStatus": true
  },
  "accountInfo": {
    "lastLoginAt": "2024-01-01T10:30:00Z",
    "status": "ACTIVE",
    "memberSince": "2022-03-15T00:00:00Z"
  },
  "permissions": {
    "canEdit": true,
    "canViewPrivateInfo": true,
    "canMessage": true
  }
}
```

**Profile Update**
```http
PUT /api/users/me
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "personalInfo": {
    "preferredName": "Johnny",
    "bio": "Full-Stack Developer avec 5 ans d'expérience"
  },
  "contactInfo": {
    "personalEmail": "johnny@gmail.com",
    "mobilePhone": "+33987654321"
  },
  "preferences": {
    "theme": "light",
    "language": "en"
  }
}

Response Success (200):
{
  "success": true,
  "updatedFields": ["personalInfo.preferredName", "personalInfo.bio", "contactInfo.personalEmail", "preferences.theme"],
  "auditId": "audit-uuid-789"
}
```

**Avatar Upload**
```http
POST /api/users/me/avatar
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Form Data:
avatar: [image file]

Response Success (200):
{
  "success": true,
  "avatar": {
    "thumbnail": "https://cdn.esn.com/avatars/new-123/thumbnail.jpg",
    "medium": "https://cdn.esn.com/avatars/new-123/medium.jpg", 
    "original": "https://cdn.esn.com/avatars/new-123/original.jpg"
  },
  "previousAvatarDeleted": true
}
```

**Controller Implementation**
```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  
  @Get('me')
  async getMyProfile(
    @CurrentUser() user: UserContext
  ): Promise<GetUserProfileResponse> {
    return this.getUserProfileUseCase.execute({
      targetUserId: user.id,
      viewerUserId: user.id,
      includePrivateData: true
    });
  }
  
  @Get(':userId/profile')
  async getUserProfile(
    @Param('userId') targetUserId: string,
    @CurrentUser() viewer: UserContext
  ): Promise<GetUserProfileResponse> {
    return this.getUserProfileUseCase.execute({
      targetUserId,
      viewerUserId: viewer.id,
      includePrivateData: false
    });
  }
  
  @Put('me')
  async updateMyProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: UserContext
  ): Promise<UpdateUserProfileResponse> {
    return this.updateUserProfileUseCase.execute({
      targetUserId: user.id,
      updatedBy: user.id,
      updates: updateDto
    });
  }
  
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)$/)) {
        callback(new BadRequestException('Only image files allowed'), false);
      } else {
        callback(null, true);
      }
    }
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserContext
  ): Promise<UploadAvatarResponse> {
    return this.updateAvatarUseCase.execute({
      userId: user.id,
      imageBuffer: file.buffer,
      fileName: file.originalname
    });
  }
}
```

---

## 📊 Monitoring & Analytics

### Logs Structurés
```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T12:00:00Z",
  "event": "profile_updated",
  "userId": "user-uuid-123",
  "updatedBy": "user-uuid-123",
  "fieldsUpdated": ["personalInfo.bio", "preferences.theme"],
  "auditId": "audit-uuid-789"
}

{
  "level": "INFO",
  "timestamp": "2024-01-01T12:05:00Z", 
  "event": "avatar_uploaded",
  "userId": "user-uuid-123",
  "fileSize": 2048576,
  "format": "image/jpeg",
  "processingTime": 1245
}

{
  "level": "WARNING",
  "timestamp": "2024-01-01T12:10:00Z",
  "event": "unauthorized_profile_access",
  "viewerUserId": "user-uuid-456",
  "targetUserId": "user-uuid-789", 
  "reason": "different_department_no_permission"
}
```

### Métriques Business
- `profiles.views.total` - Consultations de profils par type
- `profiles.updates.total` - Modifications par champ
- `avatars.uploads.total` - Uploads d'images
- `profiles.completion_rate.gauge` - Taux de complétude des profils

---

## 🎯 Gamification & Engagement

### Score de Complétude de Profil
```typescript
class ProfileCompletenessService {
  calculateScore(profile: UserProfile): ProfileScore {
    const weights = {
      personalInfo: { avatar: 10, bio: 15, preferences: 5 },
      professionalInfo: { skills: 20, certifications: 15, previousRoles: 10 },
      contactInfo: { personalEmail: 5, phone: 5, address: 5 }
    };

    let score = 0;
    let maxScore = 0;

    // Calcul du score selon les champs remplis
    // ...

    return {
      currentScore: score,
      maxScore: maxScore,
      percentage: Math.round((score / maxScore) * 100),
      missingFields: this.identifyMissingFields(profile),
      recommendations: this.generateRecommendations(profile)
    };
  }
}

interface ProfileScore {
  currentScore: number;
  maxScore: number;
  percentage: number;
  level: 'BASIC' | 'GOOD' | 'EXCELLENT' | 'COMPLETE';
  missingFields: string[];
  recommendations: string[];
}
```

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : UserProfile aggregate + Value Objects + événements
- [ ] **Application** : Get/Update/Search profile use cases
- [ ] **Infrastructure** : Repository + image processing + stockage
- [ ] **Presentation** : API CRUD + upload + recherche

### Security & Privacy
- [ ] **Permissions** : Matrice de permissions par rôle/relation
- [ ] **Privacy settings** : Contrôle visibilité par utilisateur
- [ ] **Data filtering** : Filtrage automatique données sensibles
- [ ] **Audit trail** : Traçabilité complète des modifications

### User Experience
- [ ] **Image processing** : Multi-formats + compression optimisée
- [ ] **Search functionality** : Recherche textuelle + filtres
- [ ] **Profile completion** : Score + recommandations d'amélioration
- [ ] **Responsive design** : Interface adaptée mobile/desktop

---

## 🔗 Dépendances

**Précédentes :** US01 (User Registration) - Création profil initial
**Suivantes :** US04 (User Directory) - Recherche dans annuaire

---

**Priorité :** 🔥 **HIGH** - Fondamental pour expérience utilisateur