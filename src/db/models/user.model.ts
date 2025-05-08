import { BasicDataModel, GetModel } from '@ajs/database-decorators/beta';
import { User } from '../tables/user.table';

// Create a basic model for the User table
const UserModelBase = BasicDataModel(User, 'users');

/**
 * Extended User Model with additional custom methods
 */
export class UserModel extends UserModelBase {
  /**
   * Get user by email
   * @param email User email
   * @returns User or undefined if not found
   */
  async getUserByEmail(email: string) {
    return this.getBy('email', email).then((users) => (users.length > 0 ? users[0] : undefined));
  }

  /**
   * Create a new user
   * @param userData User data without id, createdAt and updatedAt fields
   * @returns Created user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();

    await this.insert({
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update user data
   * @param id User ID
   * @param userData Partial user data to update
   * @returns Updated user
   */
  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>) {
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    return this.update(id, updateData);
  }
}

/**
 * Get or create a UserModel instance for the specified database
 * @param databaseName Database name
 * @returns UserModel instance
 */
export function getUserModel(databaseName: string = 'main') {
  return GetModel(UserModel, databaseName);
}
