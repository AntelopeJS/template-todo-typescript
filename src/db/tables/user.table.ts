import { Table, Field, Index, HashModifier, Hashed, RegisterTable } from '@antelopejs/interface-database-decorators';

/**
 * User table definition with basic user fields
 */
@RegisterTable('users', 'default')
export class User extends Table.with(HashModifier) {
  @Field('string')
  declare _id: string;

  @Index()
  @Field('string')
  declare email: string;

  @Hashed()
  @Field('string')
  declare password: string;

  @Field('date')
  declare createdAt: Date;

  @Field('date')
  declare updatedAt: Date;
}
