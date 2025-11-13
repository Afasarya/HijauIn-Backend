import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { WasteLocationsService } from './waste-locations.service';
import { CreateWasteLocationDto, UpdateWasteLocationDto, NearbyQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { WasteCategory } from '../../generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * ============================================
 * WASTE LOCATIONS CONTROLLER - LOKA (Tong Sampah)
 * ============================================
 * 
 * Konteks: TONG SAMPAH / TEMPAT SAMPAH
 * - Image: 1 foto tong sampah
 * - Description: Deskripsi singkat lokasi tong sampah
 * - Categories: Multiple (misal: satu tong bisa untuk ORGANIK + ANORGANIK)
 * 
 * ADMIN ENDPOINTS (require JWT + ADMIN role):
 * - POST   /waste-locations          → Tambah lokasi tong sampah
 * - POST   /waste-locations/upload   → Upload image untuk tong sampah
 * - GET    /waste-locations          → Lihat semua lokasi (admin view)
 * - GET    /waste-locations/:id      → Detail lokasi tong sampah
 * - PATCH  /waste-locations/:id      → Update lokasi tong sampah
 * - DELETE /waste-locations/:id      → Hapus lokasi tong sampah
 * 
 * PUBLIC ENDPOINTS (no auth required):
 * - GET    /loka                      → Lihat semua lokasi tong sampah
 * - GET    /loka/nearby               → Cari tong sampah terdekat
 * 
 * ============================================
 * POSTMAN EXAMPLES:
 * ============================================
 * 
 * 1. CREATE LOKASI TONG SAMPAH (ADMIN)
 * POST http://localhost:3000/waste-locations
 * Headers: { "Authorization": "Bearer <admin_jwt_token>" }
 * Body:
 * {
 *   "name": "Tong Sampah Depan Gedung A",
 *   "description": "Tong sampah warna hijau dan kuning untuk organik dan anorganik",
 *   "address": "Gedung A, Kampus UMP, Purwokerto",
 *   "latitude": -7.4291,
 *   "longitude": 109.2320,
 *   "categories": ["ORGANIK", "ANORGANIK"],
 *   "image_url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b"
 * }
 * 
 * 2. LIHAT SEMUA TONG SAMPAH (PUBLIC)
 * GET http://localhost:3000/loka
 * GET http://localhost:3000/loka?categories=ORGANIK
 * 
 * 3. CARI TONG SAMPAH TERDEKAT
 * GET http://localhost:3000/loka/nearby?lat=-7.42&lng=109.23&radius=500
 * GET http://localhost:3000/loka/nearby?lat=-7.42&lng=109.23&radius=1000&categories=ORGANIK
 * 
 * ============================================
 */

@Controller()
export class WasteLocationsController {
  constructor(private readonly wasteLocationsService: WasteLocationsService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post('waste-locations/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/waste-locations',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `waste-location-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/waste-locations/${file.filename}`;
    
    return {
      message: 'Image uploaded successfully',
      data: {
        filename: file.filename,
        url: imageUrl,
      },
    };
  }

  @Post('waste-locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createWasteLocationDto: CreateWasteLocationDto,
    @GetUser('id') userId: string,
  ) {
    const location = await this.wasteLocationsService.create(
      createWasteLocationDto,
      userId,
    );
    return {
      message: 'Waste location created successfully',
      data: location,
    };
  }

  @Get('waste-locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query('categories') categories?: string | string[]) {
    // Handle both single and multiple categories
    const categoryArray = categories 
      ? (Array.isArray(categories) ? categories : [categories]) as WasteCategory[]
      : undefined;

    const locations = await this.wasteLocationsService.findAll(categoryArray);
    return {
      message: 'Waste locations retrieved successfully',
      count: locations.length,
      filters: categoryArray ? { categories: categoryArray } : {},
      data: locations,
    };
  }

  @Get('waste-locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const location = await this.wasteLocationsService.findOne(id);
    return {
      message: 'Waste location retrieved successfully',
      data: location,
    };
  }

  @Patch('waste-locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateWasteLocationDto: UpdateWasteLocationDto,
  ) {
    const location = await this.wasteLocationsService.update(
      id,
      updateWasteLocationDto,
    );
    return {
      message: 'Waste location updated successfully',
      data: location,
    };
  }

  @Delete('waste-locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.wasteLocationsService.remove(id);
  }

  // ============================================
  // PUBLIC ENDPOINTS (No Authentication)
  // ============================================

  @Get('loka')
  async findAllPublic(@Query('categories') categories?: string | string[]) {
    // Handle both single and multiple categories
    const categoryArray = categories 
      ? (Array.isArray(categories) ? categories : [categories]) as WasteCategory[]
      : undefined;

    const locations = await this.wasteLocationsService.findAllPublic(categoryArray);
    return {
      message: 'Public waste locations retrieved successfully',
      count: locations.length,
      filters: categoryArray ? { categories: categoryArray } : {},
      data: locations,
    };
  }

  @Get('loka/nearby')
  async findNearby(@Query() query: NearbyQueryDto) {
    const locations = await this.wasteLocationsService.findNearby(query);
    return {
      message: 'Nearby waste locations retrieved successfully',
      count: locations.length,
      radius: query.radius || 1000,
      filters: {
        latitude: query.lat,
        longitude: query.lng,
        radius: query.radius || 1000,
        categories: query.categories || [],
      },
      data: locations,
    };
  }
}
