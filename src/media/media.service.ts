import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { EntityManager, Repository } from 'typeorm';
import { isIdNumber } from 'src/common/helpers/isIdNumber';
import { validateGetById } from 'src/common/helpers/validateGetById';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class MediaService {
  private readonly mediaDirectory = './media';

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly entityManager: EntityManager,
  ) {
    this.ensureMediaDirectoryExists();
  }

  async saveFile(file: Express.Multer.File): Promise<Media> {
    const randomString = Math.random().toString(36).substring(2, 10);
    const name = randomString + '-' + file.originalname;
    const filePath = join(this.mediaDirectory, name);

    try {
      await fs.writeFile(filePath, file.buffer);

      const media = this.mediaRepository.create({
        name,
        path: filePath,
      });

      return await this.mediaRepository.save(media);
    } catch (error) {
      throw new HttpException(
        'Failed to save file: ' + error,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getMedia(id: number) {
    const media = await this.findOne(id);
    const filePath = media.path;
    try {
      const fileBuffer = await fs.readFile(filePath);
      return { fileBuffer, name: media.name };
    } catch (error) {
      throw new NotFoundException('File not found on the server');
    }
  }

  async findOne(id: number, id_user?: number) {
    isIdNumber(id, 'media');
    const media = await this.mediaRepository.findOne({ where: { id } });
    validateGetById(id, media, 'media');
    return media;
  }

  // @OnEvent('comment.deleted')
  // async handleCommentDeletedEvent(event: CommentDeletedEvent) {
  //   const { fileId } = event;
  //   if (!fileId) return;
  //   const media = await this.findOne(fileId);
  //   await this.remove(media.id);
  // }

  async remove(id: number, id_user?: number) {
    const media = await this.findOne(id, id_user);
    return await this.deleteMediaFile(media.path, id);
  }

  private async deleteMediaFile(filePath: string, id: number) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${filePath}`);
    }

    // Remove the media record from the database
    await this.mediaRepository.delete(id);

    return {
      message: `Media with id: ${id} was deleted successfully`,
      status: HttpStatus.OK,
    };
  }

  private async ensureMediaDirectoryExists() {
    try {
      await fs.mkdir(this.mediaDirectory, { recursive: true });
    } catch (error) {
      throw new BadRequestException('Failed to create media directory');
    }
  }
}
