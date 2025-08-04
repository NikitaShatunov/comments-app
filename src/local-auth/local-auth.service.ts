import * as argon from 'argon2';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthPayloadDto } from './dto/local-auth-payload.dto';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { OtpCodeService } from 'src/otp-code/otp-code.service';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class LocalAuthService {
  constructor(
    private entityManager: EntityManager,
    private jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly otpCodeService: OtpCodeService,
  ) {}

  generateOTPcode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async validateUser(localAuthPayloadDto: AuthPayloadDto) {
    try {
      const findUser = await this.entityManager.findOne(User, {
        where: {
          email: localAuthPayloadDto.email,
        },
      });

      if (!findUser) {
        throw new HttpException(
          `User with email ${localAuthPayloadDto.email} is not found`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const isValidPassword = await argon.verify(
        findUser.password,
        localAuthPayloadDto.password,
      );

      if (!isValidPassword) {
        throw new HttpException(`Invalid password`, HttpStatus.UNAUTHORIZED);
      }

      const { password, ...user } = findUser;
      return this.jwtService.sign({ user });
    } catch (error) {
      throw error;
    }
  }

  async verifyUser(verifyEmailDto: VerifyEmailDto) {
    try {
      const user = await this.entityManager.findOne(User, {
        where: { email: verifyEmailDto.email },
        relations: { otp: true },
      });
      const { otp: user_otp } = verifyEmailDto;
      if (!user) {
        throw new HttpException(
          `User with email ${verifyEmailDto.email} is not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const otp = user.otp;
      if (!otp) {
        throw new HttpException(`No OTP generated`, HttpStatus.BAD_REQUEST);
      } else if (otp.value !== verifyEmailDto.otp) {
        throw new HttpException(`Invalid OTP`, HttpStatus.BAD_REQUEST);
      }

      if (
        otp &&
        otp.expirationTime > new Date() &&
        otp.type === 'verify account' &&
        +otp.value === +user_otp &&
        otp.status === 'unused'
      ) {
        await this.otpCodeService.update(otp.id, { ...otp, status: 'used' });
        const updateUserDto = {
          ...user,
          is_verified: true,
          status: 'active',
        };

        return await this.entityManager.save(User, updateUserDto);
      }

      throw new HttpException(`Wrong otp`, HttpStatus.BAD_REQUEST);
    } catch (error) {
      throw error;
    }
  }

  async recoverPassword(recoverPasswordDto: RecoverPasswordDto) {
    try {
      const user = await this.entityManager.findOne(User, {
        where: { email: recoverPasswordDto.email },
        relations: { otp: true },
      });
      if (!user) {
        throw new HttpException(
          `User with email ${recoverPasswordDto.email} is not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const otp = user.otp;
      if (!otp) {
        throw new HttpException(
          `OTP code is not generated`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (otp.value !== recoverPasswordDto.otp) {
        throw new HttpException(`Invalid OTP`, HttpStatus.BAD_REQUEST);
      }
      const password = await argon.hash(recoverPasswordDto.newPassword);
      await this.entityManager.save(User, {
        id: user.id,
        password,
        is_verified: true,
      });

      await this.otpCodeService.remove(otp.id);
      return 200;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.entityManager.findOne(User, {
        where: {
          email: changePasswordDto.email,
        },
      });

      if (!user) {
        throw new HttpException(
          `User with email ${changePasswordDto.email} is not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      if (changePasswordDto.newPassword === changePasswordDto.oldPassword) {
        throw new HttpException(
          `Passwords are the same`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isValidPassword = await argon.verify(
        user.password,
        changePasswordDto.oldPassword,
      );

      if (!isValidPassword) {
        throw new HttpException(`Invalid password`, HttpStatus.UNAUTHORIZED);
      }

      user.password = await argon.hash(changePasswordDto.newPassword);
      return await this.entityManager.save(User, user);
    } catch (error) {
      throw error;
    }
  }

  async createOtpForUser(GenerateOtpDto: GenerateOtpDto) {
    try {
      const user = await this.entityManager.findOne(User, {
        where: { email: GenerateOtpDto.email },
      });

      if (!user) {
        throw new HttpException(
          `User with email ${GenerateOtpDto.email} is not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      const otpCode = this.generateOTPcode();
      const createOtpCodeOtp = {
        value: otpCode,
        expirationMinutes: 5,
        type: GenerateOtpDto.type,
        userId: user.id,
        role: 'user',
      };
      if (createOtpCodeOtp.type === 'reset password') {
        // Send email with OTP code for password reset
      }
      if (createOtpCodeOtp.type === 'verify account') {
        // Send email with OTP code for account verification
      }

      await this.otpCodeService.create(createOtpCodeOtp);
      return otpCode;
    } catch (error) {
      throw error;
    }
  }

  async changeEmail(changeEmailDto: ChangeEmailDto) {
    const user = await this.entityManager.findOne(User, {
      where: { email: changeEmailDto.email },
    });
    if (!user) {
      throw new HttpException(
        `User with email ${changeEmailDto.email} is not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    const isValidPassword = await argon.verify(
      user.password,
      changeEmailDto.password,
    );
    if (!isValidPassword) {
      throw new HttpException(`Invalid password`, HttpStatus.UNAUTHORIZED);
    }

    if (changeEmailDto.email === changeEmailDto.newEmail) {
      throw new HttpException(`Emails are the same`, HttpStatus.BAD_REQUEST);
    }

    const otp = await this.otpCodeService.create({
      value: this.generateOTPcode(),
      type: 'verify account',
      expirationMinutes: 5,
      userId: user.id,
      role: 'user',
    });
  }
  async changeEmailRedirect({
    otp,
    id,
    newEmail,
  }: {
    otp: string;
    id: number;
    newEmail: string;
  }) {
    const user = await this.userService.findOne(id);
    if (user.otp.value === otp) {
      user.email = newEmail;
      user.isVerified = true;
      return await this.entityManager.save(User, user);
    }
    return 200;
  }
}
