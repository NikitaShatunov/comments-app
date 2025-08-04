import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  Get,
  Param,
  Res,
  Delete,
  UseGuards,
  Req,
  HttpException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/local-auth/guards/jwt.guard';

import { MediaFilePipe } from './media-file.pipe';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(new MediaFilePipe())
    file: Express.Multer.File,
  ) {
    const savedFilePath = await this.mediaService.saveFile(file);
    return { filePath: savedFilePath };
  }

  @Get('/file/:id')
  async getMedia(@Param('id') id: number, @Res() res: Response) {
    try {
      const { fileBuffer, name } = await this.mediaService.getMedia(id);
      const encodedName = encodeURIComponent(name);
      res.set({
        'Content-Disposition': `attachment; filename="${encodedName}"`,
        'Content-Type': 'application/octet-stream',
      });

      res.status(HttpStatus.OK).send(fileBuffer);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOneMedia(@Param('id') id: number) {
    return await this.mediaService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request) {
    const { id: id_user } = request.user.user;

    return this.mediaService.remove(+id, id_user);
  }
}
