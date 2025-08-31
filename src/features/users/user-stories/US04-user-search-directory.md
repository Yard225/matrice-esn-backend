# US04 : Annuaire et Recherche d'Utilisateurs

## 📋 User Story
**En tant qu'utilisateur authentifié, je veux pouvoir rechercher et consulter l'annuaire des employés pour trouver des collègues, leurs compétences et informations de contact professionnel.**

**Valeur métier :** Faciliter la collaboration interne, le partage de connaissances et la constitution d'équipes projets par une recherche efficace des ressources humaines.

---

## 🎯 Critères d'Acceptation Techniques

### 🔍 Scénario 1 : Recherche Textuelle Globale
```gherkin
GIVEN utilisateur authentifié dans l'annuaire
WHEN GET /api/directory/search?q="Jean Dupont"
THEN status=200
AND résultats triés par pertinence (nom, poste, compétences)
AND données filtrées selon permissions et paramètres confidentialité
AND pagination des résultats avec métadonnées
```

### 🏢 Scénario 2 : Filtrage par Département
```gherkin
GIVEN utilisateur recherche dans département DEVELOPMENT
WHEN GET /api/directory/search?department=DEVELOPMENT&skills=TypeScript
THEN status=200
AND seuls utilisateurs du département DEVELOPMENT retournés
AND filtrés par compétence TypeScript si spécifiée
AND information hiérarchique (manager, équipes) incluse
```

### 👥 Scénario 3 : Recherche par Compétences
```gherkin
GIVEN besoin de trouver expert React+Node.js
WHEN GET /api/directory/search?skills=React,Node.js&availability=true
THEN utilisateurs avec ces compétences retournés
AND score de pertinence basé sur niveau d'expertise
AND disponibilité projet incluse si paramètre activé
AND suggestions d'experts similaires
```

### 📊 Scénario 4 : Annuaire Hiérarchique
```gherkin
GIVEN utilisateur consulte organigramme
WHEN GET /api/directory/hierarchy?department=DEVELOPMENT
THEN structure hiérarchique retournée (managers/subordonnés)
AND informations agrégées par équipe
AND statistiques département (effectifs, compétences)
```

### 🔒 Scénario 5 : Respect Confidentialité
```gherkin
GIVEN utilisateur avec profil PRIVATE
AND utilisateur externe au département
WHEN recherche inclurait ce profil
THEN profil exclu des résultats ou partiellement masqué
AND seules informations publiques visibles (selon settings)
AND audit de tentative d'accès loggé
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Modélisation Recherche

**Service Domain : UserDirectoryService**
```typescript
class UserDirectoryService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IUserProfileRepository,
    private readonly permissionService: IPermissionService,
    private readonly searchService: ISearchService
  ) {}

  async searchUsers(criteria: SearchCriteria, viewer: User): Promise<SearchResult> {
    // 1. Construction requête avec permissions
    const permissionFilters = await this.buildPermissionFilters(viewer);
    
    // 2. Exécution recherche avec filtres
    const rawResults = await this.searchService.search(criteria, permissionFilters);
    
    // 3. Filtrage données sensibles selon profils
    const filteredResults = await this.filterSensitiveData(rawResults, viewer);
    
    // 4. Calcul scores pertinence et tri
    const scoredResults = this.calculateRelevanceScores(filteredResults, criteria);
    
    return {
      results: scoredResults,
      total: rawResults.total,
      facets: await this.generateFacets(criteria),
      suggestions: await this.generateSuggestions(criteria)
    };
  }

  async getHierarchy(departmentId: string, viewer: User): Promise<DepartmentHierarchy> {
    // Vérifier permissions viewer pour voir la hiérarchie
    await this.validateHierarchyAccess(viewer, departmentId);
    
    // Construire arbre hiérarchique avec permissions
    return this.buildHierarchyTree(departmentId, viewer);
  }

  private async filterSensitiveData(results: UserSearchResult[], viewer: User): Promise<UserSearchResult[]> {
    return Promise.all(results.map(async (result) => {
      const canViewPrivateInfo = await this.permissionService.canViewPrivateInfo(viewer.id, result.userId);
      const profile = await this.profileRepository.findByUserId(result.userId);
      
      return {
        ...result,
        contactInfo: canViewPrivateInfo ? result.contactInfo : this.filterContactInfo(result.contactInfo),
        skills: profile?.privacySettings.allowSkillsView ? result.skills : [],
        availability: profile?.privacySettings.showAvailability ? result.availability : null
      };
    }));
  }
}

interface SearchCriteria {
  query?: string;              // Recherche textuelle libre
  department?: string;         // Filtrage par département
  skills?: string[];           // Compétences recherchées
  role?: UserRole;            // Filtrage par rôle
  location?: string;          // Localisation géographique
  availability?: boolean;      // Disponible pour nouveaux projets
  experienceLevel?: 'JUNIOR' | 'SENIOR' | 'EXPERT';
  page?: number;
  limit?: number;
  sortBy?: 'RELEVANCE' | 'NAME' | 'DEPARTMENT' | 'START_DATE';
  sortOrder?: 'ASC' | 'DESC';
}

interface SearchResult {
  results: UserSearchResult[];
  total: number;
  page: number;
  limit: number;
  facets: SearchFacets;        // Agrégations pour filtres UI
  suggestions: string[];       // Suggestions orthographe/recherches similaires
  searchTime: number;          // Temps d'exécution en ms
}

interface UserSearchResult {
  userId: string;
  displayName: string;
  avatar?: string;
  position: string;
  department: string;
  skills: SkillMatch[];        // Compétences avec niveau pertinence
  manager?: ManagerInfo;
  team?: TeamInfo;
  contactInfo?: ContactInfo;   // Selon permissions
  availability?: ProjectAvailability;
  relevanceScore: number;      // 0-100 score de pertinence
  matchReasons: string[];      // Pourquoi ce résultat (debug)
}

interface SkillMatch {
  skill: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  relevanceScore: number;      // Match avec recherche
  yearsExperience?: number;
  certifications?: string[];
}
```

**Agrégat Hierarchy**
```typescript
class DepartmentHierarchy {
  constructor(
    private readonly _departmentId: string,
    private readonly _structure: HierarchyNode,
    private readonly _statistics: DepartmentStatistics
  ) {}

  getManagerChain(userId: string): User[] {
    // Remonte la chaîne hiérarchique jusqu'au top
    return this.traverseUp(userId);
  }

  getDirectReports(managerId: string): User[] {
    // Retourne subordonnés directs
    return this.findDirectReports(managerId);
  }

  getTeamMembers(teamId: string): User[] {
    // Retourne membres d'une équipe
    return this.findTeamMembers(teamId);
  }

  getDepartmentStats(): DepartmentStatistics {
    return this._statistics;
  }
}

interface HierarchyNode {
  user: User;
  position: string;
  level: number;              // Niveau hiérarchique (0 = top)
  directReports: HierarchyNode[];
  teams: Team[];
  span: number;               // Nombre total de subordonnés
}

interface DepartmentStatistics {
  totalEmployees: number;
  byRole: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  averageTenure: number;      // Ancienneté moyenne en mois
  skillsDistribution: SkillStatistics[];
  teamCount: number;
}
```

### 📋 Application Layer - Orchestration

**Use Case : SearchUsersUseCase**
```typescript
class SearchUsersUseCase implements IUseCase<SearchUsersRequest, SearchUsersResponse> {
  constructor(
    private readonly directoryService: UserDirectoryService,
    private readonly analyticsService: ISearchAnalyticsService
  ) {}

  async execute(request: SearchUsersRequest): Promise<SearchUsersResponse>
}

type SearchUsersRequest = {
  viewerId: string;
  criteria: SearchCriteria;
  includeAnalytics?: boolean;  // Pour tracking recherches populaires
}

type SearchUsersResponse = {
  results: UserSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  facets: {
    departments: FacetCount[];
    skills: FacetCount[];
    roles: FacetCount[];
    locations: FacetCount[];
  };
  suggestions: string[];
  searchMeta: {
    query: string;
    executionTime: number;
    resultsFound: number;
    filtersApplied: string[];
  };
}

interface FacetCount {
  value: string;
  count: number;
  selected?: boolean;
}
```

**Use Case : GetDepartmentHierarchyUseCase**
```typescript
class GetDepartmentHierarchyUseCase implements IUseCase<HierarchyRequest, HierarchyResponse> {
  constructor(
    private readonly directoryService: UserDirectoryService,
    private readonly orgChartService: IOrgChartService
  ) {}
}

type HierarchyRequest = {
  viewerId: string;
  departmentId?: string;       // Si non spécifié, toute l'entreprise
  includeStats?: boolean;      // Inclure statistiques département
  maxDepth?: number;          // Profondeur maximale hiérarchie
}

type HierarchyResponse = {
  hierarchy: HierarchyNode;
  statistics?: DepartmentStatistics;
  viewerPermissions: {
    canViewSalaries: boolean;
    canViewPrivateInfo: boolean;
    canModifyHierarchy: boolean;
  };
}
```

### 🔧 Infrastructure Layer - Moteur de Recherche

**Search Service Implementation**
```typescript
interface ISearchService {
  indexUser(user: User, profile: UserProfile): Promise<void>
  updateUserIndex(userId: string, updates: Partial<UserSearchDocument>): Promise<void>
  deleteFromIndex(userId: string): Promise<void>
  search(criteria: SearchCriteria, permissions: PermissionFilters): Promise<RawSearchResult>
  suggest(query: string, maxSuggestions: number): Promise<string[]>
  rebuildIndex(): Promise<IndexRebuildResult>
}

class ElasticsearchUserService implements ISearchService {
  private readonly indexName = 'users-directory';

  async indexUser(user: User, profile: UserProfile): Promise<void> {
    const document: UserSearchDocument = {
      userId: user.id,
      email: user.props.email.value,
      firstName: user.props.firstName,
      lastName: user.props.lastName,
      displayName: profile.getDisplayName(),
      position: profile.professionalInfo.position,
      department: profile.professionalInfo.department,
      skills: profile.professionalInfo.skills.map(skill => ({
        name: skill.name,
        level: skill.level,
        yearsExperience: skill.yearsExperience
      })),
      manager: profile.professionalInfo.managerId ? {
        id: profile.professionalInfo.managerId,
        name: await this.getManagerName(profile.professionalInfo.managerId)
      } : undefined,
      startDate: profile.professionalInfo.startDate,
      location: profile.contactInfo.address?.toString(),
      privacyLevel: profile.privacySettings.profileVisibility,
      lastUpdated: new Date(),
      // Champs calculés pour recherche
      searchText: this.buildSearchText(user, profile),
      departmentPath: await this.buildDepartmentPath(profile.professionalInfo.department)
    };

    await this.elasticsearch.index({
      index: this.indexName,
      id: user.id,
      body: document
    });
  }

  async search(criteria: SearchCriteria, permissions: PermissionFilters): Promise<RawSearchResult> {
    const query = this.buildElasticsearchQuery(criteria, permissions);
    
    const response = await this.elasticsearch.search({
      index: this.indexName,
      body: {
        query,
        sort: this.buildSortClause(criteria.sortBy, criteria.sortOrder),
        from: (criteria.page - 1) * criteria.limit,
        size: criteria.limit,
        aggs: this.buildAggregations(),
        highlight: {
          fields: {
            searchText: {},
            'skills.name': {}
          }
        }
      }
    });

    return this.transformElasticsearchResponse(response);
  }

  private buildElasticsearchQuery(criteria: SearchCriteria, permissions: PermissionFilters): any {
    const must = [];
    const filter = [];

    // Recherche textuelle
    if (criteria.query) {
      must.push({
        multi_match: {
          query: criteria.query,
          fields: [
            'firstName^3',
            'lastName^3', 
            'displayName^2',
            'position^2',
            'skills.name^1.5',
            'department',
            'searchText'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'and'
        }
      });
    }

    // Filtres structurés
    if (criteria.department) {
      filter.push({ term: { 'department.keyword': criteria.department } });
    }

    if (criteria.skills?.length) {
      filter.push({
        terms: { 'skills.name.keyword': criteria.skills }
      });
    }

    // Filtres de permissions (privacy, département, etc.)
    filter.push(...this.buildPermissionFilters(permissions));

    return {
      bool: {
        must: must.length ? must : [{ match_all: {} }],
        filter
      }
    };
  }
}

interface UserSearchDocument {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  position: string;
  department: string;
  skills: {
    name: string;
    level: string;
    yearsExperience?: number;
  }[];
  manager?: {
    id: string;
    name: string;
  };
  startDate: Date;
  location?: string;
  privacyLevel: string;
  lastUpdated: Date;
  searchText: string;           // Texte optimisé pour recherche
  departmentPath: string[];     // Hiérarchie département pour filtres
}
```

### 🎮 Presentation Layer - API Contract

**Search Endpoint**
```http
GET /api/directory/search
Authorization: Bearer {accessToken}

Query Parameters:
?q=Jean Dupont                    # Recherche textuelle
&department=DEVELOPMENT           # Filtrage département
&skills=React,TypeScript         # Compétences requises
&role=USER                       # Filtrage par rôle
&availability=true               # Disponible pour projets
&page=1                          # Pagination
&limit=20                        # Taille page
&sort=RELEVANCE                  # Tri (RELEVANCE, NAME, DEPARTMENT)
&order=DESC                      # Ordre tri

Response Success (200):
{
  "results": [
    {
      "userId": "user-uuid-123",
      "displayName": "Jean Dupont",
      "avatar": "https://cdn.esn.com/avatars/123/thumbnail.jpg",
      "position": "Senior Developer",
      "department": "DEVELOPMENT",
      "skills": [
        {
          "skill": "React",
          "level": "EXPERT",
          "relevanceScore": 95,
          "yearsExperience": 5
        },
        {
          "skill": "TypeScript", 
          "level": "ADVANCED",
          "relevanceScore": 88,
          "yearsExperience": 3
        }
      ],
      "manager": {
        "id": "manager-uuid-456",
        "name": "Marie Martin"
      },
      "team": {
        "id": "team-uuid-789",
        "name": "Frontend Team"
      },
      "contactInfo": {
        "workEmail": "jean.dupont@esn.com",
        "workPhone": "+33123456789"
      },
      "availability": {
        "availableForProjects": true,
        "nextAvailableDate": "2024-02-01",
        "currentUtilization": 75
      },
      "relevanceScore": 92,
      "matchReasons": [
        "Nom exact match",
        "Compétence React expert",
        "Département correspondant"
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "facets": {
    "departments": [
      { "value": "DEVELOPMENT", "count": 25, "selected": true },
      { "value": "QA", "count": 8 },
      { "value": "DEVOPS", "count": 6 }
    ],
    "skills": [
      { "value": "React", "count": 15 },
      { "value": "TypeScript", "count": 18 },
      { "value": "Node.js", "count": 12 }
    ],
    "roles": [
      { "value": "USER", "count": 35 },
      { "value": "MANAGER", "count": 10 }
    ]
  },
  "suggestions": [
    "Jean Durand",
    "Jeanne Dupuis"
  ],
  "searchMeta": {
    "query": "Jean Dupont",
    "executionTime": 45,
    "resultsFound": 45,
    "filtersApplied": ["department:DEVELOPMENT"]
  }
}
```

**Hierarchy Endpoint**
```http
GET /api/directory/hierarchy
Authorization: Bearer {accessToken}

Query Parameters:
?department=DEVELOPMENT          # Département spécifique
&includeStats=true              # Inclure statistiques
&maxDepth=3                     # Profondeur maximale

Response Success (200):
{
  "hierarchy": {
    "user": {
      "userId": "cto-uuid-001",
      "displayName": "Alice Johnson",
      "position": "CTO",
      "avatar": "https://cdn.esn.com/avatars/cto/thumbnail.jpg"
    },
    "level": 0,
    "directReports": [
      {
        "user": {
          "userId": "dev-manager-uuid-002",
          "displayName": "Bob Smith", 
          "position": "Development Manager"
        },
        "level": 1,
        "span": 12,
        "directReports": [
          {
            "user": {
              "userId": "tech-lead-uuid-003",
              "displayName": "Charlie Brown",
              "position": "Tech Lead"
            },
            "level": 2,
            "span": 5,
            "teams": [
              {
                "id": "frontend-team",
                "name": "Frontend Team",
                "memberCount": 5
              }
            ]
          }
        ]
      }
    ],
    "span": 25
  },
  "statistics": {
    "totalEmployees": 25,
    "byRole": {
      "USER": 18,
      "MANAGER": 5,
      "TECH_LEAD": 2
    },
    "byExperienceLevel": {
      "JUNIOR": 8,
      "SENIOR": 12,
      "EXPERT": 5
    },
    "averageTenure": 28,
    "skillsDistribution": [
      { "skill": "JavaScript", "count": 20, "percentage": 80 },
      { "skill": "React", "count": 15, "percentage": 60 },
      { "skill": "Node.js", "count": 12, "percentage": 48 }
    ],
    "teamCount": 4
  },
  "viewerPermissions": {
    "canViewSalaries": false,
    "canViewPrivateInfo": true,
    "canModifyHierarchy": false
  }
}
```

**Controller Implementation**
```typescript
@Controller('api/directory')
@UseGuards(JwtAuthGuard)
export class DirectoryController {
  
  @Get('search')
  async searchUsers(
    @Query() searchQuery: SearchUsersQuery,
    @CurrentUser() viewer: UserContext
  ): Promise<SearchUsersResponse> {
    
    const criteria: SearchCriteria = {
      query: searchQuery.q,
      department: searchQuery.department,
      skills: searchQuery.skills?.split(','),
      role: searchQuery.role as UserRole,
      availability: searchQuery.availability === 'true',
      page: parseInt(searchQuery.page) || 1,
      limit: Math.min(parseInt(searchQuery.limit) || 20, 100), // Max 100
      sortBy: searchQuery.sort as any || 'RELEVANCE',
      sortOrder: searchQuery.order as any || 'DESC'
    };
    
    return this.searchUsersUseCase.execute({
      viewerId: viewer.id,
      criteria,
      includeAnalytics: true
    });
  }
  
  @Get('hierarchy')
  async getHierarchy(
    @Query() hierarchyQuery: HierarchyQuery,
    @CurrentUser() viewer: UserContext
  ): Promise<HierarchyResponse> {
    
    return this.getDepartmentHierarchyUseCase.execute({
      viewerId: viewer.id,
      departmentId: hierarchyQuery.department,
      includeStats: hierarchyQuery.includeStats === 'true',
      maxDepth: parseInt(hierarchyQuery.maxDepth) || 5
    });
  }
  
  @Get('suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @CurrentUser() viewer: UserContext
  ): Promise<{ suggestions: string[] }> {
    
    const suggestions = await this.searchService.suggest(query, 10);
    return { suggestions };
  }
}
```

---

## 📊 Analytics & Optimisation

### Search Analytics
```typescript
class SearchAnalyticsService {
  async trackSearch(viewerId: string, criteria: SearchCriteria, results: SearchResult): Promise<void> {
    await this.analyticsRepository.save({
      viewerId,
      query: criteria.query,
      filters: this.extractFilters(criteria),
      resultCount: results.total,
      executionTime: results.searchTime,
      timestamp: new Date()
    });
  }

  async getPopularSearches(period: 'day' | 'week' | 'month'): Promise<PopularSearch[]> {
    // Agrégation des recherches populaires
    return this.analyticsRepository.getTopQueries(period, 10);
  }

  async getSearchTrends(): Promise<SearchTrend[]> {
    // Tendances des recherches dans le temps
    return this.analyticsRepository.getTrends();
  }
}

interface PopularSearch {
  query: string;
  count: number;
  averageResults: number;
  conversionRate: number;    // % de recherches menant à consultation profil
}
```

### Performance Optimizations
```typescript
class SearchOptimizationService {
  // Cache des recherches fréquentes
  @Cacheable(ttl: 300) // 5 minutes
  async getCachedSearch(criteria: SearchCriteria): Promise<SearchResult | null> {
    const cacheKey = this.buildCacheKey(criteria);
    return this.cacheService.get(cacheKey);
  }

  // Index suggestions en temps réel
  async buildAutocompleteSuggestions(): Promise<void> {
    const suggestions = await this.userRepository.getDistinctValues([
      'firstName', 'lastName', 'position', 'skills', 'department'
    ]);
    
    await this.searchService.updateSuggestionIndex(suggestions);
  }

  // Pré-calcul des facettes populaires
  @Cron('0 */6 * * *')  // Toutes les 6 heures
  async precomputePopularFacets(): Promise<void> {
    const facets = await this.searchService.computeFacets();
    await this.cacheService.setMany(facets, 21600); // 6h TTL
  }
}
```

---

## 🔒 Privacy & Security

### Privacy Controls
```typescript
class PrivacyFilterService {
  async applyPrivacyFilters(results: UserSearchResult[], viewer: User): Promise<UserSearchResult[]> {
    return Promise.all(results.map(async (result) => {
      const targetUser = await this.userRepository.findById(result.userId);
      const permissions = await this.calculatePermissions(viewer, targetUser);
      
      return {
        ...result,
        contactInfo: permissions.canViewContact ? result.contactInfo : undefined,
        skills: permissions.canViewSkills ? result.skills : [],
        availability: permissions.canViewAvailability ? result.availability : undefined,
        manager: permissions.canViewHierarchy ? result.manager : undefined
      };
    }));
  }

  private async calculatePermissions(viewer: User, target: User): Promise<ViewPermissions> {
    // Logique complexe de calcul des permissions basée sur:
    // - Paramètres de confidentialité du profil cible
    // - Relation hiérarchique (même manager, équipe)
    // - Département (même département)
    // - Rôle du viewer (admin, HR)
    // - Projets partagés
    
    const isAdmin = ['ADMIN', 'HR_MANAGER'].includes(viewer.props.role);
    const sameDepartment = viewer.props.department === target.props.department;
    const sameTeam = await this.checkSameTeam(viewer.id, target.id);
    
    return {
      canViewContact: isAdmin || target.privacySettings.allowContactInfoView,
      canViewSkills: isAdmin || target.privacySettings.allowSkillsView || sameDepartment,
      canViewAvailability: isAdmin || sameTeam || target.privacySettings.showAvailability,
      canViewHierarchy: isAdmin || sameDepartment
    };
  }
}
```

---

## ✅ Definition of Done

### Search Functionality
- [ ] **Full-text search** : Elasticsearch avec recherche fuzzy + autocomplétion
- [ ] **Advanced filtering** : Département, compétences, rôle, localisation
- [ ] **Faceted search** : Agrégations pour filtres UI avec compteurs
- [ ] **Relevance scoring** : Algorithme de pertinence basé sur critères métier

### Privacy & Security
- [ ] **Permission matrix** : Contrôle granulaire visibilité selon relations
- [ ] **Privacy settings** : Respect paramètres confidentialité utilisateur
- [ ] **Audit logging** : Traçabilité accès aux profils et recherches
- [ ] **Data filtering** : Masquage automatique données sensibles

### Performance & UX
- [ ] **Search performance** : < 100ms p95 pour recherches simples
- [ ] **Caching strategy** : Cache intelligent résultats fréquents
- [ ] **Mobile responsive** : Interface adaptée tous écrans
- [ ] **Accessibility** : Conformité WCAG 2.1 AA

### Analytics & Insights
- [ ] **Search analytics** : Tracking popularité et tendances recherches
- [ ] **Usage insights** : Métriques utilisation annuaire
- [ ] **Recommendations** : Suggestions basées sur comportement utilisateur
- [ ] **A/B testing** : Framework test algorithmes recherche

---

## 🔗 Dépendances

**Précédentes :** US02 (User Profile Management) - Données profil pour recherche
**Suivantes :** Système de recommandations et matching projets

---

**Priorité :** 🔶 **MEDIUM** - Importante pour collaboration mais pas MVP critique