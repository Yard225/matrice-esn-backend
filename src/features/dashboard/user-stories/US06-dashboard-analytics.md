# US06 : Dashboard Analytics & Tableaux de Bord

## 📋 User Story
**En tant qu'utilisateur et manager, je veux accéder à des tableaux de bord personnalisés pour visualiser en temps réel les métriques de performance, les projets en cours et les insights organisationnels.**

**Valeur métier :** Centraliser l'information stratégique, faciliter la prise de décision data-driven et améliorer la visibilité sur les performances individuelles et collectives.

---

## 🎯 Critères d'Acceptation Techniques

### 👤 **DASHBOARD UTILISATEUR**

#### ✅ Scénario 1 : Informations Utilisateur Courant
```gherkin
GIVEN utilisateur "john@esn.com" authentifié avec JWT valide
AND utilisateur a lastLoginAt="2024-01-25T08:30:00Z"
WHEN GET /dashboard/current-user
THEN status=200
AND response contient: {id:"user-123", name:"John Doe", email:"john@esn.com", role:"Senior Developer", avatar:"https://cdn.esn.com/avatars/user-123.jpg", lastLogin:"2024-01-25T08:30:00Z", department:"Engineering", position:"Senior Developer"}
AND données extraites du JWT et enrichies depuis User entity
```

#### ✅ Scénario 2 : Statistiques Dashboard Personnalisées
```gherkin
GIVEN utilisateur "user-123" avec 3 projets actifs, 12 interactions, 4 rapports WSJF
AND données calculées en temps réel
WHEN GET /dashboard/stats
THEN status=200
AND response: {activeProjects:3, totalInteractions:12, wsjfReports:4, completionRate:87.5}
AND completionRate basé sur tâches completed vs total sur 30 derniers jours
AND métriques agrégées depuis rapports, projets, interactions
```

#### ✅ Scénario 3 : Activités Récentes Contextuelles
```gherkin
GIVEN utilisateur avec historique activités variées (rapports, interactions, projets)
WHEN GET /dashboard/recent-activities?limit=10
THEN status=200
AND response tableau ordonné par timestamp DESC
AND chaque activité: {id, title, description, timestamp, type:"report"|"interaction"|"project"}
AND limité aux 10 plus récentes
AND enrichi avec contexte (noms projets, rôles impliqués)
```

#### ✅ Scénario 4 : Projets Utilisateur avec Priorités
```gherkin
GIVEN utilisateur assigné à 5 projets différents statuts et priorités
WHEN GET /dashboard/user-projects
THEN status=200  
AND projets triés par priority DESC puis dueDate ASC
AND chaque projet: {id, name, status:"active"|"completed"|"paused"|"cancelled", progress:75, priority:"high"|"medium"|"low"|"critical", dueDate:"2024-02-15"}
AND progress calculé depuis tâches/milestones internes
```

### 🏢 **DASHBOARD ADMINISTRATEUR**

#### ✅ Scénario 5 : Vue d'Ensemble Organisationnelle
```gherkin
GIVEN administrateur avec accès données globales
AND base contient 150 utilisateurs, 45 rôles actifs, 200+ interactions
WHEN GET /admin/dashboard/overview
THEN status=200
AND response: {totalUsers:150, activeUsers:142, totalRoles:45, totalInteractions:203, recentActivity:[...], systemHealth:{status:"healthy", uptime:99.8, lastBackup:"2024-01-28T02:00:00Z"}}
AND recentActivity limité aux 20 dernières actions admin
AND systemHealth avec métriques infrastructure temps réel
```

#### ✅ Scénario 6 : Analytics Utilisateurs Avancées
```gherkin
GIVEN période "30d" avec données utilisateurs complètes
WHEN GET /admin/dashboard/user-analytics?period=30d
THEN status=200
AND response: {newUsers:12, activeUsers:138, usersByDepartment:{"Engineering":45, "Marketing":25, "HR":15}, activityTrends:[{date:"2024-01-01", count:23}, {date:"2024-01-02", count:31}]}
AND activityTrends avec datapoints quotidiens sur période
AND usersByDepartment avec répartition actuelle
```

#### ✅ Scénario 7 : Analytics Rapports & Performance
```gherkin
GIVEN période "90d" avec historique rapports complet
WHEN GET /admin/dashboard/reports-analytics?period=90d
THEN status=200
AND response: {totalReports:340, submittedOnTime:289, overdueReports:51, averageCompletionRate:84.2, reportsByType:{"hebdo":280, "wsjf":60}, weeklyTrends:[{week:"2024-W01", total:28, onTime:24, overdue:4}]}
AND weeklyTrends agrégé par semaine ISO
AND averageCompletionRate calculé sur toutes tâches période
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Modèles Dashboard

**Dashboard Value Objects**
```typescript
class DashboardStats {
  constructor(
    public readonly activeProjects: number,
    public readonly totalInteractions: number,
    public readonly wsjfReports: number,
    public readonly completionRate: number,
    public readonly calculatedAt: Date
  ) {}

  static create(
    projects: number,
    interactions: number,
    reports: number,
    completionRate: number
  ): DashboardStats {
    // Validation des valeurs (>= 0, completionRate 0-100)
    return new DashboardStats(projects, interactions, reports, completionRate, new Date());
  }

  isHealthy(): boolean {
    return this.completionRate >= 70 && this.activeProjects > 0;
  }

  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    if (this.completionRate >= 85) return 'high';
    if (this.completionRate >= 70) return 'medium';
    return 'low';
  }
}

class ActivitySummary {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly timestamp: Date,
    public readonly type: ActivityType,
    public readonly metadata?: Record<string, any>
  ) {}

  static fromReport(report: HebdoReport): ActivitySummary {
    return new ActivitySummary(
      report.props.id,
      `Rapport hebdomadaire ${report.props.week}`,
      `${report.getTotalTasksCount()} tâches, ${report.getCompletionRate()}% complété`,
      report.props.updatedAt,
      ActivityType.REPORT,
      { week: report.props.week, completionRate: report.getCompletionRate() }
    );
  }

  static fromInteraction(interaction: Interaction): ActivitySummary {
    return new ActivitySummary(
      interaction.props.id,
      `Interaction: ${interaction.props.vue1.title} ↔ ${interaction.props.vue2.title}`,
      `${interaction.props.metadata.category} - ${interaction.props.metadata.priority}`,
      interaction.props.updatedAt,
      ActivityType.INTERACTION,
      { priority: interaction.props.metadata.priority }
    );
  }

  isRecent(hoursThreshold: number = 24): boolean {
    const hoursAgo = (Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60);
    return hoursAgo <= hoursThreshold;
  }
}

enum ActivityType {
  REPORT = 'report',
  INTERACTION = 'interaction', 
  PROJECT = 'project',
  SYSTEM = 'system'
}
```

**Dashboard Analytics Models**
```typescript
class UserAnalytics {
  constructor(
    public readonly newUsers: number,
    public readonly activeUsers: number,
    public readonly usersByDepartment: Record<string, number>,
    public readonly activityTrends: ActivityTrendPoint[],
    public readonly period: TimePeriod,
    public readonly calculatedAt: Date
  ) {}

  getGrowthRate(): number {
    // Calcul taux croissance basé sur période précédente
    if (this.activityTrends.length < 2) return 0;
    
    const latest = this.activityTrends[this.activityTrends.length - 1];
    const previous = this.activityTrends[this.activityTrends.length - 2];
    
    return ((latest.count - previous.count) / previous.count) * 100;
  }

  getMostActivedepartment(): string {
    return Object.entries(this.usersByDepartment)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  getTotalActivityCount(): number {
    return this.activityTrends.reduce((sum, point) => sum + point.count, 0);
  }
}

class ReportsAnalytics {
  constructor(
    public readonly totalReports: number,
    public readonly submittedOnTime: number,
    public readonly overdueReports: number,
    public readonly averageCompletionRate: number,
    public readonly reportsByType: Record<string, number>,
    public readonly weeklyTrends: WeeklyTrendPoint[],
    public readonly period: TimePeriod
  ) {}

  getPunctualityRate(): number {
    return (this.submittedOnTime / this.totalReports) * 100;
  }

  getTrendDirection(): 'improving' | 'declining' | 'stable' {
    if (this.weeklyTrends.length < 3) return 'stable';
    
    const recent = this.weeklyTrends.slice(-3);
    const avgOnTime = recent.reduce((sum, week) => sum + week.onTime, 0) / recent.length;
    const earlier = this.weeklyTrends.slice(-6, -3);
    const avgOnTimeEarlier = earlier.reduce((sum, week) => sum + week.onTime, 0) / earlier.length;
    
    if (avgOnTime > avgOnTimeEarlier * 1.05) return 'improving';
    if (avgOnTime < avgOnTimeEarlier * 0.95) return 'declining';
    return 'stable';
  }

  getPerformanceInsights(): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    if (this.getPunctualityRate() < 80) {
      insights.push({
        type: 'warning',
        message: 'Punctuality rate below target (80%)',
        metric: 'punctuality',
        value: this.getPunctualityRate(),
        suggestion: 'Consider deadline reminders or capacity review'
      });
    }
    
    if (this.averageCompletionRate < 75) {
      insights.push({
        type: 'warning',
        message: 'Average completion rate needs improvement',
        metric: 'completion',
        value: this.averageCompletionRate,
        suggestion: 'Review task estimation and planning practices'
      });
    }
    
    return insights;
  }
}
```

### 📋 Application Layer - Use Cases Dashboard

**GetCurrentUserUseCase**
```typescript
class GetCurrentUserUseCase implements IUseCase<GetCurrentUserRequest, GetCurrentUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(request: GetCurrentUserRequest): Promise<GetCurrentUserResponse> {
    // 1. Extraire userId du JWT token
    // 2. Récupérer User entity complète
    // 3. Enrichir avec données calculées (lastLogin formaté)
    // 4. Transformer vers response model optimisé dashboard
    // 5. Cacher résultat 5min (données changent peu)
    
    const userId = this.jwtService.extractUserId(request.token);
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    
    return {
      id: user.props.id,
      name: user.fullName,
      email: user.props.email.value,
      role: user.props.role,
      avatar: user.props.avatar,
      lastLogin: user.lastLoginAt?.toISOString(),
      department: user.props.department,
      position: user.props.position
    };
  }
}
```

**GetDashboardStatsUseCase**
```typescript
class GetDashboardStatsUseCase implements IUseCase<GetDashboardStatsRequest, GetDashboardStatsResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly interactionRepository: IInteractionRepository,
    private readonly reportRepository: IReportRepository,
    private readonly metricsCalculator: IDashboardMetricsCalculator,
    private readonly cacheService: ICacheService
  ) {}

  async execute(request: GetDashboardStatsRequest): Promise<GetDashboardStatsResponse> {
    const cacheKey = `dashboard:stats:${request.userId}`;
    
    // Vérifier cache (TTL 10 minutes)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;
    
    // Calculer métriques en parallèle pour performance
    const [activeProjects, totalInteractions, wsjfReports, completionRate] = await Promise.all([
      this.projectRepository.countActiveForUser(request.userId),
      this.interactionRepository.countByUserRole(request.userId),
      this.reportRepository.countWSJFReportsForUser(request.userId, { period: '30d' }),
      this.metricsCalculator.calculateUserCompletionRate(request.userId, { period: '30d' })
    ]);
    
    const stats = DashboardStats.create(
      activeProjects,
      totalInteractions,
      wsjfReports,
      completionRate
    );
    
    const response = {
      activeProjects: stats.activeProjects,
      totalInteractions: stats.totalInteractions,
      wsjfReports: stats.wsjfReports,
      completionRate: stats.completionRate,
      performanceLevel: stats.getPerformanceLevel(),
      isHealthy: stats.isHealthy()
    };
    
    // Cacher pour 10 minutes
    await this.cacheService.set(cacheKey, response, 600);
    
    return response;
  }
}
```

**GetRecentActivitiesUseCase**
```typescript
class GetRecentActivitiesUseCase implements IUseCase<GetRecentActivitiesRequest, GetRecentActivitiesResponse> {
  constructor(
    private readonly activityAggregator: IActivityAggregator,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetRecentActivitiesRequest): Promise<GetRecentActivitiesResponse> {
    // 1. Valider limite (max 50, défaut 10)
    // 2. Récupérer activités depuis multiple sources
    // 3. Fusionner et trier par timestamp DESC
    // 4. Enrichir avec contexte (noms, détails)
    // 5. Formater pour affichage dashboard
    
    const limit = Math.min(request.limit || 10, 50);
    
    // Agréger activités depuis toutes sources
    const activities = await this.activityAggregator.getRecentActivitiesForUser(
      request.userId,
      limit * 2 // Récupérer plus pour filtrer/enrichir
    );
    
    // Enrichir avec contexte et limiter
    const enrichedActivities = await Promise.all(
      activities.slice(0, limit).map(activity => this.enrichActivity(activity))
    );
    
    return {
      activities: enrichedActivities
    };
  }

  private async enrichActivity(activity: ActivitySummary): Promise<EnrichedActivity> {
    // Enrichissement selon type activité
    let enrichedContext = {};
    
    switch (activity.type) {
      case ActivityType.INTERACTION:
        const interaction = await this.interactionRepository.findById(activity.id);
        if (interaction) {
          enrichedContext = {
            roles: [interaction.props.vue1.roleId, interaction.props.vue2.roleId],
            category: interaction.props.metadata.category
          };
        }
        break;
        
      case ActivityType.PROJECT:
        const project = await this.projectRepository.findById(activity.id);
        if (project) {
          enrichedContext = {
            progress: project.getProgress(),
            priority: project.getPriority()
          };
        }
        break;
    }
    
    return {
      ...activity,
      enrichedContext
    };
  }
}
```

**GetAdminOverviewUseCase**
```typescript
class GetAdminOverviewUseCase implements IUseCase<GetAdminOverviewRequest, GetAdminOverviewResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly interactionRepository: IInteractionRepository,
    private readonly systemHealthService: ISystemHealthService,
    private readonly adminActivityLogger: IAdminActivityLogger
  ) {}

  async execute(request: GetAdminOverviewRequest): Promise<GetAdminOverviewResponse> {
    // Vérifier permissions admin
    if (!await this.authorizationService.isAdmin(request.requesterId)) {
      throw new UnauthorizedException('Admin access required');
    }
    
    // Calculer métriques organisationnelles en parallèle
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalInteractions,
      recentActivity,
      systemHealth
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countActiveUsers(),
      this.roleRepository.countActiveRoles(),
      this.interactionRepository.count(),
      this.adminActivityLogger.getRecentActivities(20),
      this.systemHealthService.getSystemHealth()
    ]);
    
    return {
      totalUsers,
      activeUsers,
      totalRoles,
      totalInteractions,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp,
        userId: activity.userId,
        details: activity.details
      })),
      systemHealth: {
        status: systemHealth.status,
        uptime: systemHealth.uptime,
        lastBackup: systemHealth.lastBackup,
        services: systemHealth.services
      }
    };
  }
}
```

### 🔧 Infrastructure Layer - Services Spécialisés

**IActivityAggregator - Agrégation Multi-Sources**
```typescript
interface IActivityAggregator {
  getRecentActivitiesForUser(userId: string, limit: number): Promise<ActivitySummary[]>
  getSystemWideRecentActivities(limit: number): Promise<ActivitySummary[]>
  getActivitiesByType(userId: string, type: ActivityType, limit: number): Promise<ActivitySummary[]>
  getActivitiesInDateRange(userId: string, from: Date, to: Date): Promise<ActivitySummary[]>
}

// Implémentation concrète
class ActivityAggregatorService implements IActivityAggregator {
  constructor(
    private readonly reportRepository: IHebdoReportRepository,
    private readonly interactionRepository: IInteractionRepository,
    private readonly projectRepository: IProjectRepository,
    private readonly systemAuditRepository: ISystemAuditRepository
  ) {}

  async getRecentActivitiesForUser(userId: string, limit: number): Promise<ActivitySummary[]> {
    // 1. Récupérer activités depuis toutes sources en parallèle
    const [reportActivities, interactionActivities, projectActivities] = await Promise.all([
      this.getReportActivities(userId, limit),
      this.getInteractionActivities(userId, limit),
      this.getProjectActivities(userId, limit)
    ]);
    
    // 2. Fusionner et trier par timestamp
    const allActivities = [
      ...reportActivities,
      ...interactionActivities,
      ...projectActivities
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // 3. Limiter résultats
    return allActivities.slice(0, limit);
  }

  private async getReportActivities(userId: string, limit: number): Promise<ActivitySummary[]> {
    const recentReports = await this.reportRepository.findRecentByUser(userId, limit);
    return recentReports.map(report => ActivitySummary.fromReport(report));
  }

  private async getInteractionActivities(userId: string, limit: number): Promise<ActivitySummary[]> {
    // Récupérer interactions où user est impliqué via son rôle
    const userRole = await this.getUserRole(userId);
    const recentInteractions = await this.interactionRepository.findRecentByRole(userRole, limit);
    return recentInteractions.map(interaction => ActivitySummary.fromInteraction(interaction));
  }
}
```

**IDashboardMetricsCalculator - Calculs Complexes**
```typescript
interface IDashboardMetricsCalculator {
  calculateUserCompletionRate(userId: string, options: MetricsOptions): Promise<number>
  calculateProductivityScore(userId: string, options: MetricsOptions): Promise<number>
  calculateEfficiencyTrend(userId: string, periods: number): Promise<TrendPoint[]>
  calculateTeamBenchmark(userId: string, teamId: string): Promise<BenchmarkResult>
}

class DashboardMetricsCalculatorService implements IDashboardMetricsCalculator {
  async calculateUserCompletionRate(userId: string, options: MetricsOptions): Promise<number> {
    const dateRange = this.getDateRange(options.period);
    
    // Récupérer tous rapports période
    const reports = await this.reportRepository.findByUserAndDateRange(
      userId, 
      dateRange.start, 
      dateRange.end
    );
    
    if (reports.length === 0) return 0;
    
    // Calculer taux completion global
    const totalTasks = reports.reduce((sum, report) => sum + report.getTotalTasksCount(), 0);
    const completedTasks = reports.reduce((sum, report) => sum + report.getCompletedTasksCount(), 0);
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  async calculateProductivityScore(userId: string, options: MetricsOptions): Promise<number> {
    // Score composite basé sur:
    // - Taux completion (40%)
    // - Précision estimations (30%)
    // - Respect deadlines (20%)  
    // - Qualité livrables (10%)
    
    const [completionRate, estimationAccuracy, deadlineRespect, qualityScore] = await Promise.all([
      this.calculateUserCompletionRate(userId, options),
      this.calculateEstimationAccuracy(userId, options),
      this.calculateDeadlineRespectRate(userId, options),
      this.calculateQualityScore(userId, options)
    ]);
    
    return (
      completionRate * 0.4 +
      estimationAccuracy * 0.3 +
      deadlineRespect * 0.2 +
      qualityScore * 0.1
    );
  }
}
```

**ICacheService - Cache Intelligent**
```typescript
interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  invalidate(pattern: string): Promise<void>
  getMulti<T>(keys: string[]): Promise<Record<string, T>>
  setMulti<T>(entries: Record<string, T>, ttlSeconds: number): Promise<void>
}

// Stratégie cache pour dashboard
class DashboardCacheStrategy {
  private readonly TTL = {
    USER_STATS: 600,        // 10 minutes
    CURRENT_USER: 300,      // 5 minutes  
    RECENT_ACTIVITIES: 120, // 2 minutes
    ADMIN_OVERVIEW: 300,    // 5 minutes
    SYSTEM_HEALTH: 60       // 1 minute
  };

  async getCachedStats(userId: string): Promise<DashboardStats | null> {
    return this.cacheService.get(`dashboard:stats:${userId}`);
  }

  async cacheStats(userId: string, stats: DashboardStats): Promise<void> {
    await this.cacheService.set(`dashboard:stats:${userId}`, stats, this.TTL.USER_STATS);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheService.invalidate(`dashboard:*:${userId}`);
  }
}
```

### 🎮 Presentation Layer - Endpoints Optimisés

**GET /dashboard/current-user - Profil utilisateur enrichi**
```http
GET /dashboard/current-user
Authorization: Bearer {jwt_token}

Response 200:
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@esn.com", 
  "role": "Senior Developer",
  "avatar": "https://cdn.esn.com/avatars/user-123.jpg",
  "lastLogin": "2024-01-28T08:30:00Z",
  "department": "Engineering",
  "position": "Senior Developer",
  "preferences": {
    "theme": "dark",
    "language": "fr",
    "timezone": "Europe/Paris"
  },
  "quickStats": {
    "thisWeekTasks": 5,
    "completedTasks": 4,
    "upcomingDeadlines": 2
  }
}
```

**GET /dashboard/stats - Métriques temps réel**
```http
GET /dashboard/stats
Authorization: Bearer {jwt_token}

Response 200:
{
  "activeProjects": 3,
  "totalInteractions": 12,
  "wsjfReports": 4,
  "completionRate": 87.5,
  "performanceLevel": "high",
  "isHealthy": true,
  "trends": {
    "completionRateTrend": "improving",
    "productivityTrend": "stable",
    "weekOverWeekChange": 5.2
  },
  "insights": [
    {
      "type": "achievement",
      "message": "Completion rate above team average",
      "metric": "completionRate",
      "impact": "positive"
    }
  ],
  "calculatedAt": "2024-01-28T10:30:00Z",
  "nextRefresh": "2024-01-28T10:40:00Z"
}
```

**GET /dashboard/recent-activities - Activités enrichies**
```http
GET /dashboard/recent-activities?limit=10
Authorization: Bearer {jwt_token}

Response 200:
{
  "activities": [
    {
      "id": "hebdo-789",
      "title": "Rapport hebdomadaire 2024-W04",
      "description": "8 tâches, 92% complété",
      "timestamp": "2024-01-28T09:15:00Z",
      "type": "report",
      "enrichedContext": {
        "completionRate": 92,
        "totalTasks": 8,
        "weekNumber": "2024-W04"
      },
      "actionUrl": "/reports/hebdo/hebdo-789",
      "priority": "medium"
    },
    {
      "id": "interaction-456", 
      "title": "Interaction: Développement React ↔ Design System",
      "description": "interne - high priority",
      "timestamp": "2024-01-27T16:45:00Z",
      "type": "interaction",
      "enrichedContext": {
        "roles": ["role-frontend", "role-designer"],
        "category": "interne",
        "priority": "high"
      },
      "actionUrl": "/interactions/interaction-456"
    }
  ],
  "hasMore": true,
  "nextOffset": 10,
  "totalCount": 45
}
```

**GET /admin/dashboard/overview - Vue admin complète**
```http
GET /admin/dashboard/overview
Authorization: Bearer {admin_jwt}

Response 200:
{
  "organizationMetrics": {
    "totalUsers": 150,
    "activeUsers": 142,
    "newUsersThisMonth": 8,
    "totalRoles": 45,
    "activeRoles": 42,
    "totalInteractions": 203,
    "activeInteractions": 187
  },
  "systemHealth": {
    "status": "healthy",
    "uptime": 99.8,
    "lastBackup": "2024-01-28T02:00:00Z",
    "services": {
      "database": "up",
      "redis": "up", 
      "fileStorage": "up",
      "emailService": "up"
    },
    "metrics": {
      "responseTime": 145,
      "memoryUsage": 68.5,
      "cpuUsage": 23.1
    }
  },
  "recentActivity": [
    {
      "id": "audit-123",
      "action": "user_created",
      "timestamp": "2024-01-28T09:30:00Z",
      "userId": "admin-456",
      "targetUserId": "user-789",
      "details": "Created user: jane.smith@esn.com"
    }
  ],
  "alerts": [
    {
      "id": "alert-789",
      "type": "warning",
      "message": "5 users have overdue reports",
      "severity": "medium",
      "actionable": true,
      "actionUrl": "/admin/reports/overdue"
    }
  ],
  "quickActions": [
    {"label": "Create User", "url": "/admin/users/new"},
    {"label": "System Backup", "url": "/admin/system/backup"},
    {"label": "Export Reports", "url": "/admin/export"}
  ]
}
```

---

## 🔐 Sécurité & Autorisations Dashboard

### Permissions Granulaires
```typescript
const DashboardPermissions = {
  // Dashboard utilisateur
  VIEW_OWN_DASHBOARD: ['admin', 'manager', 'user'],
  VIEW_OWN_STATS: ['admin', 'manager', 'user'],
  VIEW_OWN_ACTIVITIES: ['admin', 'manager', 'user'],
  VIEW_OWN_PROJECTS: ['admin', 'manager', 'user'],
  
  // Dashboard équipe (managers)
  VIEW_TEAM_DASHBOARD: ['admin', 'manager'],
  VIEW_TEAM_STATS: ['admin', 'manager'],
  VIEW_TEAM_ACTIVITIES: ['admin', 'manager'],
  
  // Dashboard admin
  VIEW_ADMIN_OVERVIEW: ['admin'],
  VIEW_SYSTEM_HEALTH: ['admin'],
  VIEW_USER_ANALYTICS: ['admin', 'hr'],
  VIEW_REPORTS_ANALYTICS: ['admin', 'manager'],
  MANAGE_SYSTEM_ALERTS: ['admin']
}
```

### Filtrage Données Sensibles
```typescript
const DataVisibility = {
  user: {
    ownData: 'full',           // Ses propres données complètes
    teamData: 'limited',       // Données équipe limitées
    orgData: 'none'            // Pas de données org
  },
  manager: {
    ownData: 'full',
    teamData: 'full',          // Données équipe complètes  
    orgData: 'department_scoped' // Données département
  },
  admin: {
    ownData: 'full',
    teamData: 'full', 
    orgData: 'full'            // Toutes données org
  }
}
```

---

## 📊 Performance & Optimisations

### Cache Strategy Multi-Niveaux
```typescript
const CacheStrategy = {
  // Cache application (Redis)
  userStats: { ttl: '10m', refresh: 'background' },
  recentActivities: { ttl: '2m', refresh: 'realtime' },
  adminOverview: { ttl: '5m', refresh: 'scheduled' },
  
  // Cache base de données (query cache)
  aggregationQueries: { ttl: '1h', refresh: 'invalidation' },
  countQueries: { ttl: '30m', refresh: 'scheduled' },
  
  // Cache CDN (assets)
  staticData: { ttl: '24h', refresh: 'versioned' }
}
```

### Optimisations Requêtes
```sql
-- Index pour performance dashboard
CREATE INDEX CONCURRENTLY idx_reports_user_date ON hebdo_reports(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_interactions_roles ON interactions USING GIN((vue1_role_id || ',' || vue2_role_id));
CREATE INDEX CONCURRENTLY idx_projects_user_status ON projects(user_id, status, updated_at DESC);

-- Vues matérialisées pour analytics
CREATE MATERIALIZED VIEW mv_user_stats AS
SELECT 
  user_id,
  COUNT(*) as total_reports,
  AVG(completion_rate) as avg_completion_rate,
  DATE_TRUNC('week', created_at) as week
FROM hebdo_reports
GROUP BY user_id, DATE_TRUNC('week', created_at);

-- Refresh programmé toutes les heures
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Tests Performance & Load

### Tests Charge Dashboard
```typescript
describe('Dashboard Performance', () => {
  it('should handle 100 concurrent dashboard requests < 500ms p95', async () => {
    const requests = Array(100).fill(null).map(() => 
      request(app).get('/dashboard/stats').set('Authorization', `Bearer ${validJWT}`)
    );
    
    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;
    
    expect(responses.every(res => res.status === 200)).toBe(true);
    expect(duration).toBeLessThan(5000); // 5s pour 100 requêtes
  });

  it('should maintain cache hit rate > 80% for user stats', async () => {
    // Test avec métriques cache
    const cacheMetrics = await cacheService.getMetrics();
    expect(cacheMetrics.hitRate).toBeGreaterThan(0.8);
  });
})
```

### Tests Stress Admin Dashboard
```typescript
describe('Admin Dashboard Scale', () => {
  it('should handle admin overview with 10000+ users < 2s', async () => {
    await seedDatabase({ users: 10000, interactions: 50000, reports: 20000 });
    
    const start = Date.now();
    const response = await request(app)
      .get('/admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminJWT}`);
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });
})
```

---

## 🎯 Performance Requirements Critiques

- **GET /dashboard/current-user** : p95 < 100ms (cached)
- **GET /dashboard/stats** : p95 < 300ms (calculs temps réel)
- **GET /dashboard/recent-activities** : p95 < 200ms
- **GET /admin/dashboard/overview** : p95 < 1s avec 10,000+ users
- **Cache hit rate** : > 80% pour données fréquemment consultées
- **Real-time updates** : < 2s pour changements critiques

### Monitoring Performance
```typescript
const PerformanceMetrics = {
  responseTime: {
    dashboard: 'p95 < 300ms',
    adminOverview: 'p95 < 1s',
    activities: 'p95 < 200ms'
  },
  cache: {
    hitRate: '> 80%',
    missLatency: '< 50ms',
    invalidationTime: '< 100ms'
  },
  database: {
    queryTime: 'p95 < 100ms',
    connectionPool: '< 80% usage',
    indexUsage: '> 95%'
  }
}
```

---

## ✅ Definition of Done

### Development
- [ ] **Application** : 6 Use Cases (CurrentUser, Stats, Activities, Projects, AdminOverview, Analytics)
- [ ] **Infrastructure** : Services aggregation + cache + metrics calculator
- [ ] **Presentation** : 8 endpoints avec optimisations performance
- [ ] **Cache** : Strategy multi-niveaux avec invalidation intelligente

### Performance & Scale
- [ ] **Response Times** : Tous endpoints < targets avec charge
- [ ] **Cache Strategy** : Hit rate > 80% avec TTL appropriés
- [ ] **Database** : Index optimisés + vues matérialisées
- [ ] **Real-time** : Updates < 2s pour changements critiques

### Security & Quality
- [ ] **Permissions** : Filtrage données selon rôle utilisateur
- [ ] **Tests** : Load tests avec 1000+ users concurrent
- [ ] **Monitoring** : Métriques performance temps réel
- [ ] **Documentation** : Guide optimisation performance

---

## 🔗 Dépendances

**Précédentes :** US02 (Users), US04 (Interactions), US05 (Reports) - Agrège données
**Suivantes :** Monitoring & Analytics avancées

---

**Priorité :** 🚀 **HIGH** - Interface principale utilisateur, performance critique