import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { HUserDocument } from 'src/DB/Models/user.model';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: HUserDocument): string {
    return this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '1h',
      },
    );
  }

  generateRefreshToken(user: HUserDocument): string {
    return this.jwtService.sign(
      {
        id: user._id,
      },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  generateTokens(user: HUserDocument) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token) as JwtPayload | null;
  }
}
