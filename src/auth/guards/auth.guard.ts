import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';
import { TokenService } from 'src/Common/Tokens/token.service';
import { HUserDocument, User } from 'src/DB/Models/user.model';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectModel(User.name)
    private readonly userModel: Model<HUserDocument>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Token Format');
    }
    const payload = this.tokenService.verifyAccessToken(token);

    const user = await this.userModel.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;

    return true;
  }
}
