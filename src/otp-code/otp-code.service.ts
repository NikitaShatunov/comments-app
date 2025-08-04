import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isIdNumber } from '../common/helpers/isIdNumber';
import { OtpCode } from './entities/otp-code.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateOtpCodeDto } from './dto/create-otp-code.dto';
import { User } from 'src/users/entities/user.entity';
import { UpdateOtpCodeDto } from './dto/update-otp-code.dto';

@Injectable()
export class OtpCodeService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpCodeRepository: Repository<OtpCode>,
    private readonly entityManager: EntityManager,
  ) {}

  calculateExpirationTime(expirationMinutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + expirationMinutes * 60 * 1000);
  }

  isOtpExpired(expirationTime: Date): boolean {
    const now = new Date();
    return now > expirationTime;
  }

  async create(createOtpCodeDto: CreateOtpCodeDto) {
    try {
      const { userId, role, expirationMinutes, type, value } = createOtpCodeDto;

      // Find the target entity
      const user = await this.entityManager.findOne(User, {
        where: { id: userId },
        relations: { otp: true },
      });

      if (!user) {
        throw new HttpException(
          `${role.charAt(0).toUpperCase() + role.slice(1)} with id ${userId} is not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (user.otp) await this.remove(user.otp.id);

      // Calculate the expiration time
      const expirationTime = this.calculateExpirationTime(expirationMinutes);

      // Create the new OTP code
      const otpCode = this.otpCodeRepository.create({
        value,
        expirationTime,
        user,
        type,
      });

      return await this.otpCodeRepository.save(otpCode);
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return this.otpCodeRepository.find();
  }

  async findOne(id: number) {
    try {
      isIdNumber(id, 'otp');
      const otp = await this.otpCodeRepository.findOne({ where: { id } });
      if (!otp) {
        throw new HttpException(
          'There is no otp codes with id:' + id,
          HttpStatus.NOT_FOUND,
        );
      }

      return otp;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateOtpCodeDto: UpdateOtpCodeDto) {
    try {
      const otpCode = await this.findOne(id);
      if (!otpCode) {
        throw new HttpException(
          `OTP with id ${id} is not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.otpCodeRepository.merge(otpCode, {
        ...updateOtpCodeDto,
      });
      return await this.otpCodeRepository.save(otpCode);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.otpCodeRepository.delete(id);
      return {
        message: `OTP with id, ${id} was deleted`,
        code: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
