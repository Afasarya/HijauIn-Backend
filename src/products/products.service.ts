import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, FilterProductDto } from './dto';
import { ProductResponse, PaginatedProductsResponse } from './interfaces';
import { formatToRupiah } from '../utils/currency-formatter';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponse> {
    // Validate category exists
    const category = await this.prisma.productCategory.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
      },
    });

    return {
      ...product,
      priceFormatted: formatToRupiah(product.price),
    };
  }

  async findAll(filterDto: FilterProductDto): Promise<PaginatedProductsResponse> {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10 } = filterDto;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Search by category name or ID
      where.OR = [
        ...(where.OR || []),
        { categoryId: category },
        { category: { name: { contains: category, mode: 'insensitive' } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Count total records
    const total = await this.prisma.product.count({ where });

    // Get paginated data
    const products = await this.prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });

    return {
      data: products.map((product) => ({
        ...product,
        priceFormatted: formatToRupiah(product.price),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      ...product,
      priceFormatted: formatToRupiah(product.price),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponse> {
    // Check if product exists
    await this.findOne(id);

    // Validate category exists if categoryId is being updated
    if (updateProductDto.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });

    return {
      ...product,
      priceFormatted: formatToRupiah(product.price),
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if product exists
    await this.findOne(id);

    // Check if product has any transactions
    const transactionCount = await this.prisma.transaction.count({
      // Count transactions that include this product in their items
      where: { items: { some: { productId: id } } },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Cannot delete product with existing transactions. Consider updating stock to 0 instead.',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product successfully deleted' };
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.productCategory.findMany({
      select: { id: true, name: true },
    });

    return categories.map((c) => c.name);
  }
}
