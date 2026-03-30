import { Table, Index, HashModifier, Hashed, RegisterTable } from '@antelopejs/interface-database-decorators';

/**
 * User table definition with basic user fields
 */
@RegisterTable('users', 'default')
export class User extends Table.with(HashModifier) {
  declare _id: string;

  @Index()
  declare email: string;

  @Hashed()
  declare password: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
