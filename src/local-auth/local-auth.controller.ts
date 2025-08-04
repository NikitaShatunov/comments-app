import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LocalGuard } from './guards/local.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthPayloadDto } from './dto/local-auth-payload.dto';
import { LocalAuthService } from './local-auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@ApiTags('local-auth')
@Controller('local-auth')
export class LocalAuthController {
  constructor(private readonly authService: LocalAuthService) {}

  @ApiOperation({ summary: 'Email+password auth' })
  @ApiBody({ type: AuthPayloadDto })
  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() req) {
    return req.user;
  }

  @ApiOperation({ summary: 'Change password' })
  @Put('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @ApiOperation({ summary: 'Generate OTP code to recover password' })
  @Put('generate-otp-code')
  async generateOTP(@Body() GenerateOtpDto: GenerateOtpDto) {
    return this.authService.createOtpForUser(GenerateOtpDto);
  }

  @ApiOperation({ summary: 'Recover password (forget password) ' })
  @Put('recover-password')
  async recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return this.authService.recoverPassword(recoverPasswordDto);
  }

  @ApiOperation({ summary: 'Verification of account' })
  @Put('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyUser(verifyEmailDto);
  }

  @ApiOperation({ summary: 'Change email' })
  @Put('change-email')
  async changeEmail(@Body() changeEmailDto: ChangeEmailDto) {
    return this.authService.changeEmail(changeEmailDto);
  }

  @ApiOperation({ summary: 'Change email' })
  @Get('change-email-redirect')
  async changeEmailRedirect(
    @Res() res,
    @Query() otp: string,
    id: string,
    newEmail: string,
  ) {
    this.authService.changeEmailRedirect({ otp, id: +id, newEmail });
    return res.redirect('http://localhost:3000/en/apps/dashboard/');
  }
}
