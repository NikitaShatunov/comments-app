import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/local-auth/guards/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  findOne(@Req() req) {
    const userId = req.user?.user?.id;
    return this.usersService.findOne(+userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/delete/me')
  remove(@Req() req) {
    const userId = req.user?.user?.id;
    return this.usersService.remove(+userId);
  }
}
