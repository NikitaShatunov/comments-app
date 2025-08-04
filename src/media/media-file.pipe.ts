import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as sharp from 'sharp';

const MAX_IMAGE_WIDTH = 320;
const MAX_IMAGE_HEIGHT = 240;

export const MAX_PROFILE_PICTURE_SIZE_IN_BYTES = 16 * 1024 * 1024; // 16MB
export const VALID_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/jpg',
];
export const VALID_TXT_MIME_TYPE = 'text/plain';

@Injectable()
export class MediaFilePipe implements PipeTransform {
  async transform(
    file: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (VALID_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      if (
        metadata.width > MAX_IMAGE_WIDTH ||
        metadata.height > MAX_IMAGE_HEIGHT
      ) {
        const resizedBuffer = await image
          .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, { fit: 'inside' })
          .toBuffer();
        file.buffer = resizedBuffer;
        file.size = resizedBuffer.length;
      }
      return file;
    }

    throw new BadRequestException('Unsupported file type');
  }
}
