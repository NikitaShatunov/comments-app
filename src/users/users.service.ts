import * as argon2 from 'argon2';

import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { isIdNumber } from 'src/common/helpers/isIdNumber';
import { validateGetById } from 'src/common/helpers/validateGetById';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { isUniquePropertyValue } from 'src/common/helpers/isUniquePropertyValue';
import { Repository } from 'typeorm';
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from './events/user-created.events';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    // private readonly eventEmitter: EventEmitter2,
  ) {}
  async create(createUserDto: CreateUserDto) {
    await isUniquePropertyValue(
      'email',
      createUserDto.email,
      this.userRepository,
    );
    // Generate a random name for the user
    const name = this.generateRandomName();
    const passwordHash = await argon2.hash(createUserDto.password);
    const user = this.userRepository.create({
      ...createUserDto,
      password: passwordHash,
      name,
    });
    const { password, ...result } = await this.userRepository.save(user);
    // Emit the event after the user is created used for logging or other side effects(email notifications, etc.)
    const userCreatedEvent: UserCreatedEvent = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    // this.eventEmitter.emit('user.created', userCreatedEvent);
    return result;
  }

  generateRandomName() {
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      style: 'capital',
      length: 2,
    });

    return randomName;
  }

  async findOne(id: number) {
    isIdNumber(id, 'User');
    const user = await this.userRepository.findOne({ where: { id } });
    validateGetById(id, user, 'User');
    return user;
  }
}
