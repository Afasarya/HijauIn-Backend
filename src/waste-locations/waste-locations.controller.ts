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
} from '@nestjs/common';
import { WasteLocationsService } from './waste-locations.service';
import { CreateWasteLocationDto, UpdateWasteLocationDto, NearbyQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { WasteCategory } from '../../generated/prisma/client';

/**
 * ============================================
 * WASTE LOCATIONS CONTROLLER
 * ============================================
 * 
 * Endpoints untuk manajemen lokasi tempat sampah (Loka)
 * 
 * ADMIN ENDPOINTS (require JWT + ADMIN role):
 * - POST   /waste-locations          → Create new location
 * - GET    /waste-locations          → Get all locations (admin view)
 * - GET    /waste-locations/:id      → Get location by ID
 * - PATCH  /waste-locations/:id      → Update location
 * - DELETE /waste-locations/:id      → Delete location
 * 
 * PUBLIC ENDPOINTS (no auth required):
 * - GET    /loka                      → Get all locations (public view)
 * - GET    /loka/nearby               → Find nearby locations with radius filter
 * 
 * ============================================
 * POSTMAN EXAMPLES:
 * ============================================
 * 
 * 1. CREATE LOCATION (ADMIN)
 * POST http://localhost:3000/waste-locations
 * Headers: { "Authorization": "Bearer <admin_jwt_token>" }
 * Body:
 * {
 *   "name": "TPS Kampus UMP",
 *   "description": "Tempat Pembuangan Sampah utama kampus",
 *   "latitude": -7.429,
 *   "longitude": 109.232,
 *   "category": "ANORGANIK"
 * }
 * 
 * 2. GET ALL LOCATIONS (PUBLIC)
 * GET http://localhost:3000/loka
 * GET http://localhost:3000/loka?category=ORGANIK
 * 
 * 3. FIND NEARBY (PUBLIC)
 * GET http://localhost:3000/loka/nearby?lat=-7.42&lng=109.23&radius=1500
 * GET http://localhost:3000/loka/nearby?lat=-7.42&lng=109.23&radius=2000&category=ANORGANIK
 * 
 * 4. UPDATE LOCATION (ADMIN)
 * PATCH http://localhost:3000/waste-locations/:id
 * Headers: { "Authorization": "Bearer <admin_jwt_token>" }
 * Body:
 * {
 *   "name": "TPS Kampus UMP - Updated",
 *   "description": "Lokasi sudah dipindahkan"
 * }
 * 
 * 5. DELETE LOCATION (ADMIN)
 * DELETE http://localhost:3000/waste-locations/:id
 * Headers: { "Authorization": "Bearer <admin_jwt_token>" }
 * 
 * ============================================
 */

@Controller()
export class WasteLocationsController {
  constructor(private readonly wasteLocationsService: WasteLocationsService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

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
  async findAll(@Query('category') category?: WasteCategory) {
    const locations = await this.wasteLocationsService.findAll(category);
    return {
      message: 'Waste locations retrieved successfully',
      count: locations.length,
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
  async findAllPublic(@Query('category') category?: WasteCategory) {
    const locations = await this.wasteLocationsService.findAllPublic(category);
    return {
      message: 'Public waste locations retrieved successfully',
      count: locations.length,
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
      data: locations,
    };
  }
}
