import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { Repository } from 'typeorm';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { promises as fs } from 'fs';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaPageDto } from '../pagination/media/media-page.dto';
import { PageDto } from '../pagination/page.dto';
import { PageMetaDto } from '../pagination/page-meta.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Order } from 'src/pagination/page-options.dto';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepository: Repository<Media>;
  let entityManager: EntityManager;
  let cacheManager: any;

  const mockMediaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntityManager = {
    // Add any needed methods
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  };

  // Mock fs promises
  jest.mock('fs', () => ({
    promises: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn(),
      mkdir: jest.fn(),
    },
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: mockMediaRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    mediaRepository = module.get<Repository<Media>>(getRepositoryToken(Media));
    entityManager = module.get<EntityManager>(EntityManager);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveFile', () => {
    it('should save a file and create media record', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      const createDto: CreateMediaDto = {
        name: 'Test Media',
        description: 'Test Description',
      };
      const mockMedia = {
        ...createDto,
        path: './media/abc123-test.jpg',
        id: 1,
      };

      mockMediaRepository.create.mockReturnValue(mockMedia);
      mockMediaRepository.save.mockResolvedValue(mockMedia);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await service.saveFile(mockFile, createDto);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(mediaRepository.create).toHaveBeenCalledWith({
        ...createDto,
        path: expect.any(String),
      });
      expect(mediaRepository.save).toHaveBeenCalledWith(mockMedia);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual(mockMedia);
    });

    it('should throw error when file saving fails', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      const createDto: CreateMediaDto = {
        name: 'Test Media',
        description: 'Test Description',
      };

      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Write failed'));

      await expect(service.saveFile(mockFile, createDto)).rejects.toThrow(
        'Failed to save file',
      );
    });
  });

  describe('findAll', () => {
    it('should return cached result if available', async () => {
      const pageOptions: MediaPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
      };
      const cachedResult = new PageDto(
        [],
        new PageMetaDto({ pageOptionsDto: pageOptions, itemCount: 0 }),
      );

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(pageOptions);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(mediaRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should return paginated media with search', async () => {
      const pageOptions: MediaPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
        search: 'test',
        portfolioId: 1,
      };
      const mockMedia = [{ id: 1, isPublic: true }];
      const itemCount = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockMediaRepository.findAndCount.mockResolvedValue([
        mockMedia,
        itemCount,
      ]);

      const result = await service.findAll(pageOptions);

      expect(mediaRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.arrayContaining([
          expect.objectContaining({
            name: expect.anything(),
            isPublic: true,
            portfolio: { isPublic: true, id: pageOptions.portfolioId },
          }),
        ]),
        relations: { portfolio: { user: true } },
        select: expect.any(Object),
        order: { createdAt: pageOptions.order },
        skip: 0,
        take: pageOptions.take,
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toEqual(mockMedia);
    });

    it('should return public media when no search provided', async () => {
      const pageOptions: MediaPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
        portfolioId: 1,
      };

      await service.findAll(pageOptions);

      expect(mediaRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          isPublic: true,
          portfolio: { isPublic: true, id: pageOptions.portfolioId },
        },
        relations: { portfolio: { user: true } },
        select: expect.any(Object),
        order: { createdAt: pageOptions.order },
        skip: 0,
        take: pageOptions.take,
      });
    });
  });

  describe('getMedia', () => {
    it('should return media file', async () => {
      const mediaId = 1;
      const mockMedia = {
        id: mediaId,
        path: './media/test.jpg',
        name: 'test.jpg',
        description: 'Test description',
        isPublic: true,

        createdAt: new Date(),
        updatedAt: new Date(),
        portfolio: null,
      };
      const mockFileBuffer = Buffer.from('test');

      jest.spyOn(service, 'findOne').mockResolvedValue(mockMedia);
      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileBuffer);

      const result = await service.getMedia(mediaId);

      expect(service.findOne).toHaveBeenCalledWith(mediaId);
      expect(fs.readFile).toHaveBeenCalledWith(mockMedia.path);
      expect(result).toEqual({
        fileBuffer: mockFileBuffer,
        name: mockMedia.name,
      });
    });

    it('should throw NotFoundException when file not found', async () => {
      const mediaId = 1;
      const mockMedia = {
        id: mediaId,
        path: './media/nonexistent.jpg',
        name: 'nonexistent.jpg',
        description: 'Test description',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        portfolio: null,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockMedia);
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      await expect(service.getMedia(mediaId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return media by id', async () => {
      const mediaId = 1;
      const mockMedia = { id: mediaId };

      mockMediaRepository.findOne.mockResolvedValue(mockMedia);

      const result = await service.findOne(mediaId);

      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { id: mediaId },
        relations: { portfolio: { user: true } },
      });
      expect(result).toEqual(mockMedia);
    });

    it('should verify user ownership when userId provided', async () => {
      const mediaId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockMedia = {
        id: mediaId,
        portfolio: { user: { id: userId } },
      };

      mockMediaRepository.findOne.mockResolvedValue(mockMedia);

      // Should not throw for owner
      await expect(service.findOne(mediaId, userId)).resolves.toEqual(
        mockMedia,
      );

      // Should throw for non-owner
      await expect(service.findOne(mediaId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete media file and record', async () => {
      const mediaId = 1;
      const mockMedia = {
        id: mediaId,
        path: './media/test.jpg',
        portfolio: null,
      } as Media;

      jest.spyOn(service, 'findOne').mockImplementation(async (id, userId) => {
        if (userId) throw new ForbiddenException();
        return mockMedia;
      });

      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
      mockMediaRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mediaId);

      expect(service.findOne).toHaveBeenCalledWith(mediaId, undefined);
      expect(fs.unlink).toHaveBeenCalledWith(mockMedia.path);
      expect(mediaRepository.delete).toHaveBeenCalledWith(mediaId);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual({
        message: `Media with id: ${mediaId} was deleted successfully`,
        status: 200,
      });
    });

    it('should verify user ownership when userId provided', async () => {
      const mediaId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockMedia = {
        id: mediaId,
        path: './media/test.jpg',
        portfolio: { user: { id: userId } },
      } as Media;

      jest
        .spyOn(service, 'findOne')
        .mockImplementation(async (id, checkUserId) => {
          if (checkUserId && checkUserId !== mockMedia.portfolio.user.id) {
            throw new ForbiddenException();
          }
          return mockMedia;
        });

      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
      mockMediaRepository.delete.mockResolvedValue({ affected: 1 });

      // Should work for owner
      await expect(service.remove(mediaId, userId)).resolves.toBeDefined();

      // Should throw for non-owner
      await expect(service.remove(mediaId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when file deletion fails', async () => {
      const mediaId = 1;
      const mockMedia = {
        id: mediaId,
        path: './media/test.jpg',
        portfolio: null,
        description: 'Test description',
        isPublic: true,
        name: 'test.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockMedia);
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('Delete failed'));

      await expect(service.remove(mediaId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('ensureMediaDirectoryExists', () => {
    it('should create directory if not exists', async () => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

      await service['ensureMediaDirectoryExists']();

      expect(fs.mkdir).toHaveBeenCalledWith(service['mediaDirectory'], {
        recursive: true,
      });
    });

    it('should throw BadRequestException when directory creation fails', async () => {
      jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('Creation failed'));

      await expect(service['ensureMediaDirectoryExists']()).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
