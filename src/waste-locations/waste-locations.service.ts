import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWasteLocationDto, UpdateWasteLocationDto, NearbyQueryDto } from './dto';
import { WasteCategory } from '../../generated/prisma/client';

@Injectable()
export class WasteLocationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new waste location with multiple categories and images (Admin only)
   */
  async create(createDto: CreateWasteLocationDto, userId: string) {
    const { name, description, address, latitude, longitude, categories, image_url } = createDto;

    const location = await this.prisma.wasteLocation.create({
      data: {
        name,
        description,
        address,
        latitude,
        longitude,
        image_url,
        createdBy: userId,
        categories: {
          create: categories.map((category) => ({ category })),
        },
      },
      include: {
        categories: true,
      },
    });

    return this.formatLocation(location);
  }

  /**
   * Get all waste locations with optional category filter (Admin view)
   */
  async findAll(categories?: WasteCategory[]) {
    const locations = await this.prisma.wasteLocation.findMany({
      where: categories?.length ? {
        categories: {
          some: {
            category: { in: categories },
          },
        },
      } : undefined,
      include: {
        categories: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return locations.map((loc) => this.formatLocation(loc));
  }

  /**
   * Get a single waste location by ID
   */
  async findOne(id: string) {
    const location = await this.prisma.wasteLocation.findUnique({
      where: { id },
      include: {
        categories: true,
        user: {
          select: {
            id: true,
            nama_panggilan: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Waste location with ID ${id} not found`);
    }

    return this.formatLocation(location);
  }

  /**
   * Update a waste location with categories and images (Admin only)
   */
  async update(id: string, updateDto: UpdateWasteLocationDto) {
    // Check if location exists
    await this.findOne(id);

    const { categories, ...basicData } = updateDto;

    // Start transaction to update location, categories, and images
    const location = await this.prisma.$transaction(async (tx) => {
      // Update basic data
      const updated = await tx.wasteLocation.update({
        where: { id },
        data: basicData,
      });

      // Update categories if provided
      if (categories && categories.length > 0) {
        // Delete existing categories
        await tx.wasteLocationCategory.deleteMany({
          where: { wasteLocationId: id },
        });

        // Create new categories
        await tx.wasteLocationCategory.createMany({
          data: categories.map((category) => ({
            wasteLocationId: id,
            category,
          })),
        });
      }

      // Fetch updated location with relations
      return tx.wasteLocation.findUnique({
        where: { id },
        include: {
          categories: true,
        },
      });
    });

    return this.formatLocation(location!);
  }

  /**
   * Delete a waste location (Admin only)
   * Categories and images will be deleted automatically due to CASCADE
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
   * With optional categories filter
   */
  async findAllPublic(categories?: WasteCategory[]) {
    const locations = await this.prisma.wasteLocation.findMany({
      where: categories?.length ? {
        categories: {
          some: {
            category: { in: categories },
          },
        },
      } : undefined,
      include: {
        categories: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return locations.map((loc) => this.formatLocationPublic(loc));
  }

  /**
   * Find nearby waste locations using Haversine formula
   * Query parameters: lat, lng, radius (in meters), categories (optional, array)
   * 
   * Haversine formula calculates distance between two points on Earth's surface
   * More info: https://en.wikipedia.org/wiki/Haversine_formula
   */
  async findNearby(query: NearbyQueryDto) {
    const { lat, lng, radius = 1000, categories } = query;

    // Get all locations (with optional categories filter)
    const locations = await this.prisma.wasteLocation.findMany({
      where: categories?.length ? {
        categories: {
          some: {
            category: { in: categories },
          },
        },
      } : undefined,
      include: {
        categories: true,
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
      description: loc.description,
      address: loc.address,
      categories: loc.categories.map((c) => c.category),
      distance: parseFloat(loc.distance.toFixed(2)), // Distance in meters
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      image_url: loc.image_url,
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

  /**
   * Format location data for response (Admin)
   */
  private formatLocation(location: any) {
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      categories: location.categories.map((c: any) => c.category),
      image_url: location.image_url,
      createdBy: location.createdBy,
      created_at: location.created_at,
      updated_at: location.updated_at,
      user: location.user,
    };
  }

  /**
   * Format location data for public response
   */
  private formatLocationPublic(location: any) {
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      address: location.address,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      categories: location.categories.map((c: any) => c.category),
      image_url: location.image_url,
      created_at: location.created_at,
    };
  }
}
