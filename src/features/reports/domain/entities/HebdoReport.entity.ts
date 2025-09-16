import { BaseEntity } from '@/core/base/entities/Base.entity';

type HebdoTask = {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  tags?: string[];
  completed: boolean;
  notes?: string;
};

type HebdoReportProps = {
  id: string;
  userId: string;
  week: string;
  title: string;
  tasks?: HebdoTask[];
  objectives?: string[];
  notes?: string;
  status: 'draft' | 'submitted' | 'overdue';
  submittedAt?: Date;
};

export class HebdoReport extends BaseEntity {
  constructor(public props: HebdoReportProps) {
    super(props.id);
  }

  public addTask(task: Omit<HebdoTask, 'id' | 'completed'>): void {
    // TODO: Generate unique task ID
    // TODO: Validate task data
    // TODO: Create task with default completed = false
    // TODO: Add to tasks array
    // TODO: Set updated timestamp
    if (!this.props.tasks) {
      this.props.tasks = [];
    }
    
    const newTask: HebdoTask = {
      id: '', // TODO: Generate ID
      ...task,
      completed: false,
    };
    
    this.props.tasks.push(newTask);
    this.setUpdatedAt();
  }

  public updateTaskStatus(taskId: string, completed: boolean, actualHours?: number, notes?: string): void {
    // TODO: Find task by ID
    // TODO: Update task completion status
    // TODO: Update actual hours if provided
    // TODO: Update notes if provided
    // TODO: Set updated timestamp
    if (this.props.tasks) {
      const task = this.props.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = completed;
        if (actualHours !== undefined) task.actualHours = actualHours;
        if (notes !== undefined) task.notes = notes;
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

  public addObjective(objective: string): void {
    // TODO: Validate objective is not empty
    // TODO: Check if objective already exists
    // TODO: Add to objectives array
    // TODO: Set updated timestamp
    if (!this.props.objectives) {
      this.props.objectives = [];
    }
    if (!this.props.objectives.includes(objective)) {
      this.props.objectives.push(objective);
      this.setUpdatedAt();
    }
  }

  public removeObjective(objective: string): void {
    // TODO: Remove objective from array
    // TODO: Set updated timestamp
    if (this.props.objectives) {
      this.props.objectives = this.props.objectives.filter(obj => obj !== objective);
      this.setUpdatedAt();
    }
  }

  public submit(): void {
    // TODO: Validate report can be submitted (has tasks or objectives)
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

  public getTotalEstimatedHours(): number {
    // TODO: Sum all estimated hours
    return this.props.tasks?.reduce((sum, task) => sum + (task.estimatedHours || 0), 0) || 0;
  }

  public getTotalActualHours(): number {
    // TODO: Sum all actual hours
    return this.props.tasks?.reduce((sum, task) => sum + (task.actualHours || 0), 0) || 0;
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