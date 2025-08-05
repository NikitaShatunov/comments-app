import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LocalGuard } from './guards/local.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthPayloadDto } from './dto/local-auth-payload.dto';

@Controller('local-auth')
export class LocalAuthController {
  constructor() {}

  @ApiOperation({ summary: 'Email+password auth' })
  @ApiBody({ type: AuthPayloadDto })
  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() req) {
    return req.user;
  }
}
