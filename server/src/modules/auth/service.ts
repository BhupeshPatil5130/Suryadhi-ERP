import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import prisma from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/helpers';
import { LoginInput, SignupInput, UpdateProfileInput, CreateUserInput, UpdateUserInput } from './schema';


export class AuthService {
  /**
   * Authenticate user and return tokens
   */
  async login(input: LoginInput, ip?: string, userAgent?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: input.username, mode: 'insensitive' } },
          { email: { equals: input.username, mode: 'insensitive' } },
        ],
        isActive: true,
        deletedAt: null,
      },
      include: {
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role, user.schoolId);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        school: user.school,
      },
    };
  }

  /**
   * Create a new user account and log them in
   */
  async signup(input: SignupInput, ip?: string, userAgent?: string) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: input.username },
          { email: input.email },
        ],
      },
    });

    if (existingUser) {
      throw new AppError('Username or email already exists', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    
    // We optionally assign them to the first school as a default (if one exists)
    const school = await prisma.school.findFirst();

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'SCHOOL_ADMIN',
        schoolId: school ? school.id : null,
      },
      include: {
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role, user.schoolId);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'SIGNUP',
      entity: 'User',
      entityId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        school: user.school,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string) {
    // Verify refresh token exists and is valid
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: { id: true, role: true, schoolId: true, isActive: true },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up expired token if exists
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new AppError('Invalid or expired refresh token', 401, true, 'REFRESH_TOKEN_EXPIRED');
    }

    if (!storedToken.user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    // Rotate refresh token (invalidate old, create new)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = this.generateAccessToken(
      storedToken.user.id,
      storedToken.user.role,
      storedToken.user.schoolId
    );
    const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    
    // Optionally invalidate all refresh tokens for user
    if (userId) {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        lastLoginAt: true,
        profileData: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { profileData, ...rest } = user;
    return {
      ...rest,
      profileInfo: (profileData as Record<string, unknown>) ?? {},
    };
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string | null;
    phone?: string | null;
  }) {
    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existing) {
      throw new AppError('Username or email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // If no schoolId provided and role is not SUPER_ADMIN, attempt to attach to default school
    let targetSchoolId = data.schoolId || null;
    if (!targetSchoolId && data.role !== 'SUPER_ADMIN') {
      const defaultSchool = await prisma.school.findFirst();
      if (defaultSchool) {
        targetSchoolId = defaultSchool.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        schoolId: targetSchoolId,
        phone: data.phone || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { firstName, lastName, email, phone, currentPassword, newPassword, ...extendedData } = input as any;

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
    };

    if (newPassword) {
      if (!currentPassword) {
        throw new AppError('Current password is required to set a new password', 400);
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Current password is incorrect', 400);
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Merge new extended fields into the existing profileData JSONB column atomically.
    // Avoids the race conditions inherent in the old read-modify-write JSON file approach.
    if (Object.keys(extendedData).length > 0) {
      const existing = (user as any).profileData as Record<string, unknown> | null;
      updateData.profileData = { ...(existing ?? {}), ...extendedData };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        profileData: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const { profileData, ...rest } = updatedUser;
    return {
      ...rest,
      profileInfo: (profileData as Record<string, unknown>) ?? {},
    };
  }

  /**
   * List users scoped by role and school
   */
  async listUsers(schoolId: string | undefined, role: string) {
    const whereClause: any = {
      deletedAt: null,
    };

    // If not SUPER_ADMIN, scope by schoolId (or default school if available)
    if (role !== 'SUPER_ADMIN') {
      let targetSchoolId = schoolId;
      if (!targetSchoolId) {
        const defaultSchool = await prisma.school.findFirst();
        targetSchoolId = defaultSchool?.id;
      }
      if (targetSchoolId) {
        whereClause.schoolId = targetSchoolId;
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Update another user (admin only)
   */
  async updateUser(userId: string, input: UpdateUserInput) {
    const updateData: any = {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role as any,
      schoolId: input.schoolId,
      phone: input.phone,
    };

    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return user;
  }

  /**
   * Soft-delete/Deactivate user
   */
  async deleteUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
    return true;
  }

  // ── Private methods ──────────────────────────────────────────

  private generateAccessToken(userId: string, role: string, schoolId?: string | null): string {
    return jwt.sign(
      { userId, role, schoolId: schoolId || undefined },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = `rt_${randomBytes(32).toString('hex')}`;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}

export const authService = new AuthService();
