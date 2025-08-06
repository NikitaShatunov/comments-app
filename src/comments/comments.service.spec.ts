import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { MediaService } from '../media/media.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentPageDto } from '../pagination/comments/comment-page.dto';
import { PageDto } from '../pagination/page.dto';
import { PageMetaDto } from '../pagination/page-meta.dto';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { Order } from 'src/pagination/page-options.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: Repository<Comment>;
  let usersService: UsersService;
  let mediaService: MediaService;
  let cacheManager: any;
  let eventEmitter: EventEmitter2;

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockMediaService = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    usersService = module.get<UsersService>(UsersService);
    mediaService = module.get<MediaService>(MediaService);
    cacheManager = module.get(CACHE_MANAGER);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a root comment', async () => {
      const createDto = {
        text: 'Test comment',
      } as CreateCommentDto;
      const userId = 1;
      const mockUser = { id: userId };
      const mockComment = {
        id: 1,
        text: createDto.text,
        user: mockUser,
        parent: null,
        media: null,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(createDto, userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(commentRepository.create).toHaveBeenCalledWith({
        text: createDto.text,
        user: mockUser,
        parent: null,
        media: null,
      });
      expect(commentRepository.save).toHaveBeenCalledWith(mockComment);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.created',
        mockComment,
      );
      expect(result).toEqual({
        message: `Comment with id ${mockComment.id} created successfully`,
        status: HttpStatus.OK,
      });
    });

    it('should create a reply comment and increment parent count', async () => {
      const createDto = {
        text: 'Test reply',
        parentCommentId: 1,
      } as CreateCommentDto;
      const userId = 1;
      const mockUser = { id: userId };
      const mockParentComment = {
        id: createDto.parentCommentId,
        user: mockUser,
      };
      const mockComment = {
        id: 2,
        text: createDto.text,
        user: mockUser,
        parent: mockParentComment,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockCommentRepository.findOne.mockResolvedValue(mockParentComment);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(createDto, userId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.parentCommentId },
        relations: { parent: true, user: true },
      });

      expect(commentRepository.increment).toHaveBeenCalledWith(
        { id: mockParentComment.id },
        'childrenCount',
        1,
      );

      expect(result).toEqual({
        message: `Comment with id ${mockComment.id} created successfully`,
        status: HttpStatus.OK,
      });
    });

    it('should create a comment with media', async () => {
      const createDto = {
        text: 'Test comment with media',
        imageId: 1,
      } as CreateCommentDto;
      const userId = 1;
      const mockUser = { id: userId };
      const mockMedia = { id: createDto.imageId };
      const mockComment = {
        id: 1,
        text: createDto.text,
        user: mockUser,
        media: mockMedia,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockMediaService.findOne.mockResolvedValue(mockMedia);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(createDto, userId);

      expect(mediaService.findOne).toHaveBeenCalledWith(createDto.imageId);
      expect(result).toEqual({
        message: `Comment with id ${mockComment.id} created successfully`,
        status: HttpStatus.OK,
      });
    });
  });

  describe('findRootCommentsWithChildrenPaginated', () => {
    it('should return cached result if available', async () => {
      const pageOptions: CommentPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
        imageId: 1,
      };
      const cachedResult = new PageDto(
        [],
        new PageMetaDto({ pageOptionsDto: pageOptions, itemCount: 0 }),
      );

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result =
        await service.findRootCommentsWithChildrenPaginated(pageOptions);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(commentRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should return paginated root comments', async () => {
      const pageOptions: CommentPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
        imageId: 1,
      };
      const mockComments = [{ id: 1, text: 'Test comment' }];
      const itemCount = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockCommentRepository.findAndCount.mockResolvedValue([
        mockComments,
        itemCount,
      ]);

      const result =
        await service.findRootCommentsWithChildrenPaginated(pageOptions);

      expect(commentRepository.findAndCount).toHaveBeenCalledWith({
        where: { media: { id: pageOptions.imageId, isPublic: true } },
        relations: { user: true },
        select: expect.any(Object),
        order: { createdAt: pageOptions.order },
        skip: 0,
        take: pageOptions.take,
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toEqual(mockComments);
    });
  });

  describe('findChildrenByParentId', () => {
    it('should return cached children comments if available', async () => {
      const parentId = 1;
      const page = 1;
      const take = 5;
      const cachedResult = new PageDto(
        [],
        new PageMetaDto({ pageOptionsDto: { page, take }, itemCount: 0 }),
      );

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findChildrenByParentId(parentId, page, take);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(commentRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should return paginated children comments', async () => {
      const parentId = 1;
      const page = 1;
      const take = 5;
      const mockComments = [
        { id: 2, text: 'Test reply', parent: { id: parentId } },
      ];
      const itemCount = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockCommentRepository.findAndCount.mockResolvedValue([
        mockComments,
        itemCount,
      ]);

      const result = await service.findChildrenByParentId(parentId, page, take);

      expect(commentRepository.findAndCount).toHaveBeenCalledWith({
        where: { parent: { id: parentId, media: { isPublic: true } } },
        relations: { user: true },
        select: expect.any(Object),
        skip: 0,
        take,
        order: { createdAt: 'ASC' },
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toEqual(mockComments);
    });
  });

  describe('findOne', () => {
    it('should return a comment', async () => {
      const commentId = 1;
      const mockComment = {
        id: commentId,
        text: 'Test comment',
        user: { id: 1 },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne(commentId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: commentId },
        relations: { parent: true, user: true },
      });

      expect(result).toEqual(mockComment);
    });

    it('should verify user ownership when userId provided', async () => {
      const commentId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockComment = {
        id: commentId,
        text: 'Test comment',
        user: { id: userId },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockUsersService.findOne.mockImplementation(async (id) => ({ id }));

      // Should not throw for owner
      await expect(service.findOne(commentId, userId)).resolves.toEqual(
        mockComment,
      );

      // Should throw for non-owner
      await expect(service.findOne(commentId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a comment and decrement parent count when comment has parent', async () => {
      const commentId = 1;
      const userId = 1;
      const parentId = 2;
      const mockComment = {
        id: commentId,
        user: { id: userId },
        parent: { id: parentId },
      };

      // Mock findOne to verify ownership
      mockCommentRepository.findOne.mockImplementation(async (options) => {
        if (options.where.id === commentId) {
          return mockComment;
        }
        return null;
      });

      mockUsersService.findOne.mockResolvedValue({ id: userId });
      mockCommentRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(commentId, userId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: commentId },
        relations: { parent: true, user: true },
      });
      expect(commentRepository.delete).toHaveBeenCalledWith(commentId);
      expect(commentRepository.decrement).toHaveBeenCalledWith(
        { id: parentId },
        'childrenCount',
        1,
      );
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.deleted', {
        id: commentId,
      });
      expect(result).toEqual({
        message: 'Comment deleted successfully',
        status: HttpStatus.OK,
      });
    });

    it('should delete a comment without decrementing when no parent exists', async () => {
      const commentId = 1;
      const userId = 1;
      const mockComment = {
        id: commentId,
        user: { id: userId },
        parent: null,
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockUsersService.findOne.mockResolvedValue({ id: userId });
      mockCommentRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(commentId, userId);

      expect(commentRepository.findOne).toHaveBeenCalled();
      expect(commentRepository.delete).toHaveBeenCalledWith(commentId);
      expect(commentRepository.decrement).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Comment deleted successfully',
        status: HttpStatus.OK,
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const commentId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockComment = {
        id: commentId,
        user: { id: userId },
      };

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockUsersService.findOne.mockResolvedValue({ id: otherUserId });

      await expect(service.remove(commentId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
