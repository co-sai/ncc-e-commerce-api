import { forwardRef, Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { Media, MediaSchema } from './schema/media.schema';
import { MulterModule } from '@nestjs/platform-express';
import { ProductMulterConfig } from './product.multer.config';
import { CategoryModule } from 'src/category/category.module';
import { CommonModule } from 'src/common/common.module';
import { AdminModule } from 'src/admin/admin.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: Media.name, schema: MediaSchema },
        ]),
        MulterModule.register(ProductMulterConfig),
        CommonModule,
        forwardRef(() => CategoryModule),
        AdminModule,
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
