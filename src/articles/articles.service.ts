import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.article.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Create a new article (Admin only)
   */
  async create(createArticleDto: CreateArticleDto, authorId: string) {
    const baseSlug = this.generateSlug(createArticleDto.title);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    return this.prisma.article.create({
      data: {
        ...createArticleDto,
        slug: uniqueSlug,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            nama_panggilan: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  /**
   * Get all articles with search and pagination (Admin)
   */
  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { content: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nama_panggilan: true,
              avatar_url: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all articles (Public) - with search and pagination
   */
  async findAllPublic(search?: string, page: number = 1, limit: number = 10) {
    return this.findAll(search, page, limit);
  }

  /**
   * Get single article by ID (Admin)
   */
  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nama_panggilan: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return article;
  }

  /**
   * Get article by slug (Public)
   */
  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            nama_panggilan: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    return article;
  }

  /**
   * Update article (Admin only)
   */
  async update(id: string, updateArticleDto: UpdateArticleDto) {
    // Check if article exists
    await this.findOne(id);

    // If title is being updated, regenerate slug
    let slug: string | undefined;
    if (updateArticleDto.title !== undefined) {
      const baseSlug = this.generateSlug(updateArticleDto.title);
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    return this.prisma.article.update({
      where: { id },
      data: {
        ...updateArticleDto,
        ...(slug && { slug }),
      },
      include: {
        author: {
          select: {
            id: true,
            nama_panggilan: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  /**
   * Delete article (Admin only)
   */
  async remove(id: string) {
    // Check if article exists
    await this.findOne(id);

    await this.prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
  }
}
