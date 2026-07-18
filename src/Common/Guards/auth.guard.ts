import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';
import { HUserDocument, User } from 'src/DB/Models/user.model';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<HUserDocument>,
    private jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    if (!token) {
      throw new UnauthorizedException('Invalid Token format');
    }
    const payload = this.jwtService.verify(token, {
      secret: process.env.ACCESS_TOKEN_SECRET,
    });

    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new NotFoundException('User not Found');
    }
    request.user = user;

    return true;
  }
}
