import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  private readonly REFRESH_COOKIE = 'refresh_token';

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.usersService.save({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiry,
    });

    await this.mailService.sendVerificationEmail(
      dto.email,
      dto.firstName,
      verificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailVerificationToken(token);

    if (
      !user ||
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Account is already verified');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const GENERIC_ERROR = 'Invalid credentials';

    if (!user) throw new UnauthorizedException(GENERIC_ERROR);

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException(GENERIC_ERROR);

    if (!user.isActive) throw new UnauthorizedException(GENERIC_ERROR);

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before logging in',
      );
    }

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );

    await this.storeRefreshToken(user.id, refreshToken);
    await this.usersService.update(user.id, { lastLoginAt: new Date() });
    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(
    userId: string,
    incomingRefreshToken: string,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByIdWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const tokenMatches = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshToken,
    );

    if (!tokenMatches) {
      // Reuse detection: invalidate all sessions
      await this.usersService.update(userId, { refreshToken: null });
      throw new ForbiddenException('Refresh token reuse detected');
    }

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );

    await this.storeRefreshToken(user.id, refreshToken);
    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    const GENERIC_MSG =
      'If an account with that email exists, a reset link has been sent.';

    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: GENERIC_MSG };

    const passwordResetToken = randomBytes(32).toString('hex');
    const passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.usersService.update(user.id, {
      passwordResetToken,
      passwordResetTokenExpiresAt,
    });

    await this.mailService.sendResetPasswordEmail(
      user.email,
      user.firstName,
      passwordResetToken,
    );

    return { message: GENERIC_MSG };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(dto.token);

    if (
      !user ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
      refreshToken: null, // invalidate all sessions
    });

    return {
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  async logout(userId: string, res: Response): Promise<{ message: string }> {
    await this.usersService.update(userId, { refreshToken: null });
    res.clearCookie(this.REFRESH_COOKIE);
    return { message: 'Logged out successfully' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: string,
    email: string,
    role: Role,
    tenantId: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, email, role, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: (this.config.get('JWT_EXPIRES_IN')) as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get('JWT_REFRESH_EXPIRES_IN')) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshToken: hashed });
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie(this.REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeMs,
    });
  }
}
