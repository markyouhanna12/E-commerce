import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthorizationType, RoleEnum } from 'src/Common/Enums/user.enums';
import { TokenService } from 'src/Common/Tokens/token.service';
import { HUserDocument, User } from 'src/DB/Models/user.model';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectModel(User.name)
    private readonly userModel: Model<HUserDocument>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const [type, token] = authorization.split(' ');

    if (!type || !token) {
      throw new UnauthorizedException('Invalid Token Format');
    }

    let role: RoleEnum;
    switch (type) {
      case AuthorizationType.USER:
        role = RoleEnum.USER;
        break;
      case AuthorizationType.ADMIN:
        role = RoleEnum.ADMIN;
        break;

      default:
        throw new UnauthorizedException('Invalid Authorization Type');
    }

    const payload: JwtPayload = this.tokenService.verifyAccessToken(
      token,
      role,
    );

    if (payload.role !== role) {
      throw new UnauthorizedException('Token role mismatch');
    }

    const user = await this.userModel.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== role) {
      throw new UnauthorizedException('Unauthorized role');
    }

    request.user = user;

    return true;
  }
}
