import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HUserDocument, User } from 'src/DB/Models/user.model';
import { Model } from 'mongoose';
import { compare, hash } from 'src/Common/Security/hash.security';
import { MailService } from 'src/mail/mail.service';
import { customAlphabet } from 'nanoid';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from 'src/Common/Tokens/token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<HUserDocument>,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
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

  async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
    const user = await this.userModel.findOne({
      email: confirmEmailDto.email,
    });
    if (!user) {
      throw new NotFoundException(
        'No Account record matches this email address',
      );
    }
    if (user.confirmEmail) {
      throw new BadRequestException('This email account has been confirmed');
    }
    if (
      !user.confirmEmailOTP ||
      !(await compare(confirmEmailDto.confirmEmailOTP, user.confirmEmailOTP))
    ) {
      throw new BadRequestException(
        'The verfication code is provided incorrect',
      );
    }
    if (new Date() > user.otpExpiresAt!) {
      throw new BadRequestException(
        'The verfication code has expired. Please sign up again',
      );
    }

    await this.userModel.updateOne(
      { _id: user._id },
      {
        confirmEmail: new Date(),
        $unset: {
          confirmEmailOTP: 1,
          otpExpiresAt: 1,
        },
      },
    );
  }

  async login(loginDto: LoginDto) {
    const { email, password, FCM } = loginDto;

    const user = await this.userModel.findOne({
      email,
      confirmEmail: { $exists: true },
    });

    if (!user) {
      throw new NotFoundException('User not found or email not confirmed');
    }
    const isMatched = await compare(password, user.password);

    if (!isMatched) {
      throw new BadRequestException('Invalid password');
    }

    const tokens = this.tokenService.generateTokens(user);

    return {
      message: 'Login Successful',
      tokens,
    };
  }
}
