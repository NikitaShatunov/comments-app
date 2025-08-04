import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { EntityManager, FindOptionsWhere, Like, Repository } from 'typeorm';
import { isIdNumber } from 'src/common/helpers/isIdNumber';
import { validateGetById } from 'src/common/helpers/validateGetById';
import { OnEvent } from '@nestjs/event-emitter';
import { PageDto } from 'src/pagination/page.dto';
import { MediaPageDto } from 'src/pagination/media/media-page.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PageMetaDto } from 'src/pagination/page-meta.dto';
import { selectMedia } from 'src/common/selects/select-media';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  private readonly mediaDirectory = './media';
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly entityManager: EntityManager,
  ) {
    this.ensureMediaDirectoryExists();
  }

  async saveFile(
    file: Express.Multer.File,
    crateMediaDto: CreateMediaDto,
  ): Promise<Media> {
    const randomString = Math.random().toString(36).substring(2, 10);
    // Generate a unique file name
    const fileName = randomString + '-' + file.originalname;
    const filePath = join(this.mediaDirectory, fileName);

    try {
      await fs.writeFile(filePath, file.buffer);

      const media = this.mediaRepository.create({
        ...crateMediaDto,
        path: filePath,
      });

      const savedMedia = await this.mediaRepository.save(media);
      // Clear cache after saving a new media file
      await this.cacheManager.clear();
      return savedMedia;
    } catch (error) {
      throw new HttpException(
        'Failed to save file: ' + error,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(PageOptionsDto: MediaPageDto): Promise<PageDto<Media>> {
    const { search, page, order, take, portfolioId } = PageOptionsDto;
    const skip = (page - 1) * take;

    const cacheKey = `media_page_${page}_take_${take}_${order}_search_${search}_portfolio_${portfolioId}`;
    // Check if the data is already cached
    const cached = await this.cacheManager.get<PageDto<Media>>(cacheKey);
    if (cached) {
      return cached;
    }

    const searchCondition: FindOptionsWhere<Media>[] = [];
    if (search) {
      searchCondition.push(
        {
          name: Like(`%${search}%`),
          isPublic: true,
          portfolio: { isPublic: true, id: portfolioId },
        },
        {
          description: Like(`%${search}%`),
          isPublic: true,
          portfolio: { isPublic: true, id: portfolioId },
        },
      );
    }

    const [entities, itemCount] = await this.mediaRepository.findAndCount({
      where: searchCondition.length
        ? searchCondition
        : { isPublic: true, portfolio: { isPublic: true, id: portfolioId } },
      relations: { portfolio: { user: true } },
      select: selectMedia,
      order: { createdAt: order },
      skip,
      take,
    });
    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: { page, take },
      itemCount,
    });
    const result = new PageDto(entities, pageMetaDto);

    // Cache the result
    await this.cacheManager.set(cacheKey, result);

    return result;
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

    // Clear cache after deleting a media file
    await this.cacheManager.clear();

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
