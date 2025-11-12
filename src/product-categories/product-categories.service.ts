import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createProductCategoryDto: CreateProductCategoryDto) {
    // Check if category name already exists
    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { name: createProductCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }

    const category = await this.prisma.productCategory.create({
      data: createProductCategoryDto,
    });

    return {
      message: 'Product category created successfully',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.prisma.productCategory.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Product categories retrieved successfully',
      data: categories,
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            image_url: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    return {
      message: 'Product category retrieved successfully',
      data: category,
    };
  }

  async update(id: string, updateProductCategoryDto: UpdateProductCategoryDto) {
    // Check if category exists
    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts
    const newName = updateProductCategoryDto.name as string | undefined;
    if (newName && newName !== existingCategory.name) {
      const nameConflict = await this.prisma.productCategory.findUnique({
        where: { name: newName },
      });

      if (nameConflict) {
        throw new ConflictException('Category name already exists');
      }
    }

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: updateProductCategoryDto,
    });

    return {
      message: 'Product category updated successfully',
      data: category,
    };
  }

  async remove(id: string) {
    // Check if category exists
    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    // Check if category has any products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} existing product(s). Please move or delete the products first.`,
      );
    }

    await this.prisma.productCategory.delete({
      where: { id },
    });

    return {
      message: 'Product category deleted successfully',
    };
  }
}
