import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioPageDto } from 'src/pagination/portfolios/portfolio-page.dto';
import { PageDto } from 'src/pagination/page.dto';
import { Portfolio } from './entities/portfolio.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/local-auth/guards/jwt.guard';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post()
  create(@Body() createPortfolioDto: CreatePortfolioDto, @Req() req: any) {
    const { id: userId } = req?.user?.user;
    return this.portfoliosService.create(createPortfolioDto, userId);
  }

  @Get()
  findAll(
    @Query() profilePageOptionsDto: PortfolioPageDto,
  ): Promise<PageDto<Portfolio>> {
    return this.portfoliosService.findAll(profilePageOptionsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portfoliosService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @Req() req: any,
  ) {
    const { id: userId } = req?.user?.user;
    return this.portfoliosService.update(+id, updatePortfolioDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const { id: userId } = req?.user?.user;
    return this.portfoliosService.remove(+id, userId);
  }
}
