import * as argon from 'argon2';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthPayloadDto } from './dto/local-auth-payload.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LocalAuthService {
  constructor(
    private entityManager: EntityManager,
    private jwtService: JwtService,
  ) {}

  async validateUser(localAuthPayloadDto: AuthPayloadDto) {
    try {
      const findUser = await this.entityManager.findOne(User, {
        where: {
          email: localAuthPayloadDto.email,
        },
      });

      if (!findUser) {
        throw new UnauthorizedException(
          `User with email ${localAuthPayloadDto.email} is not found`,
        );
      }

      const isValidPassword = await argon.verify(
        findUser.password,
        localAuthPayloadDto.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException(`Invalid password`);
      }

      const { password, ...user } = findUser;
      return this.jwtService.sign({ user });
    } catch (error) {
      throw error;
    }
  }
}
