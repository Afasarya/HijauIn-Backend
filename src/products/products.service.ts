import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, FilterProductDto } from './dto';
import { ProductResponse, PaginatedProductsResponse } from './interfaces';
import { formatToRupiah } from '../utils/currency-formatter';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponse> {
    const product = await this.prisma.product.create({
      data: createProductDto,
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
      where.category = { contains: category, mode: 'insensitive' };
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

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
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
      where: { productId: id },
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
    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return products.map((p) => p.category);
  }
}
