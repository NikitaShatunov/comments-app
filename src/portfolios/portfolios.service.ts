import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { Media } from 'src/media/entities/media.entity';
import { MediaService } from 'src/media/media.service';
import { isIdNumber } from 'src/common/helpers/isIdNumber';
import { validateGetById } from 'src/common/helpers/validateGetById';
import { PortfolioPageDto } from 'src/pagination/portfolios/portfolio-page.dto';
import { PageDto } from 'src/pagination/page.dto';
import { PageMetaDto } from 'src/pagination/page-meta.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { selectPortfolio } from 'src/common/selects/select-portfolio';

@Injectable()
export class PortfoliosService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}
  async create(createPortfolioDto: CreatePortfolioDto, userId: number) {
    const { imagesIds, ...otherDto } = createPortfolioDto;
    const user = await this.usersService.findOne(userId);
    const images: Media[] = [];
    if (imagesIds && imagesIds.length) {
      for (const imageId of imagesIds) {
        const image = await this.validateImageNotInPortfolio(imageId);
        images.push(image);
      }
    }
    const portfolio = this.portfolioRepository.create({
      ...otherDto,
      user,
      images,
    });

    // Clear cache after creating a new portfolio
    await this.cacheManager.clear();

    return this.portfolioRepository.save(portfolio);
  }

  async findAll(
    profilePageOptionsDto: PortfolioPageDto,
    userId: number,
  ): Promise<PageDto<Portfolio>> {
    const { search, page, order, take } = profilePageOptionsDto;

    const cacheKey = `portfolio_page_${page}_take_${take}_${order}_search_${search}`;
    // Check if the data is already cached
    const cached = await this.cacheManager.get<PageDto<Portfolio>>(cacheKey);
    if (cached) {
      return cached;
    }
    const skip = (page - 1) * take;
    const searchCondition: FindOptionsWhere<Portfolio>[] = [];
    if (search) {
      //we prevent the user from searching for their own portfolio
      searchCondition.push(
        {
          title: Like(`%${search}%`),
          isPublic: true,
          user: { id: Not(userId) },
        },
        {
          description: Like(`%${search}%`),
          isPublic: true,
          user: { id: Not(userId) },
        },
        {
          user: { name: Like(`%${search}%`) },
          isPublic: true,
          id: Not(userId),
        },
        {
          user: { email: Like(`%${search}%`) },
          isPublic: true,
          id: Not(userId),
        },
      );
    }

    const [entities, itemCount] = await this.portfolioRepository.findAndCount({
      where: searchCondition.length
        ? searchCondition
        : { isPublic: true, user: { id: Not(userId) } },
      relations: { user: true },
      select: selectPortfolio,
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

  async findAllOwnPortfolios(userId: number) {
    const portfolios = await this.portfolioRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
      select: selectPortfolio,
      order: { createdAt: 'DESC' },
    });
    return portfolios;
  }

  /**
   * Finds one portfolio by id.
   * @param id Id of the portfolio.
   * @param isService If true, loads images relation.
   * @returns The found portfolio.
   */
  async findOne(id: number, isService: boolean = false) {
    isIdNumber(id, 'portfolio');
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: { user: true, images: isService },
    });
    validateGetById(id, portfolio, 'portfolio');
    return portfolio;
  }

  async update(
    id: number,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: number,
  ) {
    const portfolio = await this.findOne(id);
    this.ensureUserOwnsPortfolio(portfolio, userId);

    portfolio.title = updatePortfolioDto.title ?? portfolio.title;
    portfolio.description =
      updatePortfolioDto.description ?? portfolio.description;
    portfolio.isPublic = updatePortfolioDto.isPublic ?? portfolio.isPublic;
    return await this.portfolioRepository.save(portfolio);
  }

  async remove(id: number, userId: number) {
    const portfolio = await this.findOne(id);
    this.ensureUserOwnsPortfolio(portfolio, userId);

    await this.portfolioRepository.remove(portfolio);

    // Clear cache after deleting a portfolio
    await this.cacheManager.clear();

    return {
      message: `Portfolio with id: ${id} was deleted successfully`,
      status: HttpStatus.OK,
    };
  }

  async addImage(id: number, imageId: number, userId: number) {
    const portfolio = await this.findOne(id, true);
    this.ensureUserOwnsPortfolio(portfolio, userId);

    const image = await this.validateImageNotInPortfolio(imageId);

    portfolio.images.push(image);
    await this.portfolioRepository.save(portfolio);
    return {
      message: `Image with id: ${imageId} was added to portfolio with id: ${id}`,
      status: HttpStatus.OK,
    };
  }

  //=========================================ERROR HANDLERS==========================================

  /**
   * Validates that a media image is not already assigned to a portfolio.
   * Throws BadRequestException if it is.
   * @param imageId - The ID of the image to validate.
   * @returns The Media entity if the image is not in a portfolio.
   */
  private async validateImageNotInPortfolio(imageId: number): Promise<Media> {
    const image = await this.mediaService.findOne(imageId);
    if (image.portfolio) {
      throw new BadRequestException(
        `Image with id: ${imageId} is already added to another portfolio`,
      );
    }
    return image;
  }

  /**
   * Ensures the user has access to modify the given portfolio.
   * @param portfolio - The portfolio to check.
   * @param userId - The ID of the user trying to modify the portfolio.
   * Throws ForbiddenException if not allowed.
   */
  private ensureUserOwnsPortfolio(portfolio: Portfolio, userId: number): void {
    if (portfolio.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this portfolio',
      );
    }
  }
}
