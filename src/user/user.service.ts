import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  health() {
    throw new BadRequestException('bad request from health');
  }
}
