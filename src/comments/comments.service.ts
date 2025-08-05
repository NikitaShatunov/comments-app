import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { validateGetById } from 'src/common/helpers/validateGetById';
import { Comment } from './entities/comment.entity';
import { CommentPageDto } from 'src/pagination/comments/comment-page.dto';
import { PageDto } from 'src/pagination/page.dto';
import { PageMetaDto } from 'src/pagination/page-meta.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { MediaService } from 'src/media/media.service';
import { selectComment } from 'src/common/selects/selext-comment';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: number) {
    const { parentCommentId, text, imageId, ...otherDto } = createCommentDto;
    const parent = parentCommentId ? await this.findOne(parentCommentId) : null;
    const user = await this.userService.findOne(userId);
    const media = imageId ? await this.mediaService.findOne(imageId) : null;

    const comment = this.commentRepository.create({
      parent,
      media,
      user,
      text,
      ...otherDto,
    });

    const savedComment = await this.commentRepository.save(comment);

    //need to show the children count in the parent comment
    if (savedComment.parent) {
      await this.commentRepository.increment(
        { id: savedComment.parent.id },
        'childrenCount',
        1,
      );
    }
    await this.cacheManager.clear();

    return { message: 'Comment created successfully', status: HttpStatus.OK };
  }

  // Main method for root comments
  async findRootCommentsWithChildrenPaginated(
    pageOptionsDto: CommentPageDto,
  ): Promise<PageDto<Comment>> {
    const { page, take, imageId, order } = pageOptionsDto;
    const skip = (page - 1) * take;

    const cacheKey = `root_comments_page_${page}_take_${take}_imageId_${imageId}_order_${order}`;
    // Check if the data is already cached
    const cached = await this.cacheManager.get<PageDto<Comment>>(cacheKey);
    if (cached) {
      return cached;
    }

    const [comments, itemCount] = await this.commentRepository.findAndCount({
      where: { media: { id: imageId } },
      relations: { user: true },
      select: selectComment,
      order: { createdAt: order },
      skip,
      take,
    });

    const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });
    const result = new PageDto(comments, pageMetaDto);

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findChildrenByParentId(
    parentId: number,
    page: number = 1,
    take: number = 5,
  ): Promise<PageDto<Comment>> {
    const skip = (page - 1) * take;
    const cacheKey = `children_comments_parent_${parentId}_page_${page}_take_${take}`;

    const cached = await this.cacheManager.get<PageDto<Comment>>(cacheKey);
    if (cached) {
      return cached;
    }
    const [children, itemCount] = await this.commentRepository.findAndCount({
      where: { parent: { id: parentId } },
      relations: { user: true },
      select: selectComment,
      skip,
      take,
      order: { createdAt: 'ASC' },
    });

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: { page, take },
      itemCount,
    });

    const result = new PageDto(children, pageMetaDto);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async findOne(id: number, userId?: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'media', 'parent'],
    });
    validateGetById(id, comment, 'Comment');

    if (userId) {
      //find user to validate if the user is the owner of the comment
      const user = await this.userService.findOne(userId);

      if (comment.user?.id !== user.id) {
        throw new ForbiddenException('You are not the owner of this comment');
      }
    }
    return comment;
  }

  async remove(id: number, userId: number) {
    const comment = await this.findOne(id, userId);
    await this.commentRepository.delete(id);
    await this.cacheManager.clear();

    return { message: 'Comment deleted successfully', status: HttpStatus.OK };
  }
}
