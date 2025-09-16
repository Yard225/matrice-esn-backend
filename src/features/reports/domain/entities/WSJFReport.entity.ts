import { BaseEntity } from '@/core/base/entities/Base.entity';

type WSJFTask = {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  businessValue?: number;
  timeCriticality?: number;
  riskReduction?: number;
  jobSize?: number;
  wsjfScore?: number;
  completed: boolean;
};

type WSJFReportProps = {
  id: string;
  userId: string;
  title: string;
  week: string;
  tasks?: WSJFTask[];
  notes?: string;
  status: 'draft' | 'submitted' | 'overdue';
  submittedAt?: Date;
};

export class WSJFReport extends BaseEntity {
  constructor(public props: WSJFReportProps) {
    super(props.id);
  }

  public addTask(task: Omit<WSJFTask, 'id' | 'completed' | 'wsjfScore'>): void {
    // TODO: Generate unique task ID
    // TODO: Validate task data
    // TODO: Calculate WSJF score
    // TODO: Create task with default completed = false
    // TODO: Add to tasks array
    // TODO: Set updated timestamp
    if (!this.props.tasks) {
      this.props.tasks = [];
    }
    
    const newTask: WSJFTask = {
      id: '', // TODO: Generate ID
      ...task,
      completed: false,
      wsjfScore: this.calculateWSJFScore(
        task.businessValue || 0,
        task.timeCriticality || 0,
        task.riskReduction || 0,
        task.jobSize || 1
      ),
    };
    
    this.props.tasks.push(newTask);
    this.setUpdatedAt();
  }

  public updateTask(
    taskId: string,
    updates: {
      businessValue?: number;
      timeCriticality?: number;
      riskReduction?: number;
      jobSize?: number;
      completed?: boolean;
    }
  ): void {
    // TODO: Find task by ID
    // TODO: Update task properties
    // TODO: Recalculate WSJF score if scoring values changed
    // TODO: Set updated timestamp
    if (this.props.tasks) {
      const task = this.props.tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        
        // Recalculate score if scoring values changed
        if (updates.businessValue !== undefined || 
            updates.timeCriticality !== undefined || 
            updates.riskReduction !== undefined || 
            updates.jobSize !== undefined) {
          task.wsjfScore = this.calculateWSJFScore(
            task.businessValue || 0,
            task.timeCriticality || 0,
            task.riskReduction || 0,
            task.jobSize || 1
          );
        }
        
        this.setUpdatedAt();
      }
    }
  }

  public removeTask(taskId: string): void {
    // TODO: Find and remove task by ID
    // TODO: Set updated timestamp
    if (this.props.tasks) {
      this.props.tasks = this.props.tasks.filter(t => t.id !== taskId);
      this.setUpdatedAt();
    }
  }

  public submit(): void {
    // TODO: Validate report can be submitted (has tasks)
    // TODO: Set status to submitted
    // TODO: Set submitted timestamp
    // TODO: Set updated timestamp
    this.props.status = 'submitted';
    this.props.submittedAt = new Date();
    this.setUpdatedAt();
  }

  public markOverdue(): void {
    // TODO: Set status to overdue
    // TODO: Set updated timestamp
    this.props.status = 'overdue';
    this.setUpdatedAt();
  }

  private calculateWSJFScore(businessValue: number, timeCriticality: number, riskReduction: number, jobSize: number): number {
    // TODO: Implement WSJF formula: (Business Value + Time Criticality + Risk Reduction) / Job Size
    // TODO: Handle division by zero
    // TODO: Return calculated score
    if (jobSize === 0) return 0;
    return (businessValue + timeCriticality + riskReduction) / jobSize;
  }

  public getTasksSortedByWSJF(): WSJFTask[] {
    // TODO: Sort tasks by WSJF score descending
    // TODO: Return sorted array
    return this.props.tasks?.sort((a, b) => (b.wsjfScore || 0) - (a.wsjfScore || 0)) || [];
  }

  public getHighestPriorityTask(): WSJFTask | undefined {
    // TODO: Return task with highest WSJF score
    return this.getTasksSortedByWSJF()[0];
  }

  public getAverageWSJFScore(): number {
    // TODO: Calculate average WSJF score across all tasks
    if (!this.props.tasks || this.props.tasks.length === 0) return 0;
    const totalScore = this.props.tasks.reduce((sum, task) => sum + (task.wsjfScore || 0), 0);
    return totalScore / this.props.tasks.length;
  }

  public getCompletedTasksCount(): number {
    // TODO: Count completed tasks
    return this.props.tasks?.filter(t => t.completed).length || 0;
  }

  public getTotalTasksCount(): number {
    // TODO: Return total tasks count
    return this.props.tasks?.length || 0;
  }

  public getCompletionRate(): number {
    // TODO: Calculate completion rate percentage
    const total = this.getTotalTasksCount();
    if (total === 0) return 0;
    return (this.getCompletedTasksCount() / total) * 100;
  }

  public isSubmitted(): boolean {
    return this.props.status === 'submitted';
  }

  public isDraft(): boolean {
    return this.props.status === 'draft';
  }

  public isOverdue(): boolean {
    return this.props.status === 'overdue';
  }
}