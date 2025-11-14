import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WasteLocationsModule } from './waste-locations/waste-locations.module';
import { ProductsModule } from './products/products.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MidtransModule } from './midtrans/midtrans.module';
import { ArticlesModule } from './articles/articles.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UploadModule,
    AuthModule,
    UsersModule,
    WasteLocationsModule,
    MidtransModule,
    ProductsModule,
    TransactionsModule,
    ArticlesModule,
    ProductCategoriesModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
