import {
  Table,
  Field,
  Index,
  Relation,
  RegisterTable,
} from "@antelopejs/interface-database-decorators";
import { User } from "./user.table";

/**
 * The `tasks` table: a title, a description, a `userId` column that refers
 * to a user, and creation and update date columns.
 */
@RegisterTable("tasks", "default")
export class Task extends Table {
  @Field("string")
  declare _id: string;

  @Field("string")
  declare title: string;

  @Field("string")
  declare description: string;

  @Relation({ to: () => User })
  @Index()
  @Field("string")
  declare userId: string;

  @Field("date")
  declare createdAt: Date;

  @Field("date")
  declare updatedAt: Date;
}
