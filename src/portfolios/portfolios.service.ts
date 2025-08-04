import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
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
        const image = await this.mediaService.findOne(imageId);
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
      searchCondition.push(
        { title: Like(`%${search}%`), isPublic: true },
        { description: Like(`%${search}%`), isPublic: true },
        { user: { name: Like(`%${search}%`) }, isPublic: true },
        { user: { email: Like(`%${search}%`) }, isPublic: true },
      );
    }

    const [entities, itemCount] = await this.portfolioRepository.findAndCount({
      where: searchCondition.length ? searchCondition : { isPublic: true },
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

  async findOne(id: number) {
    isIdNumber(id, 'portfolio');
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['user'],
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
    if (portfolio.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this portfolio',
      );
    }
    portfolio.title = updatePortfolioDto.title ?? portfolio.title;
    portfolio.description =
      updatePortfolioDto.description ?? portfolio.description;
    portfolio.isPublic = updatePortfolioDto.isPublic ?? portfolio.isPublic;
    return await this.portfolioRepository.save(portfolio);
  }

  async remove(id: number, userId: number) {
    const portfolio = await this.findOne(id);
    if (userId && portfolio.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this portfolio',
      );
    }
    await this.portfolioRepository.remove(portfolio);

    // Clear cache after deleting a portfolio
    await this.cacheManager.clear();

    return {
      message: `Portfolio with id: ${id} was deleted successfully`,
      status: HttpStatus.OK,
    };
  }
}
