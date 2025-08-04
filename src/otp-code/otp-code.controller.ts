import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OtpCodeService } from './otp-code.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOtpCodeDto } from './dto/create-otp-code.dto';
import { UpdateOtpCodeDto } from './dto/update-otp-code.dto';
import { JwtAuthGuard } from 'src/local-auth/guards/jwt.guard';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiTags('otp-code')
@Controller('otp-code')
export class OtpCodeController {
  constructor(private readonly OtpCodeService: OtpCodeService) {}

  @Post()
  create(@Body() createOtpCodeDto: CreateOtpCodeDto) {
    return this.OtpCodeService.create(createOtpCodeDto);
  }

  @Get()
  findAll() {
    return this.OtpCodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.OtpCodeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOtpCodeDto: UpdateOtpCodeDto) {
    return this.OtpCodeService.update(+id, updateOtpCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.OtpCodeService.remove(+id);
  }
}
