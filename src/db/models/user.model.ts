import { BasicDataModel } from "@antelopejs/interface-database-decorators";
import { User } from "../tables/user.table";

const UserModelBase = BasicDataModel(User, "users");

/**
 * Model of the `users` table, with user helpers on top of `BasicDataModel`.
 */
export class UserModel extends UserModelBase {
  /**
   * Get user by email
   * @param email User email
   * @returns The first user with that email, or `undefined` if there is none
   */
  async getUserByEmail(email: string) {
    return this.getBy("email", email).then((users) =>
      users.length > 0 ? users[0] : undefined,
    );
  }

  /**
   * Create a new user.
   * Sets `createdAt` and `updatedAt` to the current time. `@Hashed()` stores
   * only a hash of `password`.
   *
   * @param userData User data without `createdAt` and `updatedAt`
   */
  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();

    await this.insert({
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update user data.
   * Sets `updatedAt` to the current time.
   *
   * @param id User ID
   * @param userData Partial user data to update
   * @returns Number of modified documents
   */
  async updateUser(
    id: string,
    userData: Partial<Omit<User, "id" | "createdAt">>,
  ) {
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    return this.update(id, updateData);
  }
}
