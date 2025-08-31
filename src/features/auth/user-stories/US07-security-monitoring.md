# US07 : Monitoring et Détection de Sécurité

## 📋 User Story
**En tant que système de sécurité, je veux surveiller en temps réel toutes les activités d'authentification et détecter automatiquement les comportements suspects pour protéger proactivement l'infrastructure et les utilisateurs.**

**Valeur métier :** Détection précoce des menaces, réduction des risques sécuritaires, et conformité aux standards de sécurité d'entreprise.

---

## 🎯 Critères d'Acceptation Techniques

### 🔍 Scénario 1 : Détection Anomalies Géographiques
```gherkin
GIVEN utilisateur "john@esn.com" connecté habituellement depuis Paris
AND historique de connexions des 30 derniers jours analysé
WHEN tentative de connexion depuis Tokyo dans les 2h suivant Paris
THEN anomalie géographique détectée avec score=0.85
AND alerte générée pour équipe sécurité
AND utilisateur notifié par email de connexion suspecte
AND connexion autorisée mais avec validation 2FA renforcée
```

### 🕒 Scénario 2 : Détection Anomalies Temporelles  
```gherkin
GIVEN utilisateur avec pattern habituel 09h-18h en semaine
AND 6 mois d'historique analysé par ML
WHEN tentative connexion 03h30 un dimanche
THEN anomalie temporelle détectée avec score=0.72
AND connexion challengée avec question sécurité
AND log enrichi avec contexte comportemental
```

### 🤖 Scénario 3 : Détection de Bots/Automatisation
```gherkin
GIVEN série de tentatives avec timing parfaitement régulier (toutes les 500ms)
AND User-Agent suspect/inhabituel
AND pas de JavaScript fingerprint valide
WHEN analyse des patterns de requêtes
THEN bot/automatisation détecté avec confiance=0.92
AND blocage immédiat de l'IP source
AND escalade vers système anti-DDoS
```

### 📊 Scénario 4 : Corrélation Multi-Événements
```gherkin
GIVEN événements simultanés:
  - 15 connexions échouées sur comptes admin en 5 minutes
  - Nouvelles IPs jamais vues (5 différentes)  
  - User-Agents identiques suspicieux
  - Pattern timing automatisé
WHEN moteur de corrélation analyse les événements
THEN attaque coordonnée détectée avec confiance=0.94
AND procédure d'urgence automatiquement déclenchée
AND lockdown préventif des comptes admin
AND notification immédiate CISO + équipe sécurité
```

### 🎯 Scénario 5 : Détection Credential Stuffing
```gherkin
GIVEN base de données de emails compromis (HaveIBeenPwned)
AND tentatives de connexion avec combinaisons email/password communes
WHEN 100+ tentatives sur différents comptes avec mêmes patterns
THEN credential stuffing détecté
AND blocage automatique des IPs sources
AND alertes pour comptes potentiellement compromis
AND recommandations de changement de mot de passe envoyées
```

---

## 🏗️ Spécifications Techniques par Couche

### 🎯 Domain Layer - Modélisation des Menaces

**Entités de Sécurité**
```typescript
class SecurityEvent {
  constructor(
    public readonly id: string,
    public readonly type: SecurityEventType,
    public readonly userId?: string,
    public readonly ip: string,
    public readonly userAgent: string,
    public readonly timestamp: Date,
    public readonly metadata: SecurityEventMetadata,
    public readonly severity: SecuritySeverity
  ) {}

  calculateThreatScore(): number
  correlateWith(other: SecurityEvent): CorrelationResult
}

enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED', 
  GEOGRAPHIC_ANOMALY = 'GEOGRAPHIC_ANOMALY',
  TEMPORAL_ANOMALY = 'TEMPORAL_ANOMALY',
  BOT_DETECTED = 'BOT_DETECTED',
  MULTIPLE_FAILED_ATTEMPTS = 'MULTIPLE_FAILED_ATTEMPTS',
  NEW_DEVICE_LOGIN = 'NEW_DEVICE_LOGIN',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
  DISTRIBUTED_ATTACK = 'DISTRIBUTED_ATTACK'
}

enum SecuritySeverity {
  INFO = 0,
  LOW = 1,
  MEDIUM = 2, 
  HIGH = 3,
  CRITICAL = 4
}

interface SecurityEventMetadata {
  geolocation?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  device?: {
    fingerprint: string;
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  network?: {
    isp: string;
    tor: boolean;
    vpn: boolean;
    datacenter: boolean;
  };
  behavioral?: {
    typingSpeed: number;
    mouseMovements: number;
    clickPatterns: number[];
  };
}
```

**Service Domain : ThreatDetectionService**
```typescript
class ThreatDetectionService {
  constructor(
    private readonly eventRepository: ISecurityEventRepository,
    private readonly mlService: IMLDetectionService,
    private readonly geoService: IGeoLocationService,
    private readonly threatIntelService: IThreatIntelligenceService
  ) {}

  async analyzeEvent(event: SecurityEvent): Promise<ThreatAnalysis> {
    // Analyse multi-dimensionnelle des menaces
    const geoAnalysis = await this.analyzeGeographicAnomaly(event);
    const temporalAnalysis = await this.analyzeTemporalAnomaly(event);
    const behavioralAnalysis = await this.analyzeBehavioralAnomaly(event);
    const threatIntelAnalysis = await this.checkThreatIntelligence(event);
    
    return this.synthesizeAnalysis([
      geoAnalysis, 
      temporalAnalysis, 
      behavioralAnalysis, 
      threatIntelAnalysis
    ]);
  }

  async detectCoordinatedAttack(events: SecurityEvent[]): Promise<AttackPattern | null> {
    // Détection d'attaques coordonnées
    return this.mlService.detectPatterns(events, {
      timeWindow: '5m',
      minimumEvents: 10,
      confidenceThreshold: 0.8
    });
  }
}

interface ThreatAnalysis {
  threatScore: number;        // 0-1 score de menace
  confidence: number;         // 0-1 confiance dans l'analyse
  anomalies: AnomalyType[];   // Types d'anomalies détectées
  recommendations: SecurityAction[];  // Actions recommandées
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

enum AnomalyType {
  GEOGRAPHIC = 'GEOGRAPHIC',
  TEMPORAL = 'TEMPORAL', 
  BEHAVIORAL = 'BEHAVIORAL',
  DEVICE = 'DEVICE',
  NETWORK = 'NETWORK'
}

enum SecurityAction {
  ALLOW = 'ALLOW',
  CHALLENGE = 'CHALLENGE',        // 2FA/questions sécurité
  BLOCK_TEMPORARY = 'BLOCK_TEMPORARY',
  BLOCK_PERMANENT = 'BLOCK_PERMANENT', 
  ESCALATE = 'ESCALATE',          // Escalade humaine
  EMERGENCY_LOCKDOWN = 'EMERGENCY_LOCKDOWN'
}
```

### 📋 Application Layer - Orchestration Sécurité

**Use Case : AnalyzeSecurityEventUseCase**
```typescript
class AnalyzeSecurityEventUseCase implements IUseCase<AnalyzeSecurityEventRequest, AnalyzeSecurityEventResponse> {
  constructor(
    private readonly threatDetectionService: ThreatDetectionService,
    private readonly correlationEngine: ICorrelationEngine,
    private readonly alertService: IAlertService,
    private readonly responseService: ISecurityResponseService
  ) {}

  async execute(request: AnalyzeSecurityEventRequest): Promise<AnalyzeSecurityEventResponse>
}

type AnalyzeSecurityEventRequest = {
  eventType: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp?: Date;
  metadata?: SecurityEventMetadata;
  context?: {
    loginAttempt?: {
      email: string;
      success: boolean;
      previousAttempts: number;
    };
    sessionInfo?: {
      deviceFingerprint: string;
      isNewDevice: boolean;
    };
  };
}

type AnalyzeSecurityEventResponse = {
  eventId: string;
  analysis: ThreatAnalysis;
  actionsTaken: SecurityAction[];
  alertsTriggered: string[];       // IDs des alertes générées
  correlatedEvents: string[];      // IDs événements corrélés
  followUpRequired: boolean;
  investigationTicket?: string;    // Ticket d'investigation créé
}
```

**Use Case : MonitorSecurityTrendsUseCase**
```typescript
class MonitorSecurityTrendsUseCase implements IUseCase<MonitorTrendsRequest, MonitorTrendsResponse> {
  constructor(
    private readonly eventRepository: ISecurityEventRepository,
    private readonly trendAnalysisService: ITrendAnalysisService,
    private readonly dashboardService: IDashboardService
  ) {}

  // Analyse des tendances sécuritaires en temps réel
  async execute(request: MonitorTrendsRequest): Promise<MonitorTrendsResponse>
}

interface SecurityTrend {
  metric: string;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'ANOMALOUS';
  changePercentage: number;
  timeWindow: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations?: string[];
}
```

### 🔧 Infrastructure Layer - Services Techniques

**Machine Learning Service**
```typescript
interface IMLDetectionService {
  trainBehavioralModel(userId: string, events: SecurityEvent[]): Promise<BehavioralModel>
  detectBehavioralAnomaly(event: SecurityEvent, model: BehavioralModel): Promise<AnomalyScore>
  detectBotBehavior(events: SecurityEvent[]): Promise<BotDetectionResult>
  clusterSimilarAttacks(events: SecurityEvent[]): Promise<AttackCluster[]>
}

class TensorFlowDetectionService implements IMLDetectionService {
  // Modèle de détection d'anomalies comportementales
  private behavioralModel: tf.LayersModel;
  
  async detectBehavioralAnomaly(event: SecurityEvent, model: BehavioralModel): Promise<AnomalyScore> {
    // Feature extraction
    const features = this.extractFeatures(event);
    
    // Normalisation
    const normalizedFeatures = this.normalize(features);
    
    // Prédiction
    const prediction = this.behavioralModel.predict(normalizedFeatures) as tf.Tensor;
    
    // Score d'anomalie (0 = normal, 1 = très suspect)
    const anomalyScore = await prediction.data();
    
    return {
      score: anomalyScore[0],
      confidence: this.calculateConfidence(features, model),
      factors: this.identifyAnomalousFactors(features, model)
    };
  }
}
```

**Correlation Engine**
```typescript
interface ICorrelationEngine {
  correlateEvents(events: SecurityEvent[], timeWindow: string): Promise<CorrelationResult[]>
  identifyAttackChains(events: SecurityEvent[]): Promise<AttackChain[]>
  detectCampaigns(events: SecurityEvent[], minSimilarity: number): Promise<ThreatCampaign[]>
}

class DroolsCorrelationEngine implements ICorrelationEngine {
  // Rules-based correlation using Drools-like engine
  
  async correlateEvents(events: SecurityEvent[], timeWindow: string): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];
    
    // Rule 1: Multiple failed logins + Geographic anomaly = Credential stuffing
    const failedLogins = events.filter(e => e.type === SecurityEventType.LOGIN_FAILED);
    const geoAnomalies = events.filter(e => e.type === SecurityEventType.GEOGRAPHIC_ANOMALY);
    
    if (failedLogins.length > 10 && geoAnomalies.length > 0) {
      correlations.push({
        pattern: 'CREDENTIAL_STUFFING_WITH_GEO_ANOMALY',
        confidence: 0.85,
        events: [...failedLogins, ...geoAnomalies],
        recommendation: SecurityAction.BLOCK_TEMPORARY
      });
    }
    
    // Rule 2: Bot detection + Multiple IPs = Distributed attack
    const botEvents = events.filter(e => e.type === SecurityEventType.BOT_DETECTED);
    const uniqueIPs = new Set(events.map(e => e.ip));
    
    if (botEvents.length > 5 && uniqueIPs.size > 10) {
      correlations.push({
        pattern: 'DISTRIBUTED_BOT_ATTACK',
        confidence: 0.92,
        events: botEvents,
        recommendation: SecurityAction.EMERGENCY_LOCKDOWN
      });
    }
    
    return correlations;
  }
}
```

**Threat Intelligence Service**
```typescript
interface IThreatIntelligenceService {
  checkIPReputation(ip: string): Promise<IPReputationResult>
  checkDomainReputation(domain: string): Promise<DomainReputationResult>  
  getKnownAttackPatterns(): Promise<AttackPattern[]>
  checkCompromisedCredentials(email: string): Promise<boolean>
}

class ThreatIntelligenceService implements IThreatIntelligenceService {
  constructor(
    private readonly abuseIPDB: AbuseIPDBClient,
    private readonly virusTotal: VirusTotalClient,
    private readonly haveibeenpwned: HIBPClient
  ) {}

  async checkIPReputation(ip: string): Promise<IPReputationResult> {
    const [abuseResult, vtResult] = await Promise.all([
      this.abuseIPDB.checkIP(ip),
      this.virusTotal.checkIP(ip)
    ]);
    
    return {
      ip,
      isMalicious: abuseResult.abuseConfidence > 75 || vtResult.malicious > 0,
      riskScore: Math.max(abuseResult.abuseConfidence / 100, vtResult.malicious / vtResult.total),
      sources: ['AbuseIPDB', 'VirusTotal'],
      details: {
        abuseConfidence: abuseResult.abuseConfidence,
        vtMalicious: vtResult.malicious,
        country: abuseResult.countryCode,
        isp: abuseResult.isp
      }
    };
  }
}
```

### 🎮 Presentation Layer - Dashboards & API

**Security Dashboard Controller**
```typescript
@Controller('security')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('SECURITY_ADMIN', 'CISO')
export class SecurityDashboardController {
  
  @Get('events/realtime')
  @Sse()
  securityEventsStream(): Observable<MessageEvent> {
    return this.securityEventStream.pipe(
      map(event => ({ 
        data: event,
        type: 'security-event',
        retry: 1000 
      }))
    );
  }
  
  @Get('threats/summary')
  async getThreatSummary(
    @Query() query: ThreatSummaryQuery
  ): Promise<ThreatSummaryResponse> {
    return this.monitorSecurityTrendsUseCase.execute({
      timeWindow: query.timeWindow || '24h',
      aggregationLevel: query.aggregation || 'hourly'
    });
  }
  
  @Get('incidents/:id')
  async getIncidentDetails(
    @Param('id') incidentId: string
  ): Promise<SecurityIncidentDetails> {
    return this.getSecurityIncidentUseCase.execute({ incidentId });
  }
  
  @Post('incidents/:id/respond')
  async respondToIncident(
    @Param('id') incidentId: string,
    @Body() response: SecurityResponseDto,
    @CurrentUser() admin: UserContext
  ): Promise<void> {
    await this.respondToIncidentUseCase.execute({
      incidentId,
      response: response.action,
      adminId: admin.id,
      notes: response.notes
    });
  }
}
```

---

## 📊 Analytics & Reporting

### Métriques de Sécurité Temps Réel
```typescript
const SecurityMetrics = {
  // Compteurs d'événements
  'security.events.total': { 
    labels: ['type', 'severity', 'source'],
    description: 'Total des événements de sécurité'
  },
  
  // Scores de menace
  'security.threat_score.histogram': {
    buckets: [0.1, 0.3, 0.5, 0.7, 0.9],
    description: 'Distribution des scores de menace'
  },
  
  // Temps de réponse
  'security.analysis.duration.histogram': {
    buckets: [10, 50, 100, 500, 1000],
    description: 'Temps d\'analyse des événements (ms)'
  },
  
  // Anomalies détectées
  'security.anomalies.gauge': {
    labels: ['type', 'user'],
    description: 'Anomalies actives par type'
  }
};
```

### Rapports Automatisés
```typescript
interface SecurityReport {
  period: string;
  summary: {
    totalEvents: number;
    threatsDetected: number;
    incidentsCreated: number;
    falsePositives: number;
  };
  topThreats: ThreatSummary[];
  trendAnalysis: SecurityTrend[];
  recommendations: string[];
  attachments: {
    detailedLog: string;      // Fichier CSV des événements
    visualizations: string[]; // Graphiques PNG/PDF
  };
}

// Rapport quotidien automatique
@Cron('0 8 * * *')  // Tous les jours à 8h
async generateDailySecurityReport(): Promise<void> {
  const report = await this.generateSecurityReportUseCase.execute({
    period: 'last_24h',
    format: 'PDF',
    recipients: ['security-team@esn.com', 'ciso@esn.com']
  });
  
  await this.emailService.sendReport(report);
}
```

---

## 🚨 Système d'Alertes Multi-canal

### Configuration des Alertes
```typescript
interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: SecuritySeverity;
  channels: AlertChannel[];
  throttling: {
    maxAlerts: number;
    timeWindow: string;
  };
  escalation: EscalationRule[];
}

interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '!=' | 'contains';
  threshold: number | string;
  timeWindow?: string;
  groupBy?: string[];
}

enum AlertChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK', 
  SMS = 'SMS',
  PAGERDUTY = 'PAGERDUTY',
  WEBHOOK = 'WEBHOOK'
}

// Exemples de règles d'alerte
const AlertRules: AlertRule[] = [
  {
    id: 'high-threat-score',
    name: 'Score de menace élevé détecté',
    condition: {
      metric: 'security.threat_score',
      operator: '>',
      threshold: 0.8,
      timeWindow: '5m'
    },
    severity: SecuritySeverity.HIGH,
    channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
    throttling: { maxAlerts: 5, timeWindow: '1h' },
    escalation: [
      { delay: '15m', channels: [AlertChannel.SMS] },
      { delay: '1h', channels: [AlertChannel.PAGERDUTY] }
    ]
  }
];
```

---

## 🧪 Tests de Sécurité

### Tests de Détection (Red Team)
```typescript
describe('Threat Detection Validation', () => {
  describe('Geographic Anomaly Detection', () => {
    it('should detect impossible travel (Paris -> Tokyo in 1h)')
    it('should ignore legitimate travel with reasonable timing')
    it('should consider VPN usage in detection logic')
  })
  
  describe('Behavioral Analysis', () => {
    it('should detect bot-like typing patterns')
    it('should identify unusual navigation patterns')
    it('should recognize credential stuffing attempts')
  })
  
  describe('ML Model Accuracy', () => {
    it('should maintain > 95% accuracy on known threats')
    it('should keep false positives < 2%') 
    it('should adapt to new attack patterns within 24h')
  })
})
```

### Tests de Performance
```typescript
describe('Security Monitoring Performance', () => {
  it('should analyze 10,000 events/second without lag')
  it('should correlate events within 100ms p95')
  it('should scale horizontally across multiple instances')
  it('should gracefully handle ML service downtime')
})
```

---

## 🎯 KPIs & Objectifs

### Objectifs de Performance
- **Détection Accuracy** : > 95% (vrais positifs)
- **False Positive Rate** : < 2%
- **Time to Detection** : < 30 secondes pour menaces critiques
- **Time to Response** : < 5 minutes pour incidents automatisés

### SLAs de Sécurité
```typescript
const SecuritySLAs = {
  threatDetection: {
    availability: '99.9%',
    latency: 'p95 < 100ms',
    accuracy: '> 95%'
  },
  incidentResponse: {
    criticalIncidents: '< 15 minutes',
    highIncidents: '< 1 hour',
    mediumIncidents: '< 4 hours'
  },
  falsePositiveReduction: {
    target: '< 2% monthly',
    improvement: '10% reduction quarterly'
  }
};
```

---

## ✅ Definition of Done

### Development
- [ ] **Domain** : Modèles ThreatDetection + SecurityEvent complets
- [ ] **Application** : Use cases analyse + monitoring avec ML
- [ ] **Infrastructure** : Services ML + correlation + threat intel
- [ ] **Presentation** : Dashboards sécurité + API admin

### Security Operations
- [ ] **Threat detection** : ML models entraînés et validés  
- [ ] **Correlation engine** : Règles de corrélation configurées
- [ ] **Alert system** : Multi-canal avec escalation
- [ ] **Incident response** : Procédures automatisées

### Monitoring & Analytics  
- [ ] **Dashboards** : Grafana sécurité opérationnel
- [ ] **Reports** : Génération automatique quotidienne/hebdo
- [ ] **Metrics** : KPIs sécurité collectés et visualisés  
- [ ] **Alerting** : Seuils configurés et testés

---

## 🔗 Dépendances

**Précédentes :** US06 (Rate Limiting) - Événements de sécurité
**Suivantes :** Intégration SIEM/SOC externe (hors scope)

---

**Priorité :** 🔶 **MEDIUM** - Essentiel pour sécurité mature mais pas MVP