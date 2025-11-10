import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ============================================
  // ADMIN ROUTES (Protected)
  // ============================================

  /**
   * Create a new article (Admin only)
   * POST /articles
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createArticleDto: CreateArticleDto,
    @GetUser('id') userId: string,
  ) {
    return this.articlesService.create(createArticleDto, userId);
  }

  /**
   * Get all articles with search and pagination (Admin)
   * GET /articles?search=keyword&page=1&limit=10
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.articlesService.findAll(search, page, limit);
  }

  /**
   * Get single article by ID (Admin)
   * GET /articles/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  /**
   * Update article (Admin only)
   * PATCH /articles/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  /**
   * Delete article (Admin only)
   * DELETE /articles/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

@Controller('public/articles')
export class PublicArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Get all published articles (Public)
   * GET /public/articles?search=keyword&page=1&limit=10
   */
  @Get()
  findAllPublic(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.articlesService.findAllPublic(search, page, limit);
  }

  /**
   * Get article by slug (Public)
   * GET /public/articles/:slug
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }
}
