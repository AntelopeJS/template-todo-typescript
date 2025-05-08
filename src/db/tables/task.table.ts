import { Table, Index, RegisterTable } from '@ajs/database-decorators/beta';

/**
 * Task table definition with title, description and userId fields
 */
@RegisterTable('tasks', 'default')
export class Task extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare title: string;

  declare description: string;

  @Index()
  declare userId: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
