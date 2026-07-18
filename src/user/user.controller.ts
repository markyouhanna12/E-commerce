import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import type { HUserDocument } from 'src/DB/Models/user.model';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: HUserDocument) {
    return this.userService.getProfile(user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  findAll() {
    return this.userService.findAll();
  }
}
