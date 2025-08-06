import { Test, TestingModule } from '@nestjs/testing';
import { PortfoliosService } from './portfolios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { UsersService } from '../users/users.service';
import { MediaService } from '../media/media.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Media } from '../media/entities/media.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Not, Repository } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PortfolioPageDto } from '../pagination/portfolios/portfolio-page.dto';
import { PageMetaDto } from '../pagination/page-meta.dto';
import { Order } from 'src/pagination/page-options.dto';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let portfolioRepository: Repository<Portfolio>;
  let usersService: UsersService;
  let mediaService: MediaService;
  let cacheManager: any;

  const mockPortfolioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockPortfolioRepository,
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
      ],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    usersService = module.get<UsersService>(UsersService);
    mediaService = module.get<MediaService>(MediaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a portfolio without images', async () => {
      const createDto: CreatePortfolioDto = {
        title: 'Test Portfolio',
        description: 'Test Description',
      };
      const userId = 1;

      const mockUser = { id: userId };
      const mockPortfolio = {
        ...createDto,
        user: mockUser,
        images: [],
        id: 1,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockPortfolioRepository.create.mockReturnValue(mockPortfolio);
      mockPortfolioRepository.save.mockResolvedValue(mockPortfolio);

      const result = await service.create(createDto, userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(portfolioRepository.create).toHaveBeenCalledWith({
        ...createDto,
        user: mockUser,
        images: [],
      });
      expect(portfolioRepository.save).toHaveBeenCalledWith(mockPortfolio);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual(mockPortfolio);
    });

    it('should create a portfolio with images', async () => {
      const createDto: CreatePortfolioDto = {
        title: 'Test Portfolio',
        description: 'Test Description',
        imagesIds: [1, 2],
      };
      const userId = 1;

      const mockUser = { id: userId };
      const mockImages = [
        { id: 1, portfolio: null },
        { id: 2, portfolio: null },
      ];
      const mockPortfolio = {
        title: createDto.title,
        description: createDto.description,
        user: mockUser,
        images: mockImages,
        id: 1,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockMediaService.findOne
        .mockResolvedValueOnce(mockImages[0])
        .mockResolvedValueOnce(mockImages[1]);
      mockPortfolioRepository.create.mockReturnValue(mockPortfolio);
      mockPortfolioRepository.save.mockResolvedValue(mockPortfolio);

      const result = await service.create(createDto, userId);

      expect(mediaService.findOne).toHaveBeenCalledWith(1);
      expect(mediaService.findOne).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockPortfolio);
    });

    it('should throw BadRequestException if image is already in a portfolio', async () => {
      const createDto: CreatePortfolioDto = {
        title: 'Test Portfolio',
        description: 'Test Description',
        imagesIds: [1],
      };
      const userId = 1;

      const mockUser = { id: userId };
      const mockImage = { id: 1, portfolio: { id: 2 } };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockMediaService.findOne.mockResolvedValue(mockImage);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return cached result if available', async () => {
      const pageOptions: PortfolioPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
      };
      const userId = 1;
      const cachedResult = new PageDto(
        [],
        new PageMetaDto({ pageOptionsDto: pageOptions, itemCount: 0 }),
      );

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(pageOptions, userId);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(portfolioRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should return paginated portfolios', async () => {
      const pageOptions: PortfolioPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
      };
      const userId = 1;
      const mockPortfolios = [{ id: 1, isPublic: true }];
      const itemCount = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockPortfolioRepository.findAndCount.mockResolvedValue([
        mockPortfolios,
        itemCount,
      ]);

      const result = await service.findAll(pageOptions, userId);

      expect(portfolioRepository.findAndCount).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toEqual(mockPortfolios);
      expect(result.meta.itemCount).toEqual(itemCount);
    });

    it('should filter out user own portfolios when searching', async () => {
      const pageOptions: PortfolioPageDto = {
        page: 1,
        take: 10,
        order: Order.ASC,
        search: 'test',
      };
      const userId = 1;

      await service.findAll(pageOptions, userId);

      expect(portfolioRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.arrayContaining([
          expect.objectContaining({ user: { id: expect.anything() } }),
        ]),
        relations: { user: true },
        select: expect.any(Object),
        order: { createdAt: pageOptions.order },
        skip: 0,
        take: pageOptions.take,
      });
    });
  });

  describe('findAllOwnPortfolios', () => {
    it('should return all portfolios for a user', async () => {
      const userId = 1;
      const mockPortfolios = [
        { id: 1, user: { id: userId } },
        { id: 2, user: { id: userId } },
      ];

      mockPortfolioRepository.find.mockResolvedValue(mockPortfolios);

      const result = await service.findAllOwnPortfolios(userId);

      expect(portfolioRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: { user: true },
        select: expect.any(Object),
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockPortfolios);
    });
  });

  describe('findOne', () => {
    it('should return a portfolio', async () => {
      const portfolioId = 1;
      const mockPortfolio = {
        id: portfolioId,
        title: 'Test Portfolio',
        description: 'Test Description',
        createdAt: new Date(),
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);

      const result = await service.findOne(portfolioId);

      expect(portfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: portfolioId },
        relations: { user: true, images: false },
        select: expect.any(Object), // Match any select object
      });
      expect(result).toEqual(mockPortfolio);
    });

    it('should throw error if portfolio not found', async () => {
      const portfolioId = 1;

      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(portfolioId)).rejects.toThrow(
        `There is no portfolio with id: ${portfolioId}`,
      );
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      const portfolioId = 1;
      const userId = 1;
      const updateDto: UpdatePortfolioDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        isPublic: false,
      };
      const mockPortfolio = {
        id: portfolioId,
        user: { id: userId },
        title: 'Original Title',
        description: 'Original Description',
        isPublic: true,
      };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioRepository.save.mockResolvedValue({
        ...mockPortfolio,
        ...updateDto,
      });

      const result = await service.update(portfolioId, updateDto, userId);

      expect(portfolioRepository.save).toHaveBeenCalled();
      expect(result.title).toEqual(updateDto.title);
      expect(result.description).toEqual(updateDto.description);
      expect(result.isPublic).toEqual(updateDto.isPublic);
    });

    it('should throw ForbiddenException if user does not own portfolio', async () => {
      const portfolioId = 1;
      const userId = 1;
      const otherUserId = 2;
      const updateDto: UpdatePortfolioDto = {
        title: 'Updated Title',
      };
      const mockPortfolio = {
        id: portfolioId,
        user: { id: otherUserId },
      };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);

      await expect(
        service.update(portfolioId, updateDto, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a portfolio', async () => {
      const portfolioId = 1;
      const userId = 1;
      const mockPortfolio = {
        id: portfolioId,
        user: { id: userId },
      };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioRepository.remove.mockResolvedValue(mockPortfolio);

      const result = await service.remove(portfolioId, userId);

      expect(portfolioRepository.remove).toHaveBeenCalledWith(mockPortfolio);
      expect(cacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual({
        message: `Portfolio with id: ${portfolioId} was deleted successfully`,
        status: 200,
      });
    });

    it('should throw ForbiddenException if user does not own portfolio', async () => {
      const portfolioId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockPortfolio = {
        id: portfolioId,
        user: { id: otherUserId },
      };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);

      await expect(service.remove(portfolioId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addImage', () => {
    it('should add an image to portfolio', async () => {
      const portfolioId = 1;
      const imageId = 1;
      const userId = 1;
      const mockPortfolio = {
        id: portfolioId,
        user: { id: userId },
        images: [],
      };
      const mockImage = { id: imageId, portfolio: null };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockMediaService.findOne.mockResolvedValue(mockImage);
      mockPortfolioRepository.save.mockResolvedValue({
        ...mockPortfolio,
        images: [mockImage],
      });

      const result = await service.addImage(portfolioId, imageId, userId);

      expect(mediaService.findOne).toHaveBeenCalledWith(imageId);
      expect(portfolioRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: `Image with id: ${imageId} was added to portfolio with id: ${portfolioId}`,
        status: 200,
      });
    });

    it('should throw BadRequestException if image is already in a portfolio', async () => {
      const portfolioId = 1;
      const imageId = 1;
      const userId = 1;
      const mockPortfolio = {
        id: portfolioId,
        user: { id: userId },
        images: [],
      };
      const mockImage = { id: imageId, portfolio: { id: 2 } };

      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockMediaService.findOne.mockResolvedValue(mockImage);

      await expect(
        service.addImage(portfolioId, imageId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ensureUserOwnsPortfolio', () => {
    it('should not throw if user owns portfolio', () => {
      const portfolio = { user: { id: 1 } };
      const userId = 1;

      expect(() =>
        service['ensureUserOwnsPortfolio'](portfolio as Portfolio, userId),
      ).not.toThrow();
    });

    it('should throw ForbiddenException if user does not own portfolio', () => {
      const portfolio = { user: { id: 1 } };
      const userId = 2;

      expect(() =>
        service['ensureUserOwnsPortfolio'](portfolio as Portfolio, userId),
      ).toThrow(ForbiddenException);
    });
  });

  describe('validateImageNotInPortfolio', () => {
    it('should return image if not in portfolio', async () => {
      const imageId = 1;
      const mockImage = { id: imageId, portfolio: null };

      mockMediaService.findOne.mockResolvedValue(mockImage);

      const result = await service['validateImageNotInPortfolio'](imageId);

      expect(result).toEqual(mockImage);
    });

    it('should throw BadRequestException if image is in portfolio', async () => {
      const imageId = 1;
      const mockImage = { id: imageId, portfolio: { id: 2 } };

      mockMediaService.findOne.mockResolvedValue(mockImage);

      await expect(
        service['validateImageNotInPortfolio'](imageId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
