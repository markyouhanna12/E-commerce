import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { HUserDocument } from 'src/DB/Models/user.model';
import { RoleEnum } from '../Enums/user.enums';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessSecret(role: RoleEnum): string {
    switch (role) {
      case RoleEnum.ADMIN:
        return this.configService.getOrThrow<string>(
          'TOKEN_ACCESS_ADMIN_SECRET_KEY',
        );

      default:
        return this.configService.getOrThrow<string>(
          'TOKEN_ACCESS_USER_SECRET_KEY',
        );
    }
  }

  private getRefreshSecret(role: RoleEnum): string {
    switch (role) {
      case RoleEnum.ADMIN:
        return this.configService.getOrThrow<string>(
          'TOKEN_REFRESH_ADMIN_SECRET_KEY',
        );

      default:
        return this.configService.getOrThrow<string>(
          'TOKEN_REFRESH_USER_SECRET_KEY',
        );
    }
  }

  generateAccessToken(user: HUserDocument): string {
    return this.jwtService.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: this.getAccessSecret(user.role),
        expiresIn: this.configService.getOrThrow<string>(
          'ACCESS_EXPIRES',
        ) as any,
      },
    );
  }

  generateRefreshToken(user: HUserDocument): string {
    return this.jwtService.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: this.getRefreshSecret(user.role),
        expiresIn: this.configService.getOrThrow<string>(
          'REFRESH_EXPIRES',
        ) as any,
      },
    );
  }

  generateTokens(user: HUserDocument): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  verifyAccessToken(token: string, role: RoleEnum): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.getAccessSecret(role),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string, role: RoleEnum): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.getRefreshSecret(role),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token) as JwtPayload | null;
  }
}
