import {
  Controller,
  Post,
  Get,
  Context,
  RequestContext,
  HTTPResult,
  RawBody,
} from "@antelopejs/interface-api";
import { SignRaw, Authentication } from "@antelopejs/interface-auth";
import { Model } from "@antelopejs/interface-database-decorators";
import { UserModel } from "../db";

const TOKEN_EXPIRY = "24h";

interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/** Payload that `login` signs into the token and `Authentication()` returns. */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Authentication routes under `/auth`: registration, login and the current
 * user's profile.
 */
export class AuthController extends Controller("/auth") {
  @Context()
  declare context: RequestContext;

  @Model(UserModel, "default")
  declare userModel: UserModel;

  /**
   * `POST /auth/register`: creates a user from an email and a password of at
   * least 6 characters. Answers 400 when a field is missing or empty or the
   * password is too short, and 409 when the email is taken.
   */
  @Post("/register")
  async register(@RawBody() body: Buffer) {
    const data = JSON.parse(body.toString()) as RegisterRequest;
    const { email, password } = data;

    if (!email || !password) {
      return new HTTPResult(400, "Email and password are required");
    }

    if (password.length < 6) {
      return new HTTPResult(400, "Password must be at least 6 characters long");
    }

    const existingUser = await this.userModel.getUserByEmail(email);
    if (existingUser) {
      return new HTTPResult(409, "User with this email already exists");
    }

    await this.userModel.createUser({ email, password });
  }

  /**
   * `POST /auth/login`: checks an email and password and returns the user with
   * a token valid for 24 hours. Answers 400 when a field is missing or empty and
   * 401 when the credentials do not match.
   */
  @Post("/login")
  async login(@RawBody() body: Buffer) {
    const data = JSON.parse(body.toString()) as LoginRequest;
    const { email, password } = data;

    if (!email || !password) {
      return new HTTPResult(400, "Email and password are required");
    }

    const user = await this.userModel.getUserByEmail(email);
    if (!user) {
      return new HTTPResult(401, "Invalid credentials");
    }

    const isPasswordMatch = user.testHash("password", password);
    if (!isPasswordMatch) {
      return new HTTPResult(401, "Invalid credentials");
    }

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
   * `GET /auth/me`: returns the profile of the user the token belongs to.
   * Answers 401 when the token is missing or invalid and 404 when that user no
   * longer exists.
   */
  @Get("/me")
  async getUserProfile(@Authentication() auth: AuthUser) {
    const user = await this.userModel.get(auth.userId);

    if (!user) {
      return new HTTPResult(404, "User not found");
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
