# US05 : Gestion des Rapports Hebdomadaires & WSJF

## 📋 User Story
**En tant qu'employé et manager, je veux créer et suivre des rapports hebdomadaires et WSJF pour mesurer la productivité, prioriser les tâches et optimiser la planification des sprints.**

**Valeur métier :** Améliorer la visibilité sur l'avancement des projets, optimiser la priorisation des features et faciliter les décisions data-driven.

---

## 🎯 Critères d'Acceptation Techniques

### 📅 **RAPPORTS HEBDOMADAIRES**

#### ✅ Scénario 1 : Création Rapport Hebdo avec Tâches Structurées
```gherkin
GIVEN utilisateur authentifié "user-123"
AND semaine "2024-W03" n'a pas encore de rapport
WHEN POST /reports/hebdo avec {week:"2024-W03", title:"Sprint Planning & Dev Tasks", tasks:[{title:"Implement user login", description:"JWT auth with refresh tokens", priority:"high", estimatedHours:8, assignedTo:"user-123", tags:["auth", "security"]}, {title:"Setup CI/CD pipeline", priority:"medium", estimatedHours:4, tags:["devops"]}], objectives:["Complete authentication feature", "Improve deployment process"], notes:"Focus on security best practices"}
THEN status=201
AND rapport créé avec status="draft"
AND tâches avec IDs uniques générés
AND estimatedHours totales calculées (12h)
AND response contient rapport complet avec métriques initiales
```

#### ✅ Scénario 2 : Mise à Jour Statut Tâches avec Métriques
```gherkin
GIVEN rapport hebdo existe avec tâche "task-456" estimée à 8h
WHEN PUT /reports/hebdo/task-status avec {taskId:"task-456", completed:true, actualHours:10, notes:"Plus complexe que prévu, gestion des erreurs ajoutée"}
THEN status=200
AND tâche marquée completed=true
AND actualHours=10 enregistrées
AND notes de tâche mises à jour
AND métriques rapport recalculées (completion rate, variance estimation)
AND response success message
```

#### ✅ Scénario 3 : Récupération Rapports avec Stats Avancées
```gherkin
GIVEN utilisateur a 4 rapports sur le mois courant
AND rapports contiennent mix de tâches completed/pending
WHEN GET /reports/hebdo?userId=user-123&limit=10
THEN status=200
AND rapports triés par week DESC
AND chaque rapport inclut métriques: {totalTasks, completedTasks, completionRate, totalEstimated, totalActual, variance}
AND status calculé: "draft" | "submitted" | "overdue"
```

#### ✅ Scénario 4 : Statistiques Hebdo Utilisateur
```gherkin
GIVEN utilisateur avec historique de 8 rapports sur 2 mois
WHEN GET /reports/hebdo/stats?userId=user-123
THEN status=200
AND response contient: {totalReports:8, thisMonthReports:4, submittedOnTime:6, overdue:2, totalTasks:45, completedTasks:38, pendingTasks:7, completionRate:84.4, averageTasksPerReport:5.6, averageHoursPerTask:6.2, thisWeekProgress:75}
AND tendances calculées (amélioration/dégradation performance)
```

### 🎯 **RAPPORTS WSJF (Weighted Shortest Job First)**

#### ✅ Scénario 5 : Création Rapport WSJF avec Calcul Automatique Scores
```gherkin
GIVEN utilisateur "pm-456" avec rôle Product Manager
WHEN POST /reports/wsjf avec {title:"Q1 Feature Prioritization", week:"2024-W04", tasks:[{title:"User dashboard redesign", description:"Improve UX for main dashboard", priority:"high", businessValue:8, timeCriticality:6, riskReduction:4, jobSize:5}, {title:"API rate limiting", businessValue:5, timeCriticality:9, riskReduction:8, jobSize:3}], notes:"Focus on customer satisfaction metrics"}
THEN status=201
AND tâches avec scores WSJF calculés automatiquement
AND task1: wsjfScore = (8+6+4)/5 = 3.6
AND task2: wsjfScore = (5+9+8)/3 = 7.33
AND tâches triées par score WSJF DESC dans response
AND rapport status="draft"
```

#### ✅ Scénario 6 : Mise à Jour Scores WSJF avec Recalcul
```gherkin
GIVEN rapport WSJF existe avec tâche ayant businessValue=5
WHEN PUT /reports/wsjf/task avec {taskId:"wsjf-task-789", businessValue:9, timeCriticality:7}
THEN status=200
AND score WSJF recalculé automatiquement
AND ordre des tâches mis à jour selon nouveaux scores
AND historique changement de priorité loggé
```

#### ✅ Scénario 7 : Statistiques WSJF avec Analytics Avancées
```gherkin
GIVEN utilisateur avec 5 rapports WSJF sur trimestre
WHEN GET /reports/wsjf/stats?userId=pm-456
THEN status=200
AND response: {totalReports:5, averageScore:4.8, totalTasks:23, completedTasks:18, topFeatures:[{name:"API optimization", score:8.2, userValue:8, jobSize:3}]}
AND analyse tendances priorisation
AND identification features sous-estimées/sur-estimées
```

### 📈 **MÉTRIQUES & ANALYTICS COMBINÉES**

#### ✅ Scénario 8 : Métriques Hebdomadaires Utilisateur Consolidées
```gherkin
GIVEN utilisateur avec rapports hebdo + WSJF sur période
WHEN GET /reports/weekly-metrics?userId=user-123&week=2024-W04
THEN status=200
AND response: {productivity:85, efficiency:78, qualityScore:92, burndownRate:1.2, velocityPoints:34}
AND métriques calculées depuis les deux types de rapports
AND benchmark vs moyennes équipe/département
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Entités Métier

**Entité HebdoReport**
```typescript
class HebdoReport extends BaseEntity {
  props: {
    id: string;                    // UUID v4
    userId: string;                // Propriétaire du rapport
    week: string;                  // Format ISO "2024-W03"
    title: string;                 // Titre descriptif
    tasks: HebdoTask[];            // Array des tâches
    objectives: string[];          // Objectifs de la semaine
    notes?: string;                // Notes libres
    status: ReportStatus;          // draft | submitted | overdue
    submittedAt?: Date;            // Timestamp soumission
    createdAt: Date;
    updatedAt: Date;
  }

  // Méthodes métier
  addTask(task: Omit<HebdoTask, 'id' | 'completed'>): void
  updateTaskStatus(taskId: string, completed: boolean, actualHours?: number, notes?: string): void
  removeTask(taskId: string): void
  addObjective(objective: string): void
  removeObjective(objective: string): void
  submit(): void
  markOverdue(): void
  
  // Calculs métriques
  getCompletedTasksCount(): number
  getTotalTasksCount(): number
  getCompletionRate(): number              // Pourcentage tâches completed
  getTotalEstimatedHours(): number
  getTotalActualHours(): number
  getEstimationVariance(): number          // (actual - estimated) / estimated
  getProductivityScore(): number           // Score basé sur completion + variance
  
  // Validations business
  canBeSubmitted(): boolean               // Au moins 1 tâche ou objectif
  isOverdue(): boolean                    // Soumis après deadline (dimanche 23h59)
  hasHighPriorityTasks(): boolean
}

type HebdoTask = {
  id: string;                     // UUID unique
  title: string;                  // Description courte
  description?: string;           // Description détaillée
  priority: TaskPriority;         // VO low|medium|high|critical
  estimatedHours: number;         // Estimation initiale
  actualHours?: number;           // Temps réel passé
  assignedTo?: string;            // UserID si délégué
  tags: string[];                 // Tags normalisés
  completed: boolean;             // Statut completion
  notes?: string;                 // Notes sur réalisation
  createdAt: Date;
  completedAt?: Date;             // Timestamp completion
}
```

**Entité WSJFReport**
```typescript
class WSJFReport extends BaseEntity {
  props: {
    id: string;
    userId: string;
    title: string;
    week: string;                  // Format ISO "2024-W04"
    tasks: WSJFTask[];             // Features à prioriser
    notes?: string;
    status: ReportStatus;          // draft | submitted | overdue
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  // Méthodes métier
  addTask(task: Omit<WSJFTask, 'id' | 'completed' | 'wsjfScore'>): void
  updateTask(taskId: string, updates: Partial<WSJFTask>): void
  removeTask(taskId: string): void
  submit(): void
  markOverdue(): void
  
  // Calculs WSJF
  private calculateWSJFScore(businessValue: number, timeCriticality: number, riskReduction: number, jobSize: number): number
  getTasksSortedByWSJF(): WSJFTask[]       // Tri par score DESC
  getHighestPriorityTask(): WSJFTask | undefined
  getAverageWSJFScore(): number
  
  // Métriques
  getCompletedTasksCount(): number
  getTotalTasksCount(): number
  getCompletionRate(): number
  getTotalBusinessValue(): number          // Somme business values
  getEfficiencyScore(): number             // Rapport value/effort
  
  // Analytics avancées
  identifyUnderestimatedTasks(): WSJFTask[] // jobSize faible mais effort réel élevé
  identifyOverestimatedTasks(): WSJFTask[]  // jobSize élevé mais effort réel faible
  getValueDistribution(): Record<string, number> // Répartition par catégorie value
}

type WSJFTask = {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;          // Priorité business (pas WSJF)
  businessValue: number;           // 1-10, valeur métier
  timeCriticality: number;         // 1-10, urgence temporelle  
  riskReduction: number;           // 1-10, réduction risque
  jobSize: number;                 // 1-10, taille/complexité travail
  wsjfScore: number;               // Calculé: (BV + TC + RR) / JS
  completed: boolean;
  completedAt?: Date;
  actualEffort?: number;           // Effort réel post-completion
  category?: string;               // Feature, Bug, Tech Debt, etc.
  createdAt: Date;
}
```

**Value Objects**
```typescript
class ReportStatus {
  private readonly _value: 'draft' | 'submitted' | 'overdue';
  
  static create(status: string): ReportStatus
  static createDraft(): ReportStatus
  static createSubmitted(): ReportStatus  
  static createOverdue(): ReportStatus
  
  get value(): 'draft' | 'submitted' | 'overdue'
  isDraft(): boolean
  isSubmitted(): boolean
  isOverdue(): boolean
  canBeEdited(): boolean           // draft seulement
  getColor(): string               // UI color coding
}

class TaskPriority {
  private readonly _value: 'low' | 'medium' | 'high' | 'critical';
  
  static create(priority: string): TaskPriority
  get value(): 'low' | 'medium' | 'high' | 'critical'
  getNumericValue(): number        // 1-4 pour calculs
  isHighPriority(): boolean        // high ou critical
  getUrgencyMultiplier(): number   // Facteur urgence pour métriques
}
```

### 📋 Application Layer - Use Cases Métier

**CreateHebdoReportUseCase**
```typescript
class CreateHebdoReportUseCase implements IUseCase<CreateHebdoReportRequest, CreateHebdoReportResponse> {
  constructor(
    private readonly reportRepository: IHebdoReportRepository,
    private readonly userRepository: IUserRepository,
    private readonly weekValidationService: IWeekValidationService,
    private readonly taskNormalizationService: ITaskNormalizationService
  ) {}

  async execute(request: CreateHebdoReportRequest): Promise<CreateHebdoReportResponse> {
    // 1. Valider utilisateur existe et est actif
    // 2. Valider format semaine ISO (2024-W03)
    // 3. Vérifier pas de rapport existant pour cette semaine/user
    // 4. Normaliser et valider tâches (titre, priority, estimations)
    // 5. Générer IDs uniques pour chaque tâche
    // 6. Calculer métriques initiales
    // 7. Créer entité HebdoReport avec status=draft
    // 8. Sauvegarder avec transaction
    // 9. Logger création rapport
    // 10. Programmer reminder soumission (dimanche soir)
  }
}

type CreateHebdoReportRequest = {
  userId: string;
  week: string;                    // "2024-W03"
  title: string;
  tasks?: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours: number;
    assignedTo?: string;
    tags: string[];
  }>;
  objectives?: string[];
  notes?: string;
}
```

**UpdateTaskStatusUseCase**
```typescript
class UpdateTaskStatusUseCase implements IUseCase<UpdateTaskStatusRequest, UpdateTaskStatusResponse> {
  constructor(
    private readonly reportRepository: IHebdoReportRepository,
    private readonly metricsCalculationService: IMetricsCalculationService,
    private readonly notificationService: INotificationService
  ) {}

  async execute(request: UpdateTaskStatusRequest): Promise<UpdateTaskStatusResponse> {
    // 1. Récupérer rapport contenant la tâche
    // 2. Vérifier permissions (propriétaire ou assigné)
    // 3. Valider tâche existe et peut être modifiée
    // 4. Mettre à jour statut avec timestamp approprié
    // 5. Recalculer métriques rapport (completion rate, variance)
    // 6. Déclencher notifications si tâche critique complétée
    // 7. Sauvegarder changements
    // 8. Logger progression tâche
    // 9. Mettre à jour dashboards temps réel
  }
}
```

**CreateWSJFReportUseCase**
```typescript
class CreateWSJFReportUseCase implements IUseCase<CreateWSJFReportRequest, CreateWSJFReportResponse> {
  constructor(
    private readonly wsjfRepository: IWSJFReportRepository,
    private readonly wsjfCalculationService: IWSJFCalculationService,
    private readonly businessRuleValidator: IBusinessRuleValidator
  ) {}

  async execute(request: CreateWSJFReportRequest): Promise<CreateWSJFReportResponse> {
    // 1. Valider utilisateur a permissions Product Management
    // 2. Valider format semaine et unicité
    // 3. Valider scores WSJF (1-10 pour chaque dimension)
    // 4. Calculer scores WSJF pour chaque tâche
    // 5. Trier tâches par score décroissant
    // 6. Appliquer business rules (ex: max 1 critical par semaine)
    // 7. Créer entité WSJFReport
    // 8. Sauvegarder avec audit complet
    // 9. Déclencher analyse comparative vs rapports précédents
    // 10. Notifier stakeholders des nouvelles priorités
  }
}

type CreateWSJFReportRequest = {
  userId: string;
  title: string;
  week: string;
  tasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    businessValue: number;         // 1-10
    timeCriticality: number;       // 1-10
    riskReduction: number;         // 1-10
    jobSize: number;               // 1-10
    category?: string;
  }>;
  notes?: string;
}
```

**GetReportsStatsUseCase**
```typescript
class GetReportsStatsUseCase implements IUseCase<GetReportsStatsRequest, GetReportsStatsResponse> {
  constructor(
    private readonly hebdoRepository: IHebdoReportRepository,
    private readonly wsjfRepository: IWSJFReportRepository,
    private readonly analyticsService: IReportsAnalyticsService,
    private readonly benchmarkingService: IBenchmarkingService
  ) {}

  async execute(request: GetReportsStatsRequest): Promise<GetReportsStatsResponse> {
    // 1. Récupérer rapports selon filtres temporels
    // 2. Calculer métriques individuelles (completion rates, variances)
    // 3. Calculer agrégations (moyennes, tendances)
    // 4. Comparer vs benchmarks équipe/département
    // 5. Identifier patterns et anomalies
    // 6. Générer insights et recommandations
    // 7. Formater réponse avec visualisations data
  }
}

type GetReportsStatsResponse = {
  hebdoStats: {
    totalReports: number;
    thisMonthReports: number;
    submittedOnTime: number;
    overdue: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;        // Pourcentage global
    averageTasksPerReport: number;
    averageHoursPerTask: number;
    thisWeekProgress: number;
    estimationAccuracy: number;    // Précision estimations
    productivityTrend: 'up' | 'down' | 'stable';
  };
  wsjfStats: {
    totalReports: number;
    thisMonthReports: number;
    averageScore: number;
    totalTasks: number;
    completedTasks: number;
    highValueTasksRatio: number;   // Ratio tâches haute valeur
    efficiencyScore: number;       // Value delivered / effort
    prioritizationAccuracy: number; // Corrélation score WSJF / résultats
  };
  benchmarks: {
    teamAverage: BenchmarkMetrics;
    departmentAverage: BenchmarkMetrics;
    userRanking: {
      productivity: number;        // Rang utilisateur /100
      consistency: number;
      quality: number;
    };
  };
  insights: Array<{
    type: 'improvement' | 'warning' | 'achievement';
    category: 'productivity' | 'estimation' | 'prioritization';
    message: string;
    actionable: boolean;
    impact: 'low' | 'medium' | 'high';
  }>;
}
```

### 🔧 Infrastructure Layer - Repositories Spécialisés

**IHebdoReportRepository**
```typescript
interface IHebdoReportRepository extends IRepository<HebdoReport> {
  // Queries spécialisées
  findByUserAndWeek(userId: string, week: string): Promise<HebdoReport | null>
  findByUserAndDateRange(userId: string, from: Date, to: Date): Promise<HebdoReport[]>
  findOverdueReports(): Promise<HebdoReport[]>
  findByStatus(status: 'draft' | 'submitted' | 'overdue'): Promise<HebdoReport[]>
  
  // Analytics et métriques
  getUserCompletionStats(userId: string, period: DateRange): Promise<CompletionStats>
  getUserProductivityTrend(userId: string, weeks: number): Promise<ProductivityTrend>
  getEstimationAccuracy(userId: string, period: DateRange): Promise<EstimationMetrics>
  
  // Comparaisons et benchmarks
  getTeamAverageMetrics(teamId: string, period: DateRange): Promise<TeamMetrics>
  getDepartmentAverageMetrics(departmentId: string, period: DateRange): Promise<DepartmentMetrics>
  getUserRankingInTeam(userId: string, teamId: string, metric: 'productivity' | 'consistency'): Promise<number>
}

interface IWSJFReportRepository extends IRepository<WSJFReport> {
  // Queries WSJF spécifiques
  findByUserAndWeek(userId: string, week: string): Promise<WSJFReport | null>
  findByUserAndDateRange(userId: string, from: Date, to: Date): Promise<WSJFReport[]>
  
  // Analytics WSJF
  getAverageWSJFScore(userId: string, period: DateRange): Promise<number>
  getValueDeliveryMetrics(userId: string, period: DateRange): Promise<ValueMetrics>
  getPrioritizationAccuracy(userId: string, period: DateRange): Promise<PrioritizationMetrics>
  
  // Comparaisons features
  findSimilarTasks(task: WSJFTask, threshold: number): Promise<WSJFTask[]>
  getTaskComplexityBenchmarks(category: string): Promise<ComplexityBenchmark>
}
```

**Services Infrastructure Avancés**
```typescript
interface IMetricsCalculationService {
  calculateProductivityScore(report: HebdoReport): number
  calculateEfficiencyScore(report: WSJFReport): number
  calculateEstimationVariance(estimated: number, actual: number): number
  calculateCompletionTrend(reports: HebdoReport[]): TrendAnalysis
}

interface IWeekValidationService {
  validateISOWeek(week: string): boolean           // "2024-W03" format
  getCurrentWeek(): string
  getWeekRange(week: string): {start: Date, end: Date}
  isWeekOverdue(week: string): boolean
  getWeeklyDeadline(week: string): Date            // Dimanche 23:59
}

interface IBenchmarkingService {
  calculateUserBenchmark(userId: string, metric: string, period: DateRange): Promise<BenchmarkResult>
  getTeamLeaderboard(teamId: string, metric: string): Promise<LeaderboardEntry[]>
  identifyTopPerformers(departmentId: string, metric: string): Promise<TopPerformer[]>
  generateImprovementSuggestions(userId: string): Promise<ImprovementSuggestion[]>
}

interface IReportsAnalyticsService {
  analyzeProductivityPattern(userId: string, reports: HebdoReport[]): Promise<ProductivityPattern>
  detectEstimationBiases(userId: string, reports: HebdoReport[]): Promise<EstimationBias[]>
  identifyBottleneckTasks(reports: HebdoReport[]): Promise<BottleneckTask[]>
  predictWeeklyCapacity(userId: string, historicalWeeks: number): Promise<CapacityPrediction>
}
```

### 🎮 Presentation Layer - Endpoints Riches

**POST /reports/hebdo - Création avec validation**
```http
POST /reports/hebdo
Authorization: Bearer {jwt_token}

{
  "week": "2024-W05",
  "title": "Authentication & Security Implementation",
  "tasks": [
    {
      "title": "Implement JWT authentication",
      "description": "Complete auth flow with refresh tokens",
      "priority": "high",
      "estimatedHours": 12,
      "tags": ["auth", "security", "jwt"]
    },
    {
      "title": "Add rate limiting middleware",
      "priority": "medium", 
      "estimatedHours": 6,
      "tags": ["security", "middleware"]
    }
  ],
  "objectives": [
    "Complete user authentication system",
    "Enhance API security posture",
    "Prepare for security audit"
  ],
  "notes": "Focus on security best practices and comprehensive testing"
}

Response 201:
{
  "id": "hebdo-789",
  "userId": "user-123",
  "week": "2024-W05", 
  "title": "Authentication & Security Implementation",
  "tasks": [
    {
      "id": "task-456",
      "title": "Implement JWT authentication",
      "description": "Complete auth flow with refresh tokens",
      "priority": "high",
      "estimatedHours": 12,
      "actualHours": null,
      "tags": ["auth", "security", "jwt"],
      "completed": false,
      "createdAt": "2024-01-29T09:00:00Z"
    }
  ],
  "objectives": ["Complete user authentication system", "Enhance API security posture"],
  "status": "draft",
  "metrics": {
    "totalTasks": 2,
    "completedTasks": 0,
    "totalEstimatedHours": 18,
    "totalActualHours": 0,
    "completionRate": 0,
    "estimationVariance": 0
  },
  "createdAt": "2024-01-29T09:00:00Z"
}
```

**GET /reports/hebdo/stats - Analytics détaillées**
```http
GET /reports/hebdo/stats?userId=user-123
Authorization: Bearer {jwt_token}

Response 200:
{
  "totalReports": 12,
  "thisMonthReports": 4,
  "submittedOnTime": 9,
  "overdue": 3,
  "totalTasks": 67,
  "completedTasks": 58,
  "pendingTasks": 9,
  "overdueTasks": 2,
  "completionRate": 86.6,
  "averageTasksPerReport": 5.6,
  "averageHoursPerTask": 7.2,
  "thisWeekProgress": 75,
  "estimationAccuracy": 92.3,
  "productivityTrend": "up",
  "benchmarks": {
    "teamAverage": {
      "completionRate": 82.1,
      "estimationAccuracy": 88.7,
      "averageTasksPerReport": 6.2
    },
    "userRanking": {
      "productivity": 78,
      "consistency": 85,
      "quality": 92
    }
  },
  "insights": [
    {
      "type": "achievement", 
      "category": "productivity",
      "message": "Your completion rate improved by 12% this month",
      "actionable": false,
      "impact": "high"
    },
    {
      "type": "improvement",
      "category": "estimation", 
      "message": "Consider breaking down tasks >10h for better accuracy",
      "actionable": true,
      "impact": "medium"
    }
  ],
  "weeklyTrend": [
    {"week": "2024-W01", "completionRate": 78, "productivity": 82},
    {"week": "2024-W02", "completionRate": 85, "productivity": 88},
    {"week": "2024-W03", "completionRate": 91, "productivity": 94}
  ]
}
```

**POST /reports/wsjf - Avec calculs automatiques**
```http
POST /reports/wsjf
Authorization: Bearer {jwt_token}

{
  "title": "Q1 2024 Feature Prioritization",
  "week": "2024-W05",
  "tasks": [
    {
      "title": "Real-time notifications system",
      "description": "WebSocket-based notifications for instant updates",
      "priority": "high",
      "businessValue": 8,
      "timeCriticality": 7,
      "riskReduction": 5,
      "jobSize": 6,
      "category": "feature"
    },
    {
      "title": "Performance optimization",
      "businessValue": 6,
      "timeCriticality": 9,
      "riskReduction": 8,
      "jobSize": 4,
      "category": "technical"
    }
  ],
  "notes": "Focus on customer satisfaction and system stability"
}

Response 201:
{
  "id": "wsjf-456",
  "userId": "pm-123",
  "title": "Q1 2024 Feature Prioritization",
  "week": "2024-W05",
  "tasks": [
    {
      "id": "wsjf-task-789",
      "title": "Performance optimization",
      "businessValue": 6,
      "timeCriticality": 9, 
      "riskReduction": 8,
      "jobSize": 4,
      "wsjfScore": 5.75,
      "priority": "high",
      "category": "technical",
      "completed": false
    },
    {
      "id": "wsjf-task-790",
      "title": "Real-time notifications system", 
      "businessValue": 8,
      "timeCriticality": 7,
      "riskReduction": 5,
      "jobSize": 6,
      "wsjfScore": 3.33,
      "priority": "high",
      "category": "feature", 
      "completed": false
    }
  ],
  "status": "draft",
  "metrics": {
    "totalTasks": 2,
    "averageWSJFScore": 4.54,
    "totalBusinessValue": 14,
    "highestPriorityTask": "Performance optimization",
    "efficiencyScore": 3.5
  },
  "createdAt": "2024-01-29T14:30:00Z"
}
```

---

## 🔐 Sécurité & Autorisations

### Permissions Granulaires
```typescript
const ReportsPermissions = {
  // Rapports hebdomadaires
  CREATE_HEBDO_REPORT: ['admin', 'manager', 'user'],
  VIEW_OWN_HEBDO_REPORTS: ['admin', 'manager', 'user'],
  VIEW_TEAM_HEBDO_REPORTS: ['admin', 'manager'],
  UPDATE_OWN_HEBDO_REPORTS: ['admin', 'manager', 'user'],
  UPDATE_TEAM_HEBDO_REPORTS: ['admin', 'manager'],
  
  // Rapports WSJF (Product Management)
  CREATE_WSJF_REPORT: ['admin', 'product_manager', 'manager'],
  VIEW_WSJF_REPORTS: ['admin', 'product_manager', 'manager'],
  UPDATE_WSJF_REPORTS: ['admin', 'product_manager'],
  
  // Analytics et stats
  VIEW_OWN_STATS: ['admin', 'manager', 'user'],
  VIEW_TEAM_STATS: ['admin', 'manager'],
  VIEW_DEPARTMENT_STATS: ['admin', 'manager'],
  VIEW_BENCHMARKS: ['admin', 'manager'],
  EXPORT_REPORTS: ['admin', 'manager']
}
```

### Validation Métier
```typescript
const BusinessRules = {
  // Contraintes temporelles
  MAX_TASKS_PER_HEBDO_REPORT: 15,
  MAX_ESTIMATED_HOURS_PER_TASK: 40,
  SUBMISSION_DEADLINE: 'sunday_23_59',
  
  // Contraintes WSJF
  MAX_TASKS_PER_WSJF_REPORT: 10,
  WSJF_SCORE_RANGE: {min: 1, max: 10},
  MAX_CRITICAL_TASKS_PER_WEEK: 2,
  
  // Validation données
  REQUIRE_DESCRIPTION_FOR_HIGH_PRIORITY: true,
  MIN_ESTIMATION_HOURS: 0.5,
  MAX_WEEKLY_CAPACITY_HOURS: 60
}
```

---

## 📊 Monitoring & Métriques Business

### KPIs Critiques
- `reports.hebdo.completion_rate.avg` - Taux completion moyen
- `reports.hebdo.submission_on_time.rate` - Ponctualité soumissions
- `reports.hebdo.estimation_accuracy.avg` - Précision estimations
- `reports.wsjf.average_score` - Score WSJF moyen
- `reports.wsjf.value_delivery.efficiency` - Efficacité livraison valeur
- `reports.productivity.trend` - Tendance productivité équipes

### Alertes Automatisées
```typescript
const AlertRules = {
  HEBDO_OVERDUE: {
    condition: 'report not submitted by Monday 9AM',
    action: 'notify_user_and_manager',
    severity: 'medium'
  },
  LOW_COMPLETION_RATE: {
    condition: 'completion_rate < 70% for 2 consecutive weeks',
    action: 'trigger_manager_review',
    severity: 'high'
  },
  WSJF_SCORE_ANOMALY: {
    condition: 'average_wsjf_score < 2.0',
    action: 'suggest_prioritization_review',
    severity: 'low'
  }
}
```

---

## 🧪 Tests Spécifications

### Tests Calculs Métier
```typescript
describe('HebdoReport Entity', () => {
  it('should calculate completion rate correctly')
  it('should calculate estimation variance accurately') 
  it('should identify overdue status based on week and current date')
  it('should handle task status updates with metrics recalculation')
})

describe('WSJFReport Entity', () => {
  it('should calculate WSJF score using formula (BV+TC+RR)/JS')
  it('should sort tasks by WSJF score descending')
  it('should recalculate scores when task values updated')
  it('should identify highest priority task correctly')
})
```

### Tests Use Cases Métier
```typescript
describe('CreateHebdoReportUseCase', () => {
  it('should prevent duplicate reports for same user/week')
  it('should validate task estimations within business rules')
  it('should normalize and validate task tags')
  it('should set appropriate deadlines and reminders')
})

describe('GetReportsStatsUseCase', () => {
  it('should calculate accurate benchmarks vs team averages')
  it('should identify productivity trends correctly')
  it('should generate actionable insights based on data')
})
```

---

## 🎯 Performance Requirements

- **POST /reports/hebdo** : p95 < 300ms avec validation complète
- **GET /reports/hebdo/stats** : p95 < 500ms avec calculs complexes
- **PUT /reports/hebdo/task-status** : p95 < 200ms avec recalculs
- **POST /reports/wsjf** : p95 < 250ms avec scores WSJF
- **Analytics dashboards** : Temps réel < 1s avec cache intelligent

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : HebdoReport + WSJFReport entities avec logique métier
- [ ] **Application** : 8 Use Cases (Create, Update, Stats pour chaque type)
- [ ] **Infrastructure** : Repositories avec analytics avancées
- [ ] **Presentation** : 12 endpoints avec validation complète

### Business Logic
- [ ] **Calculs** : Métriques productivité et WSJF scores exacts
- [ ] **Analytics** : Benchmarks et tendances temps réel
- [ ] **Validation** : Rules métier et contraintes temporelles
- [ ] **Insights** : Génération recommandations automatiques

### Quality & Performance
- [ ] **Tests** : Coverage 100% avec cas métier complexes
- [ ] **Performance** : Analytics < 1s avec données historiques
- [ ] **Cache** : Strategy pour métriques fréquemment consultées
- [ ] **Monitoring** : KPIs business et alertes automatiques

---

## 🔗 Dépendances

**Précédentes :** US02 (Users) - Utilise User entities pour ownership
**Suivantes :** US06 (Dashboard) - Stats utilisées dans tableaux de bord

---

**Priorité :** 🚀 **HIGH** - Mesure performance et aide à la décision