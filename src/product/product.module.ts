import { forwardRef, Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { Media, MediaSchema } from './schema/media.schema';
import { MulterModule } from '@nestjs/platform-express';
import { ProductMulterConfig } from './product.multer.config';
import { CategoryModule } from 'src/category/category.module';
import { CommonModule } from 'src/common/common.module';
import { AdminModule } from 'src/admin/admin.module';
import { ProductVariantController } from './controllers/product-variant.controller';
import { ProductVariantService } from './services/product-variant.service';
import {
    ProductVariant,
    ProductVariantSchema,
} from './schema/product-variant.schema';
import { Variant, VariantSchema } from './schema/variant.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: Media.name, schema: MediaSchema },
            { name: ProductVariant.name, schema: ProductVariantSchema },
            { name: Variant.name, schema: VariantSchema },
        ]),
        MulterModule.register(ProductMulterConfig),
        CommonModule,
        forwardRef(() => CategoryModule),
        AdminModule,
    ],
    controllers: [ProductController, ProductVariantController],
    providers: [ProductService, ProductVariantService],
    exports: [ProductService, ProductVariantService],
})
export class ProductModule {}
