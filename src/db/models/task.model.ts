import { BasicDataModel } from "@antelopejs/interface-database-decorators";
import { Task } from "../tables/task.table";

const TaskModelBase = BasicDataModel(Task, "tasks");

/**
 * Model of the `tasks` table, with task helpers on top of `BasicDataModel`.
 */
export class TaskModel extends TaskModelBase {
  /**
   * Get tasks by user ID
   * @param userId User ID
   * @returns Tasks whose `userId` is `userId`
   */
  async getTasksByUserId(userId: string) {
    return this.getBy("userId", userId);
  }

  /**
   * Create a new task.
   * Sets `createdAt` and `updatedAt` to the current time.
   *
   * @param taskData The owner's `userId` and the task's fields
   * @returns The id of the inserted task, in a one-element array
   */
  async createTask(
    taskData: Pick<Task, "userId"> &
      Partial<Pick<Task, "title" | "description">>,
  ) {
    const now = new Date();

    return this.insert({
      ...taskData,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update task data.
   * Sets `updatedAt` to the current time.
   *
   * @param id Task ID
   * @param taskData Partial task data to update
   * @returns Number of modified documents
   */
  async updateTask(
    id: string,
    taskData: Partial<Omit<Task, "id" | "createdAt">>,
  ) {
    const updateData = {
      ...taskData,
      updatedAt: new Date(),
    };

    return this.update(id, updateData);
  }
}
