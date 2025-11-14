import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadBasePath = './uploads';

  constructor() {
    // Ensure base upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists, create if not
   */
  private ensureUploadDirectory() {
    if (!existsSync(this.uploadBasePath)) {
      mkdirSync(this.uploadBasePath, { recursive: true });
    }
  }

  /**
   * Ensure specific folder exists in uploads directory
   * @param folder - Folder name (e.g., 'articles', 'products')
   */
  ensureFolder(folder: string) {
    const folderPath = join(this.uploadBasePath, folder);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  }

  /**
   * Get full URL for uploaded file
   * @param folder - Folder name
   * @param filename - File name
   */
  getFileUrl(folder: string, filename: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${folder}/${filename}`;
  }

  /**
   * Validate uploaded file
   * @param file - Express Multer File
   * @param options - Validation options
   */
  validateFile(file: Express.Multer.File, options?: {
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
  }) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const maxSize = options?.maxSize || 5 * 1024 * 1024; // Default 5MB
    const allowedMimeTypes = options?.allowedMimeTypes || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check mime type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (JPEG, PNG, GIF, WEBP) are allowed');
    }

    return true;
  }

  /**
   * Generate unique filename
   * @param originalName - Original file name
   */
  generateFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = originalName.split('.').pop();
    const prefixStr = prefix ? `${prefix}-` : '';
    return `${prefixStr}${timestamp}-${random}.${ext}`;
  }
}
