import * as path from 'path';
import * as fsExtra from 'fs-extra';
import {
    Body,
    Controller,
    HttpCode,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Request,
    InternalServerErrorException,
    Get,
    Param,
    NotFoundException,
    Patch,
    Query,
    Delete,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ProductService } from '../services/product.service';
import { FileService } from 'src/common/file/file.service';
import { CategoryService } from 'src/category/category.service';
import { AdminService } from 'src/admin/admin.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from '../dto/create-product.dto';
import { RequestInterface } from 'src/interface/request.interface';
import { ProductVariantService } from '../services/product-variant.service';

@ApiTags('Product API')
@Controller({ path: 'product/variant', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProductVariantController {
    constructor(
        private readonly productService: ProductService,
        private readonly fileService: FileService,
        private readonly categoryService: CategoryService,
        private readonly productVariantService: ProductVariantService,
        private readonly adminService: AdminService,
    ) { }

    @Post("add")
    @HttpCode(201)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create new product variant' })
    @ApiResponse({
        status: 201,
        description: 'Product Variant has been created successfully.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Add product variant',
        schema: {
            type: 'object',
            properties: {
                product_id: { type: 'string', nullable: true, example: "6684c64d4c2dd84e8a444528" },
                variants: { type: 'string', nullable: true, example: "[]" },
                has_variant: { type: 'string', nullable: true, example: "true" },
                variant_medias: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    nullable: true,
                },

            }
        }
    })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'variant_medias', maxCount: 5 }]))
    async createProductVariant(
        @Body() body: any,
        @UploadedFiles() files: {
            variant_medias?: Array<Express.Multer.File>
        },
        @Request() req: RequestInterface,
    ) {
        const product_id = body.product_id;
        let variantImageFileNames: string[] = [];
        try {
            const variantImagePath = path.join(process.cwd(), 'uploads', 'product', 'variants');
            if (files.variant_medias && files.variant_medias.length > 0) {
                variantImageFileNames = files.variant_medias.map((file) => (path.join(variantImagePath, file.filename)));
            }

            const product = await this.productService.findById(product_id);
            if (!product) {
                if (variantImageFileNames.length > 0) {
                    await this.fileService.deleteFiles(variantImageFileNames);
                }
                throw new InternalServerErrorException("Product not found.");
            }

            if (body.has_variant.toString() === "true" && body.variants) {
                let productVariant: any;
                const variants = JSON.parse(body.variants) as Array<{ name: string, value: string, price: string, media: string | null }>;
                for (let i = 0; i < variants.length; i++) {
                    const variant = variants[i];

                    let exVariant = await this.productVariantService.findVariantByName(variant.name);
                    if (!exVariant) {
                        exVariant = await this.productVariantService.createVariant(variant.name.trim());
                    }
                    productVariant = await this.productVariantService.createProductVariant(
                        {
                            value: variant.value,
                            price: parseInt(variant.price),
                            product_id: product._id,
                            variant_id: exVariant._id
                        }
                    );

                    // Check if there's an uploaded image for this variant
                    if (files.variant_medias && files.variant_medias.length > 0 && variant.media.toString() === 'true') {
                        const variantImage = files.variant_medias.shift(); // Take the first image and remove it from the array

                        const uniqueSuffix = Math.floor(
                            100000 + Math.random() * 900000,
                        );
                        const newFilename = await this.fileService.generateFileName(
                            `${product._id}-${uniqueSuffix}-${variantImage.originalname}`,
                            variantImage,
                            'uploads/product/variants',
                        );

                        productVariant.media = `uploads/product/variants/${newFilename}`;
                        variantImageFileNames.push(path.join(process.cwd(), newFilename));
                    }
                    await productVariant.save();
                }
            } else {
                // delete product variant image
                if (variantImageFileNames.length > 0) {
                    await this.fileService.deleteFiles(variantImageFileNames);
                }
            }

            product.has_variant = true;
            await product.save();

            const productVariant = await this.productVariantService.findProductVariant(product._id.toString());

            return {
                data: {
                    product,
                    productVariant,
                    message: "Product variants have been created successfully."
                }
            }
        } catch (error) {
            if (variantImageFileNames.length > 0) {
                await this.fileService.deleteFiles(variantImageFileNames);
            }
            throw error;
        }
    }

    @Post("/:id")
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Update product variants" })
    @ApiResponse({ status: 200, description: "Product variant has been updated successfully." })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Update product variant',
        schema: {
            type: 'object',
            properties: {
                variant_image: { type: 'string', format: 'binary', nullable: true },
                value: { type: 'string', nullable: true, example: "1Tb" },
                price: { type: 'string', nullable: true, example: "2800000" },
            }
        }
    })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'variant_medias', maxCount: 5 }]))
    async updateSingleVariant(
        @Body() body: any,
        @Param("id") id: string,
        @UploadedFiles() files: {
            variant_medias?: Array<Express.Multer.File>
        }
    ) {
        const variant_id = id;
        let variantImageFileNames: string[] = [];
        try {
            const variantImagePath = path.join(process.cwd(), 'uploads', 'product', 'variants');
            if (files.variant_medias && files.variant_medias.length > 0) {
                variantImageFileNames = files.variant_medias.map((file) => (path.join(variantImagePath, file.filename)));
            }

            const productVariant = await this.productVariantService.findProductVariantById(id);
            if (!productVariant) {
                await this.fileService.deleteFiles(variantImageFileNames);
                throw new InternalServerErrorException("Product variant not found.");
            }
            const { variant_medias, ...newVariant } = body;

            Object.assign(productVariant, newVariant);

            if (files.variant_medias && files.variant_medias.length > 0) {
                if (productVariant.media) {
                    await this.fileService.deleteFiles([path.join(process.cwd(), productVariant.media)]);
                }

                const uniqueSuffix = Math.floor(
                    100000 + Math.random() * 900000,
                );
                const newFilename = await this.fileService.generateFileName(
                    `${id}-${uniqueSuffix}-${files.variant_medias[0].originalname}`,
                    files.variant_medias[0],
                    'uploads/product/variants',
                );
                productVariant.media = `uploads/product/${newFilename}`;
            }

            await productVariant.save();

            return {
                data: {
                    productVariant,
                    message: "Product variant has been updated successfully."
                }
            }
        } catch (error) {
            throw error;
        }
    }

    // Delete single variant
    @Delete("/:id")
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Delete product variants" })
    @ApiResponse({ status: 200, description: "Product variant has been deleted successfully." })
    async deleteVariant(@Param("id") id: string) {
        const productVariant = await this.productVariantService.findProductVariantById(id);
        if (!productVariant) {
            throw new InternalServerErrorException("Variant not found.");
        }
        if (productVariant.media) {
            await this.fileService.deleteFiles([path.join(process.cwd(), productVariant.media)]);
        }
        await this.productVariantService.deleteSingleVariant(id);

        return {
            message: "Variant has been deleted successfully."
        }
    }
}
