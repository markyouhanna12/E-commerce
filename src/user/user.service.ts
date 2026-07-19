import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EncryptionService } from 'src/Common/Encryption/encryption.service';
import { HUserDocument, User } from 'src/DB/Models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<HUserDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getProfile(user: HUserDocument) {
    const profile = await this.userModel
      .findById(user._id)
      .select('-password -__v');

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    profile.phoneNumber = this.encryptionService.decrypt(profile.phoneNumber);

    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  async findAll() {
    const users = await this.userModel.find().select('-password -__v');

    return {
      message: 'Users retrieved successfully',
      results: users.length,
      data: users,
    };
  }
}
