import { BasicDataModel, GetModel } from '@ajs/database-decorators/beta';
import { Task } from '../tables/task.table';

// Create a basic model for the Task table
const TaskModelBase = BasicDataModel(Task, 'tasks');

/**
 * Extended Task Model with additional custom methods
 */
export class TaskModel extends TaskModelBase {
  /**
   * Get tasks by user ID
   * @param userId User ID
   * @returns Array of tasks assigned to the user
   */
  async getTasksByUserId(userId: string) {
    return this.getBy('userId', userId);
  }

  /**
   * Create a new task
   * @param taskData Task data without id, createdAt and updatedAt fields
   * @returns Created task
   */
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();

    await this.insert({
      ...taskData,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update task data
   * @param id Task ID
   * @param taskData Partial task data to update
   * @returns Updated task
   */
  async updateTask(id: string, taskData: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const updateData = {
      ...taskData,
      updatedAt: new Date(),
    };

    return this.update(id, updateData);
  }
}

/**
 * Get or create a TaskModel instance for the specified database
 * @param databaseName Database name
 * @returns TaskModel instance
 */
export function getTaskModel(databaseName: string = 'main') {
  return GetModel(TaskModel, databaseName);
}
