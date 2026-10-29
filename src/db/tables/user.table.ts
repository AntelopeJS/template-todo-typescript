import {
  Table,
  Field,
  Index,
  HashModifier,
  Hashed,
  RegisterTable,
} from "@antelopejs/interface-database-decorators";

/**
 * The `users` table: an email, a password that `@Hashed()` stores only as
 * a hash, and the creation and update dates.
 */
@RegisterTable("users", "default")
export class User extends Table.with(HashModifier) {
  @Field("string")
  declare _id: string;

  @Index()
  @Field("string")
  declare email: string;

  @Hashed()
  @Field("string")
  declare password: string;

  @Field("date")
  declare createdAt: Date;

  @Field("date")
  declare updatedAt: Date;
}
