import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController, PublicArticlesController } from './articles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController, PublicArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
