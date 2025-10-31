import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWasteLocationDto, UpdateWasteLocationDto, NearbyQueryDto } from './dto';
import { WasteCategory } from '../../generated/prisma/client';

@Injectable()
export class WasteLocationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new waste location (Admin only)
   */
  async create(createDto: CreateWasteLocationDto, userId: string) {
    const { name, description, latitude, longitude, category } = createDto;

    const location = await this.prisma.wasteLocation.create({
      data: {
        name,
        description,
        latitude,
        longitude,
        category,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
        createdBy: true,
        created_at: true,
      },
    });

    return location;
  }

  /**
   * Get all waste locations with optional category filter (Admin view)
   */
  async findAll(category?: WasteCategory) {
    const locations = await this.prisma.wasteLocation.findMany({
      where: category ? { category } : undefined,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
        createdBy: true,
        created_at: true,
      },
    });

    return locations;
  }

  /**
   * Get a single waste location by ID
   */
  async findOne(id: string) {
    const location = await this.prisma.wasteLocation.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
        createdBy: true,
        created_at: true,
      },
    });

    if (!location) {
      throw new NotFoundException(`Waste location with ID ${id} not found`);
    }

    return location;
  }

  /**
   * Update a waste location (Admin only)
   */
  async update(id: string, updateDto: UpdateWasteLocationDto) {
    // Check if location exists
    await this.findOne(id);

    const location = await this.prisma.wasteLocation.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
        createdBy: true,
        created_at: true,
      },
    });

    return location;
  }

  /**
   * Delete a waste location (Admin only)
   */
  async remove(id: string) {
    // Check if location exists
    await this.findOne(id);

    await this.prisma.wasteLocation.delete({
      where: { id },
    });

    return { message: 'Waste location deleted successfully' };
  }

  /**
   * Get all waste locations for public view (no auth required)
   * With optional category filter
   */
  async findAllPublic(category?: WasteCategory) {
    const locations = await this.prisma.wasteLocation.findMany({
      where: category ? { category } : undefined,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
        created_at: true,
      },
    });

    return locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      category: loc.category,
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      created_at: loc.created_at,
    }));
  }

  /**
   * Find nearby waste locations using Haversine formula
   * Query parameters: lat, lng, radius (in meters), category (optional)
   * 
   * Haversine formula calculates distance between two points on Earth's surface
   * More info: https://en.wikipedia.org/wiki/Haversine_formula
   */
  async findNearby(query: NearbyQueryDto) {
    const { lat, lng, radius = 1000, category } = query;

    // Get all locations (with optional category filter)
    const locations = await this.prisma.wasteLocation.findMany({
      where: category ? { category } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        category: true,
      },
    });

    // Calculate distance for each location using Haversine formula
    const locationsWithDistance = locations
      .map((loc) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          loc.latitude,
          loc.longitude,
        );
        return {
          ...loc,
          distance,
        };
      })
      .filter((loc) => loc.distance <= radius) // Filter by radius
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return locationsWithDistance.map((loc) => ({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      distance: parseFloat(loc.distance.toFixed(2)), // Distance in meters
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      description: loc.description,
    }));
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   * 
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  }
}
