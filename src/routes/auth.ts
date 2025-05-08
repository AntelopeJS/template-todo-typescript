import { Controller, Post, Get, Context, RequestContext, HTTPResult, RawBody } from '@ajs/api/beta';
import { getUserModel } from '../db/models/user.model';
import { User } from '../db/tables/user.table';
import { SignRaw, Authentication } from '@ajs/auth/beta';

// Configuration
const TOKEN_EXPIRY = '24h';

// Define interfaces for request data
interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Define the JWT payload interface
interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Authentication Controller
 * Handles user registration, login, and profile retrieval
 */
export class AuthController extends Controller('/auth') {
  @Context()
  declare context: RequestContext;

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('/register')
  async register(@RawBody() body: Buffer) {
    const data = JSON.parse(body.toString()) as RegisterRequest;
    const { email, password } = data;

    // Validate inputs
    if (!email || !password) {
      return new HTTPResult(400, 'Email and password are required');
    }

    if (password.length < 6) {
      return new HTTPResult(400, 'Password must be at least 6 characters long');
    }

    const userModel = getUserModel();

    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return new HTTPResult(409, 'User with this email already exists');
    }

    // Create the user - password will be automatically hashed by the @Hashed decorator
    await userModel.createUser({
      email,
      password,
    } as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Login user
   * POST /auth/login
   */
  @Post('/login')
  async login(@RawBody() body: Buffer) {
    const data = JSON.parse(body.toString()) as LoginRequest;
    const { email, password } = data;

    // Validate inputs
    if (!email || !password) {
      return new HTTPResult(400, 'Email and password are required');
    }

    const userModel = getUserModel();

    // Find user by email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return new HTTPResult(401, 'Invalid credentials');
    }

    // Compare password - automatically uses hashed comparison based on @Hashed decorator
    const isPasswordMatch = user.password === password;
    if (!isPasswordMatch) {
      return new HTTPResult(401, 'Invalid credentials');
    }

    // Generate JWT token using the auth interface
    const token = await SignRaw(
      {
        userId: user._id,
        email: user.email,
      },
      { expiresIn: TOKEN_EXPIRY },
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    };
  }

  /**
   * Get current user profile using Authentication decorator
   * GET /auth/me
   */
  @Get('/me')
  async getUserProfile(@Authentication() auth: AuthUser) {
    const userModel = getUserModel();
    const user = await userModel.get(auth.userId);

    if (!user) {
      return new HTTPResult(404, 'User not found');
    }

    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authenticated: true,
    };
  }
}
