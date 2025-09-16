# US04 : Gestion des Interactions Inter-Rôles

## 📋 User Story
**En tant qu'analyste métier, je veux cartographier les interactions entre les rôles pour optimiser les flux de travail et identifier les goulots d'étranglement organisationnels.**

**Valeur métier :** Visualiser et optimiser la collaboration inter-équipes, réduire les inefficacités et améliorer la communication.

---

## 🎯 Critères d'Acceptation Techniques

### ✅ Scénario 1 : Récupération Interactions avec Filtres Avancés
```gherkin
GIVEN base contient 100+ interactions réparties sur 3 catégories et 4 priorités
AND utilisateur authentifié avec permissions appropriées
WHEN GET /interactions?page=1&limit=20&category=interne&priority=high&roleIds=role-123,role-456&search=specification&dateFrom=2024-01-01&dateTo=2024-01-31
THEN status=200
AND résultats filtrés par category="interne", priority="high"
AND filtrés par roleIds inclus dans vue1.roleId OU vue2.roleId
AND recherche "specification" appliquée sur vue1.title, vue2.title, metadata.tags
AND période 2024-01 respectée sur createdAt
AND pagination complète avec total count
```

### ✅ Scénario 2 : Création Interaction Bidirectionnelle Complète
```gherkin
GIVEN rôles "role-dev" et "role-ux" existent et sont actifs
AND utilisateur authentifié avec permissions création
WHEN POST /interactions avec {metadata:{category:"interne", priority:"high", tags:["collaboration", "produit"]}, vue1:{roleId:"role-dev", title:"Développe les features", fournit:["Code", "Tests"], livrables:["Pull Request", "Documentation"], attend:["Maquettes", "Spécifications"], livrablesAttendus:["Wireframes", "User Stories"]}, vue2:{roleId:"role-ux", title:"Conçoit l'expérience", fournit:["Maquettes", "Guidelines"], livrables:["Figma files", "Style guide"], attend:["Feedback technique", "Contraintes"], livrablesAttendus:["Faisabilité", "Estimations"]}}
THEN status=201
AND interaction créée avec ID unique
AND metadata validée (category, priority, tags)
AND vue1 et vue2 complètes avec roleIds vérifiés
AND arrays fournit/livrables/attend/livrablesAttendus normalisées
AND createdAt/updatedAt timestamps générés
AND log création "interaction_created"
```

### ✅ Scénario 3 : Récupération Interaction avec Données Enrichies
```gherkin
GIVEN interaction avec id="interaction-789" existe
AND interaction liée à rôles avec utilisateurs assignés
AND interaction a historique de modifications
WHEN GET /interactions/interaction-789
THEN status=200
AND response contient interaction complète
AND inclut relatedRoles[] avec détails complets des rôles
AND inclut history[] avec chronologie des modifications
AND inclut utilisateurs assignés aux rôles référencés
AND calcule métriques de l'interaction (complexité, criticité)
```

### ✅ Scénario 4 : Mise à Jour Interaction avec Validation Métier
```gherkin
GIVEN interaction existe avec priority="medium"
AND utilisateur autorisé pour modification
WHEN PUT /interactions/interaction-789 avec {metadata:{priority:"critical", tags:["urgent", "blocant"]}, vue1:{fournit:["Code urgent", "Hotfix"]}}
THEN status=200
AND seuls champs fournis mis à jour (priority, tags, vue1.fournit)
AND autres champs préservés
AND updatedAt timestamp actualisé
AND validation cohérence données (roleIds inchangés restent valides)
AND history entry ajoutée avec changements détaillés
AND notification envoyée aux rôles concernés si priority=critical
```

### ✅ Scénario 5 : Matrice d'Interactions avec Calculs Analytics
```gherkin
GIVEN base contient interactions variées entre 10 rôles
WHEN GET /interactions/matrix?roleIds=role-dev,role-ux,role-pm&includeStats=true
THEN status=200
AND matrix groupée par rôle avec toutes interactions
AND chaque rôle inclut stats: {total, byPriority{}, byCategory{}}
AND globalStats avec agrégations complètes
AND calculs temps réel (pas de cache stale)
AND métriques de densité des interactions par rôle
```

### ✅ Scénario 6 : Recherche Avancée avec Scoring de Pertinence
```gherkin
GIVEN interactions avec contenu varié dans titles et arrays
WHEN POST /interactions/search avec {query:"développement react", filters:{category:["interne"], priority:["high", "critical"], roleIds:["role-dev"]}, options:{includeContent:true, fuzzyMatch:true, limit:10}}
THEN status=200
AND résultats triés par pertinence décroissante
AND chaque résultat inclut relevanceScore (0-100)
AND matchedFields indique où query a matché
AND fuzzyMatch active la tolérance fautes de frappe
AND searchTime mesuré et retourné
AND limite à 10 résultats max respectée
```

### ❌ Scénario 7 : Suppression avec Validation Contraintes
```gherkin
GIVEN interaction avec id="interaction-456" existe
AND interaction référencée dans 2 rapports utilisateurs
WHEN DELETE /interactions/interaction-456
THEN status=409
AND response={error:"Cannot delete: interaction referenced in reports", code:"INTERACTION_IN_USE", dependencies:["report-123", "report-456"]}
AND interaction non supprimée
AND log tentative suppression bloquée
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Règles Métier

**Entité Interaction**
```typescript
class Interaction extends BaseEntity {
  props: {
    id: string;                    // UUID v4
    metadata: InteractionMetadata; // Catégorie, priorité, tags
    vue1: InteractionVue;          // Perspective rôle 1
    vue2: InteractionVue;          // Perspective rôle 2
    isActive: boolean;             // Status actif/archivé
    createdAt: Date;
    updatedAt: Date;
    version: number;               // Optimistic locking
  }

  // Méthodes métier
  updateMetadata(metadata: Partial<InteractionMetadata>): void
  updateVue1(vue: Partial<InteractionVue>): void
  updateVue2(vue: Partial<InteractionVue>): void
  addTag(tag: string): void
  removeTag(tag: string): void
  setPriority(priority: InteractionPriority): void
  setCategory(category: InteractionCategory): void
  getRoleIds(): string[]
  hasRole(roleId: string): boolean
  isHighPriority(): boolean
  isCritical(): boolean
  calculateComplexityScore(): number
  getDeliverables(): string[]
  getExpectations(): string[]
  validateBidirectionalConsistency(): boolean
}

type InteractionMetadata = {
  category: InteractionCategory;   // VO pour validation
  priority: InteractionPriority;   // VO pour validation
  tags?: string[];                 // Array normalisée
  estimatedEffort?: number;        // Heures estimées
  actualEffort?: number;           // Heures réelles
  frequency?: 'daily' | 'weekly' | 'monthly' | 'adhoc';
}

type InteractionVue = {
  roleId: string;                  // Référence vers Role
  title: string;                   // Description perspective
  fournit: string[];               // Ce que ce rôle apporte
  livrables: string[];             // Livrables produits
  attend: string[];                // Ce que ce rôle attend
  livrablesAttendus: string[];     // Livrables attendus
  contraintes?: string[];          // Contraintes spécifiques
  sla?: {                          // Service Level Agreement
    responseTime: number;          // Temps réponse en heures
    deliveryTime: number;          // Temps livraison en jours
  };
}
```

**Value Objects**
```typescript
class InteractionCategory {
  private readonly _value: 'interne' | 'externe' | 'client';
  
  static create(category: string): InteractionCategory
  get value(): 'interne' | 'externe' | 'client'
  isInternal(): boolean
  isExternal(): boolean
  isClient(): boolean
  getColor(): string // Pour UI (vert=interne, orange=externe, rouge=client)
}

class InteractionPriority {
  private readonly _value: 'low' | 'medium' | 'high' | 'critical';
  
  static create(priority: string): InteractionPriority
  get value(): 'low' | 'medium' | 'high' | 'critical'
  getNumericValue(): number // 1=low, 2=medium, 3=high, 4=critical
  isHighPriority(): boolean // high ou critical
  isCritical(): boolean
  getEscalationDelay(): number // Heures avant escalade
}
```

**Exceptions Spécifiques**
```typescript
class InvalidRoleInteractionException extends DomainException {
  constructor(roleId1: string, roleId2: string, reason: string) {
    super(`Invalid interaction between ${roleId1} and ${roleId2}: ${reason}`, 'INVALID_ROLE_INTERACTION');
  }
}

class InteractionInUseException extends DomainException {
  constructor(interactionId: string, dependencies: string[]) {
    super(`Cannot delete interaction: used by ${dependencies.join(', ')}`, 'INTERACTION_IN_USE');
  }
}

class InconsistentInteractionDataException extends DomainException {
  constructor(field: string, issue: string) {
    super(`Interaction data inconsistent in ${field}: ${issue}`, 'INCONSISTENT_INTERACTION_DATA');
  }
}
```

### 📋 Application Layer - Use Cases Complexes

**GetInteractionsUseCase avec Filtres Avancés**
```typescript
class GetInteractionsUseCase implements IUseCase<GetInteractionsRequest, GetInteractionsResponse> {
  constructor(
    private readonly interactionRepository: IInteractionRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly searchService: ISearchService,
    private readonly authorizationService: IAuthorizationService
  ) {}

  async execute(request: GetInteractionsRequest): Promise<GetInteractionsResponse> {
    // 1. Vérifier permissions selon rôle utilisateur
    // 2. Construire filtres complexes (category, priority, roleIds, dateRange)
    // 3. Appliquer recherche full-text si query fournie
    // 4. Appliquer pagination avec performance optimisée
    // 5. Enrichir résultats avec données rôles si demandé
    // 6. Calculer métriques agrégées
    // 7. Transformer vers response models
  }
}

type GetInteractionsRequest = {
  page: number;
  limit: number;
  category?: 'interne' | 'externe' | 'client';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  roleIds?: string[];              // Filtre sur vue1.roleId OU vue2.roleId
  search?: string;                 // Full-text search
  dateFrom?: Date;
  dateTo?: Date;
  includeInactive?: boolean;
  requesterId: string;
}

type GetInteractionsResponse = {
  interactions: InteractionResponseModel[];
  pagination: PaginationInfo;
  filters: AppliedFilters;         // Résumé filtres appliqués
  aggregations: {                  // Métriques contextuelles
    totalByCategory: Record<string, number>;
    totalByPriority: Record<string, number>;
    averageComplexity: number;
  };
}
```

**CreateInteractionUseCase avec Validation Métier**
```typescript
class CreateInteractionUseCase implements IUseCase<CreateInteractionRequest, CreateInteractionResponse> {
  constructor(
    private readonly interactionRepository: IInteractionRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly interactionValidator: IInteractionValidator,
    private readonly notificationService: INotificationService
  ) {}

  async execute(request: CreateInteractionRequest): Promise<CreateInteractionResponse> {
    // 1. Vérifier permissions création
    // 2. Valider roleIds existent et sont actifs
    // 3. Créer VOs InteractionCategory et InteractionPriority
    // 4. Normaliser arrays (trim, dedupe, capitalize)
    // 5. Valider cohérence bidirectionnelle
    // 6. Vérifier pas de doublon (même paire rôles + titre similaire)
    // 7. Créer entité Interaction
    // 8. Sauvegarder avec transaction
    // 9. Notifier rôles concernés si priority=high/critical
    // 10. Logger création avec détails
    // 11. Déclencher analyse impact organisationnel (async)
  }
}

type CreateInteractionRequest = {
  metadata: {
    category: 'interne' | 'externe' | 'client';
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    estimatedEffort?: number;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'adhoc';
  };
  vue1: {
    roleId: string;
    title: string;
    fournit: string[];
    livrables: string[];
    attend: string[];
    livrablesAttendus: string[];
    contraintes?: string[];
    sla?: {responseTime: number, deliveryTime: number};
  };
  vue2: {
    roleId: string;
    title: string;
    fournit: string[];
    livrables: string[];
    attend: string[];
    livrablesAttendus: string[];
    contraintes?: string[];
    sla?: {responseTime: number, deliveryTime: number};
  };
  requesterId: string;
}
```

**GetInteractionMatrixUseCase - Analytics Avancés**
```typescript
class GetInteractionMatrixUseCase implements IUseCase<GetMatrixRequest, GetMatrixResponse> {
  constructor(
    private readonly interactionRepository: IInteractionRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly analyticsService: IInteractionAnalyticsService
  ) {}

  async execute(request: GetMatrixRequest): Promise<GetMatrixResponse> {
    // 1. Récupérer interactions selon roleIds filtre
    // 2. Grouper interactions par rôle (vue1.roleId et vue2.roleId)
    // 3. Pour chaque rôle, calculer stats locales
    // 4. Calculer stats globales inter-rôles
    // 5. Identifier patterns de collaboration
    // 6. Calculer métriques densité réseau
    // 7. Détecter goulots d'étranglement potentiels
    // 8. Générer recommandations optimisation
  }
}

type GetMatrixResponse = {
  matrix: Array<{
    roleId: string;
    roleName: string;
    roleCategory: string;
    interactions: InteractionSummary[];
    stats: {
      total: number;
      asProvider: number;         // Rôle en vue1 (fournit)
      asConsumer: number;         // Rôle en vue2 (reçoit)
      byPriority: Record<string, number>;
      byCategory: Record<string, number>;
      averageComplexity: number;
      collaborationScore: number; // Score collaboration 0-100
    };
    networkMetrics: {
      centrality: number;         // Centralité dans réseau
      bridgeRole: boolean;        // Rôle pont entre équipes
      bottleneckRisk: number;     // Risque goulot 0-100
    };
  }>;
  globalStats: {
    totalInteractions: number;
    networkDensity: number;       // Densité réseau collaboration
    clusteringCoefficient: number;
    averagePathLength: number;
    mostConnectedRole: string;
    criticalPaths: Array<{        // Chemins critiques
      path: string[];
      priority: string;
      riskScore: number;
    }>;
  };
  recommendations: Array<{
    type: 'optimization' | 'risk_mitigation' | 'efficiency_improvement';
    description: string;
    priority: 'low' | 'medium' | 'high';
    affectedRoles: string[];
    expectedImpact: string;
  }>;
}
```

**SearchInteractionsUseCase avec ML Scoring**
```typescript
class SearchInteractionsUseCase implements IUseCase<SearchRequest, SearchResponse> {
  constructor(
    private readonly searchEngine: IAdvancedSearchEngine,
    private readonly mlScoringService: IMLScoringService
  ) {}

  async execute(request: SearchRequest): Promise<SearchResponse> {
    // 1. Préprocesser query (tokenisation, stemming)
    // 2. Construire requête ElasticSearch multi-champs
    // 3. Appliquer filtres structurés
    // 4. Exécuter recherche avec boost par champ
    // 5. Post-traiter avec ML scoring personnalisé
    // 6. Identifier champs matchés et extraire snippets
    // 7. Appliquer fuzzy matching si demandé
    // 8. Logger requête pour analytics et amélioration
  }
}

type SearchRequest = {
  query: string;                   // Requête utilisateur
  filters: {
    category?: string[];
    priority?: string[];
    roleIds?: string[];
    dateRange?: {from: Date, to: Date};
    tags?: string[];
    hasConstraints?: boolean;
    hasSLA?: boolean;
  };
  options: {
    includeContent?: boolean;      // Inclure extraits contenu
    fuzzyMatch?: boolean;          // Tolérance fautes de frappe
    limit?: number;                // Max résultats (défaut 10)
    offset?: number;               // Pagination
    highlightMatches?: boolean;    // Surbrillance matches
  };
  requesterId: string;
}

type SearchResponse = {
  results: Array<{
    interaction: Interaction;
    relevanceScore: number;        // Score 0-100
    matchedFields: string[];       // Champs ayant matché
    highlights: Record<string, string[]>; // Extraits surlignés
    explanation?: string;          // Explication score (debug)
  }>;
  totalResults: number;
  searchTime: number;              // Millisecondes
  suggestions: string[];           // Suggestions amélioration query
  facets: {                        // Facettes pour refinement
    categories: Record<string, number>;
    priorities: Record<string, number>;
    roles: Record<string, number>;
    tags: Record<string, number>;
  };
}
```

### 🔧 Infrastructure Layer - Repository & Services Avancés

**IInteractionRepository Extended**
```typescript
interface IInteractionRepository extends IRepository<Interaction> {
  // Queries de base étendues
  findByRoleId(roleId: string): Promise<Interaction[]>
  findByRolePair(roleId1: string, roleId2: string): Promise<Interaction[]>
  findByCategory(category: 'interne' | 'externe' | 'client'): Promise<Interaction[]>
  findByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<Interaction[]>
  findByTags(tags: string[]): Promise<Interaction[]>
  
  // Requêtes complexes avec performance
  findPaginatedWithAdvancedFilters(
    filters: InteractionFilters,
    pagination: PaginationParams,
    sort: SortParams
  ): Promise<PaginatedResult<Interaction>>
  
  // Analytics et agrégations
  getInteractionMatrix(roleIds?: string[]): Promise<InteractionMatrix>
  getStatsByCategory(): Promise<Record<string, number>>
  getStatsByPriority(): Promise<Record<string, number>>
  getStatsByRole(): Promise<Record<string, InteractionRoleStats>>
  
  // Recherche full-text
  searchInteractions(
    query: string, 
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<SearchResult<Interaction>>
  
  // Relations et dépendances
  findDependencies(interactionId: string): Promise<InteractionDependencies>
  findSimilarInteractions(interactionId: string, threshold: number): Promise<Interaction[]>
  
  // Network analysis
  calculateNetworkMetrics(): Promise<NetworkMetrics>
  findCriticalPaths(): Promise<CriticalPath[]>
  identifyBottlenecks(): Promise<Bottleneck[]>
}

type InteractionFilters = {
  category?: 'interne' | 'externe' | 'client';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  roleIds?: string[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
  hasConstraints?: boolean;
  hasSLA?: boolean;
  complexityRange?: {min: number, max: number};
}
```

**Services Infrastructure Spécialisés**
```typescript
interface IInteractionAnalyticsService {
  calculateComplexityScore(interaction: Interaction): number
  analyzeCollaborationPatterns(roleId: string): Promise<CollaborationAnalysis>
  identifyOptimizationOpportunities(): Promise<OptimizationRecommendation[]>
  calculateNetworkCentrality(roleId: string): Promise<number>
  detectAnomalies(): Promise<InteractionAnomaly[]>
}

interface IAdvancedSearchEngine {
  indexInteraction(interaction: Interaction): Promise<void>
  searchWithScoring(query: SearchQuery): Promise<SearchResult[]>
  suggestQueries(partial: string): Promise<string[]>
  updateSearchAnalytics(query: string, results: number): Promise<void>
}

interface IInteractionValidator {
  validateRolePair(roleId1: string, roleId2: string): Promise<ValidationResult>
  validateBidirectionalConsistency(vue1: InteractionVue, vue2: InteractionVue): ValidationResult
  checkDuplicateRisk(interaction: Interaction): Promise<DuplicateRisk>
  validateBusinessRules(interaction: Interaction): ValidationResult
}

interface INotificationService {
  notifyRoleAssignees(roleIds: string[], event: InteractionEvent): Promise<void>
  notifyHighPriorityInteraction(interaction: Interaction): Promise<void>
  sendCollaborationSummary(roleId: string, period: 'weekly' | 'monthly'): Promise<void>
}
```

### 🎮 Presentation Layer - API Endpoints Avancés

**GET /interactions - Avec filtres et analytics**
```http
GET /interactions?page=1&limit=20&category=interne&priority=high&roleIds=role-123,role-456&search=specification&dateFrom=2024-01-01&dateTo=2024-01-31&includeStats=true
Authorization: Bearer {jwt_token}

Response 200:
{
  "interactions": [
    {
      "id": "interaction-789",
      "metadata": {
        "category": "interne",
        "priority": "high",
        "tags": ["collaboration", "produit"],
        "estimatedEffort": 8,
        "frequency": "weekly"
      },
      "vue1": {
        "roleId": "role-dev",
        "roleName": "Senior Developer",
        "title": "Développe les features",
        "fournit": ["Code", "Tests unitaires"],
        "livrables": ["Pull Request", "Documentation technique"],
        "attend": ["Spécifications détaillées", "Maquettes"],
        "livrablesAttendus": ["User Stories", "Wireframes"],
        "sla": {"responseTime": 4, "deliveryTime": 3}
      },
      "vue2": {
        "roleId": "role-ux",
        "roleName": "UX Designer", 
        "title": "Conçoit l'expérience utilisateur",
        "fournit": ["Maquettes", "Guidelines UX"],
        "livrables": ["Figma files", "Style guide"],
        "attend": ["Feedback technique", "Contraintes"],
        "livrablesAttendus": ["Faisabilité", "Estimations"]
      },
      "complexityScore": 75,
      "isActive": true,
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "aggregations": {
    "totalByCategory": {"interne": 45, "externe": 12, "client": 8},
    "totalByPriority": {"low": 15, "medium": 25, "high": 20, "critical": 5},
    "averageComplexity": 68.4
  }
}
```

**GET /interactions/matrix - Vue matricielle analytics**
```http
GET /interactions/matrix?roleIds=role-dev,role-ux,role-pm&includeStats=true
Authorization: Bearer {jwt_token}

Response 200:
{
  "matrix": [
    {
      "roleId": "role-dev",
      "roleName": "Senior Developer",
      "roleCategory": "Development",
      "interactions": [
        {
          "id": "interaction-789",
          "partnerRoleId": "role-ux",
          "partnerRoleName": "UX Designer",
          "priority": "high",
          "category": "interne",
          "title": "Feature development collaboration"
        }
      ],
      "stats": {
        "total": 12,
        "asProvider": 8,
        "asConsumer": 4,
        "byPriority": {"low": 2, "medium": 6, "high": 3, "critical": 1},
        "byCategory": {"interne": 10, "externe": 2, "client": 0},
        "averageComplexity": 72.5,
        "collaborationScore": 85
      },
      "networkMetrics": {
        "centrality": 0.78,
        "bridgeRole": true,
        "bottleneckRisk": 25
      }
    }
  ],
  "globalStats": {
    "totalInteractions": 45,
    "networkDensity": 0.67,
    "clusteringCoefficient": 0.54,
    "averagePathLength": 2.3,
    "mostConnectedRole": "role-pm",
    "criticalPaths": [
      {
        "path": ["role-ux", "role-dev", "role-qa"],
        "priority": "critical",
        "riskScore": 85
      }
    ]
  },
  "recommendations": [
    {
      "type": "optimization",
      "description": "Consider redistributing interactions from role-pm to reduce bottleneck risk",
      "priority": "medium",
      "affectedRoles": ["role-pm", "role-dev", "role-ux"],
      "expectedImpact": "Reduce delivery time by 15-20%"
    }
  ]
}
```

**POST /interactions/search - Recherche avancée avec ML**
```http
POST /interactions/search
Authorization: Bearer {jwt_token}

{
  "query": "développement react frontend",
  "filters": {
    "category": ["interne"],
    "priority": ["high", "critical"],
    "roleIds": ["role-dev", "role-frontend"]
  },
  "options": {
    "includeContent": true,
    "fuzzyMatch": true,
    "limit": 5,
    "highlightMatches": true
  }
}

Response 200:
{
  "results": [
    {
      "interaction": {
        "id": "interaction-456",
        "metadata": {"category": "interne", "priority": "high"},
        // ... interaction complète
      },
      "relevanceScore": 94.5,
      "matchedFields": ["vue1.title", "vue1.fournit", "metadata.tags"],
      "highlights": {
        "vue1.title": ["Développement des composants <em>React</em> pour le <em>frontend</em>"],
        "vue1.fournit": ["Code <em>React</em>", "Tests <em>frontend</em>"]
      }
    }
  ],
  "totalResults": 8,
  "searchTime": 45,
  "suggestions": ["développement react components", "frontend react hooks"],
  "facets": {
    "categories": {"interne": 8, "externe": 2},
    "priorities": {"high": 6, "critical": 2},
    "roles": {"role-dev": 5, "role-frontend": 3},
    "tags": {"react": 8, "frontend": 6, "components": 4}
  }
}
```

---

## 🔐 Spécifications Sécurité & Autorisations

### Autorisations Granulaires
```typescript
const InteractionPermissions = {
  // Consultation
  VIEW_INTERACTIONS: ['admin', 'manager', 'analyst', 'user'],
  VIEW_INTERACTION_DETAILS: ['admin', 'manager', 'analyst'],
  VIEW_INTERACTION_MATRIX: ['admin', 'manager', 'analyst'],
  VIEW_ANALYTICS: ['admin', 'manager', 'analyst'],
  
  // Gestion
  CREATE_INTERACTION: ['admin', 'manager', 'analyst'],
  UPDATE_INTERACTION: ['admin', 'manager', 'analyst'],
  DELETE_INTERACTION: ['admin', 'manager'],
  
  // Recherche avancée
  ADVANCED_SEARCH: ['admin', 'manager', 'analyst'],
  EXPORT_INTERACTIONS: ['admin', 'manager'],
  
  // Analytics sensibles
  VIEW_NETWORK_ANALYSIS: ['admin', 'manager'],
  VIEW_BOTTLENECK_ANALYSIS: ['admin', 'manager'],
  VIEW_RECOMMENDATIONS: ['admin', 'manager']
}
```

### Filtrage des Données par Rôle
```typescript
const DataVisibility = {
  admin: {
    fields: ['*'],
    interactions: 'all',
    analytics: 'full'
  },
  manager: {
    fields: ['*'],
    interactions: 'department_related', // Rôles de son département
    analytics: 'department_scoped'
  },
  analyst: {
    fields: ['id', 'metadata', 'vue1', 'vue2', 'complexityScore', 'timestamps'],
    interactions: 'all',
    analytics: 'readonly'
  },
  user: {
    fields: ['id', 'metadata.category', 'metadata.priority', 'vue1.title', 'vue2.title'],
    interactions: 'role_related', // Seulement interactions de son rôle
    analytics: 'none'
  }
}
```

---

## 📊 Monitoring, Métriques & Observabilité

### Logs Structurés Métier
```json
{
  "level": "INFO",
  "event": "interaction_created",
  "createdBy": "analyst-123",
  "interactionId": "interaction-789",
  "roleIds": ["role-dev", "role-ux"],
  "category": "interne",
  "priority": "high",
  "complexityScore": 75,
  "estimatedEffort": 8
}

{
  "level": "INFO", 
  "event": "interaction_matrix_generated",
  "requestedBy": "manager-456",
  "roleIdsFilter": ["role-dev", "role-ux", "role-pm"],
  "totalInteractions": 45,
  "networkDensity": 0.67,
  "generationTime": 234
}
```

### Métriques Business Critiques
- `interactions.created.count` - Interactions créées
- `interactions.updated.count` - Modifications
- `interactions.matrix.requests.count` - Demandes matrice
- `interactions.search.queries.count` - Recherches
- `interactions.complexity.distribution` - Distribution complexité
- `interactions.network.density` - Densité réseau collaboration
- `interactions.bottleneck.alerts.count` - Alertes goulots détectés

### Dashboard Analytics Temps Réel
```typescript
const InteractionMetrics = {
  realTime: {
    activeInteractions: () => countActiveInteractions(),
    networkHealth: () => calculateNetworkHealth(),
    bottleneckAlerts: () => getBottleneckAlerts(),
    collaborationScore: () => getGlobalCollaborationScore()
  },
  daily: {
    interactionsCreated: () => getDailyCreations(),
    searchQueries: () => getDailySearches(),
    matrixGenerations: () => getDailyMatrixRequests(),
    averageComplexity: () => getDailyAverageComplexity()
  },
  trends: {
    networkEvolution: () => getNetworkEvolutionTrend(),
    complexityTrend: () => getComplexityTrend(),
    collaborationTrend: () => getCollaborationTrend()
  }
}
```

---

## 🧪 Tests Spécifications Avancées

### Tests Domain Logic
```typescript
describe('Interaction Entity', () => {
  it('should calculate complexity score based on deliverables and constraints')
  it('should validate bidirectional consistency between vue1 and vue2')
  it('should normalize tags and remove duplicates')
  it('should detect invalid role pairs')
  it('should handle SLA validation')
})

describe('InteractionCategory Value Object', () => {
  it('should validate category values')
  it('should provide color coding for UI')
  it('should compare categories correctly')
})
```

### Tests Use Cases Complexes
```typescript
describe('GetInteractionMatrixUseCase', () => {
  it('should generate complete matrix with network metrics')
  it('should calculate collaboration scores accurately')
  it('should identify bottlenecks correctly')
  it('should provide optimization recommendations')
  it('should handle large datasets efficiently (1000+ interactions)')
})

describe('SearchInteractionsUseCase', () => {
  it('should rank results by relevance score')
  it('should handle fuzzy matching with typos')
  it('should apply filters correctly')
  it('should provide faceted navigation')
  it('should suggest query improvements')
})
```

### Tests Performance & Stress
```typescript
describe('Interactions Performance', () => {
  it('should handle 10000+ interactions in matrix generation < 2s')
  it('should support concurrent search queries without degradation')
  it('should maintain response time < 500ms for filtered lists')
  it('should handle complex search queries < 1s')
})
```

---

## 🎯 Performance Requirements Critiques

- **GET /interactions (liste filtrée)** : p95 < 400ms avec 10,000+ interactions
- **GET /interactions/matrix** : p95 < 2s avec analyse réseau complète
- **POST /interactions/search** : p95 < 800ms avec fuzzy matching
- **POST /interactions** : p95 < 300ms avec validation complète
- **Network analytics** : Recalcul temps réel < 5s pour 1000+ interactions

### Optimisations Performance
- Index composites sur (category, priority, roleId, createdAt)
- Cache Redis pour matrices fréquemment demandées (TTL 15min)
- ElasticSearch pour recherche full-text performante
- Calculs analytics en background avec mise à jour incrémentale

---

## ✅ Definition of Done Complète

### Development
- [ ] **Domain** : Interaction entity + VOs + exceptions métier
- [ ] **Application** : 6 Use Cases (Get, GetById, Create, Update, Delete, Matrix, Search, Stats)
- [ ] **Infrastructure** : Repository avancé + services analytics + search engine
- [ ] **Presentation** : 8 endpoints avec validation complète

### Business Logic
- [ ] **Validation** : Cohérence bidirectionnelle interactions
- [ ] **Analytics** : Métriques réseau et recommandations
- [ ] **Search** : Full-text avec scoring ML et facettes
- [ ] **Matrix** : Vue matricielle avec network analysis

### Performance & Scale
- [ ] **Index DB** : Optimisations pour 10,000+ interactions
- [ ] **Cache** : Strategy intelligent pour analytics
- [ ] **Search** : ElasticSearch intégré et performant
- [ ] **Real-time** : Métriques temps réel sans impact performance

---

## 🔗 Dépendances

**Précédentes :** US03 (Roles Management) - Utilise Role entities pour validation
**Suivantes :** US05 (Reports) - Interactions utilisées dans rapports analytics

---

**Priorité :** 🚀 **CRITICAL** - Cœur de la cartographie organisationnelle