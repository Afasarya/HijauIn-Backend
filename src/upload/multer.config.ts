import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Create multer disk storage configuration for a specific folder
 * @param folder - Destination folder name (e.g., 'articles', 'products')
 */
export function createMulterOptions(folder: string) {
  return {
    storage: diskStorage({
      destination: (req: Request, file: Express.Multer.File, callback) => {
        const uploadPath = join(process.cwd(), 'uploads', folder);
        
        // Ensure directory exists, create if not
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
          console.log(`✅ Created upload directory: ${uploadPath}`);
        }
        
        callback(null, uploadPath);
      },
      filename: (req: Request, file: Express.Multer.File, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${folder}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
      // Only allow image files
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
  };
}

