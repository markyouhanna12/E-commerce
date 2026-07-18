import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HUserDocument, User } from 'src/DB/Models/user.model';
import { Model } from 'mongoose';
import { hash } from 'src/Common/Security/hash.security';
import { MailService } from 'src/mail/mail.service';
import { customAlphabet } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<HUserDocument>,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException(
        'An Account with this email address already exists',
      );
    }

    const otp = customAlphabet('0123456789', 6)();
    console.log(otp);

    const hashedOTP = await hash(otp);

    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 5); // 5 mins

    const newUser = new this.userModel({
      ...createUserDto,
      confirmEmailOTP: hashedOTP,
      otpExpiresAt: expireTime,
    });
    const savedUser = await newUser.save();

    this.mailService.sendVerificationOtp(savedUser.email, otp);

    return savedUser;
  }
}
