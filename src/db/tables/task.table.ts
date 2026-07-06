import { Table, Field, Index, RegisterTable } from '@antelopejs/interface-database-decorators';

/**
 * Task table definition with title, description and userId fields
 */
@RegisterTable('tasks', 'default')
export class Task extends Table {
  @Field('string')
  declare _id: string;

  @Field('string')
  declare title: string;

  @Field('string')
  declare description: string;

  @Index()
  @Field('string')
  declare userId: string;

  @Field('date')
  declare createdAt: Date;

  @Field('date')
  declare updatedAt: Date;
}
