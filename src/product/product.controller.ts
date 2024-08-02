import * as path from 'path';
import { Body, Controller, HttpCode, Post, UploadedFiles, UseGuards, UseInterceptors, Request, InternalServerErrorException, Get, Param, NotFoundException, Patch, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ProductService } from './product.service';
import { FileService } from 'src/common/file/file.service';
import { CategoryService } from 'src/category/category.service';
import { AdminService } from 'src/admin/admin.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from './dto/create-product.dto';
import { RequestInterface } from 'src/interface/request.interface';
import { Public } from 'src/decorators/public.decorators';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schema/product.schema';

@ApiTags("Product API")
@Controller({ path: "product", version: "1" })
@UseGuards(JwtAuthGuard)
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly fileService: FileService,
        private readonly categoryService: CategoryService,
        private readonly adminService: AdminService,
    ) { }

    @Public()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: "Products filter by Rank or View or Random" })
    @ApiResponse({ status: 200, description: "Products list" })
    @ApiQuery({ name: 'q', required: false, description: 'Filter by rank or view or random' })
    @ApiQuery({ name: 'random', required: false, description: 'Filter by random' })
    @ApiQuery({ name: 'limit', required: false, description: 'Limit the number of results' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
    async blogListFilterByViewAndRank(
        @Query() query: any,
    ): Promise<{ data: Product[], total_count: number, limit: number, page: number }> {
        const q = query.q;
        const page = +query.page || 1;
        const limit = +query.limit || 20
        const random = query.random === 'true';

        const { products, total_count } = await this.productService.filterAndSortProducts(q, limit, page, random);

        // Extract blog IDs
        const productIds = products.map(product => product._id);
        // Fetch media documents
        const medias = await this.productService.findMediasByProductIds(productIds);

        // Map media documents to their corresponding blogs
        const productData = products.map(product => {
            const productMedia = medias.filter(media => media.product_id.toString() === product._id.toString());
            return {
                ...product.toObject(),
                medias: productMedia.map(media => ({ _id: media._id, path: media.path }))
            };
        });

        return {
            data: productData,
            total_count,
            limit,
            page
        };
    }

    @Public()
    @Get("/search")
    @HttpCode(200)
    @ApiOperation({ summary: "Product searching" })
    @ApiResponse({ status: 200, description: "Product list" })
    @ApiQuery({ name: 'q', required: false, description: 'Product searching key' })
    @ApiQuery({ name: 'category', required: false, description: 'Category_id || Search in specific category' })
    @ApiQuery({ name: 'limit', required: false, description: 'Limit the number of results' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
    async productSearching(
        @Query() query: any,
    ) {
        const q = query.q ? query.q.trim() : '';
        const category_id = query.category ? query.category : null;
        const page = +query.page || 1;
        const limit = +query.limit || 20;

        // If q is empty, return empty arrays
        if (!q) {
            return {
                data: {
                    categories: [],
                    blogs: []
                }
            };
        }

        const { products, total_count } = await this.productService.filterByName(q, category_id, page, limit);

        return {
            data: {
                products,
                total_count,
                limit,
                page
            }
        }

    }

    @Post("add")
    @HttpCode(201)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Create new product" })
    @ApiResponse({ status: 201, description: "Product has been created successfully." })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create new product',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', nullable: true, example: "IPhone 15 Pro Max" },
                content: { type: 'string', nullable: true, example: "IPhone 15 Pro Max" },
                rank: { type: 'string', nullable: true, example: "1" },
                category_id: { type: 'string', nullable: true, example: "sub-category Id" },
                medias: {
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
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'medias', maxCount: 5 },
    ]))
    async createProduct(
        @Body() body: CreateProductDto,
        @UploadedFiles() files: {
            medias?: Array<Express.Multer.File>,
        },
        @Request() req: RequestInterface,
    ): Promise<any> {
        const admin_id = req.user._id;
        let mediasFileName = [];

        try {
            const uploadFolder = path.join(process.cwd(), 'uploads', 'product');

            if (files.medias && files.medias.length >= 1) {
                mediasFileName = files.medias.map((file: any) => path.join(uploadFolder, file.filename));
            }

            const category = await this.categoryService.findOne(body.category_id);

            if (!category) {
                await this.fileService.deleteFiles(mediasFileName);
                throw new InternalServerErrorException("Category not found.");
            }

            const product = await this.productService.createProduct(body, admin_id);

            let medias_result: any;
            if (files.medias) {
                let media_files_names = [];

                for (const file of files.medias) {
                    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
                    const newFilename = await this.fileService.generateFileName(`${product._id}-${uniqueSuffix}-${file.originalname}`, file, 'uploads/product');

                    media_files_names.push(`uploads/product/${newFilename}`);
                }

                /** Start - Save product's media */
                medias_result = await this.productService.createMedias(media_files_names, product._id);
                /** End - Save product's media */
            }

            await product.save();

            return {
                message: "Success",
                data: {
                    ...product.toJSON(),
                    medias: medias_result
                }
            };
        } catch (error) {
            throw error;
        }
    }

    @Public()
    @Get(":id")
    @HttpCode(200)
    @ApiOperation({ summary: "Product Detail" })
    @ApiResponse({ status: 200, description: "Product detail" })
    async productDetail(
        @Param("id") id: string,
    ): Promise<any> {
        const product = await this.productService.findById(id);
        if (!product) {
            throw new NotFoundException("Product data not found.");
        }

        product.view = +product.view + 1;
        await product.save();

        const medias = await this.productService.findMediasByProductId(product._id);

        return {
            data: {
                ...product.toJSON(),
                medias
            }
        };
    }

    @Post(":id")
    @HttpCode(200)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Update Product" })
    @ApiResponse({ status: 200, description: "Product has been updated successfully." })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Update Product',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', nullable: true, example: "IPhone 15 Pro Max" },
                content: { type: 'string', nullable: true, example: "IPhone 15 Pro Max" },
                rank: { type: 'string', nullable: true, example: "1" },
                category_id: { type: 'string', nullable: true, example: "sub-category Id" },
                medias: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    nullable: true,
                },
                medias_to_remove: { type: "string", nullable: true, example: "[0,1]" },
            }
        }
    })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'medias', maxCount: 5 },
        { name: 'new_medias', maxCount: 5 }
    ]))
    async updateProduct(
        @Param("id") id: string,
        @Body() body: Partial<UpdateProductDto>,
        @UploadedFiles() files: any,
        @Request() req: any,
    ): Promise<any> {
        const admin_id = req.user._id;
        const { medias_to_remove } = body;
        let mediasFileName = [];
        const uploadFolder = path.join(process.cwd(), 'uploads', 'product');

        if (files.medias && files.medias.length >= 1) {
            mediasFileName = files.medias.map((file: any) => path.join(uploadFolder, file.filename));
        }

        const Product = await this.productService.findById(id);

        if (!Product) {
            await this.fileService.deleteFiles(mediasFileName);
            throw new InternalServerErrorException("Product data not found.");
        }

        if (body.category_id) {
            if (Product.category_id.toString() !== body.category_id.toString()) {
                const category = await this.categoryService.findOne(body.category_id.toString());

                if (!category) {
                    await this.fileService.deleteFiles(mediasFileName);
                    throw new InternalServerErrorException("Category Not found.");
                }
            }
        }

        const updatedProduct = await this.productService.findByIdAndUpdate(id, body);

        /** Start - Remove medias from medias array */
        // Need to delete medias from uploads/product folder
        if (medias_to_remove) {
            const mediaToRemoveArray = JSON.parse(medias_to_remove.replace(/'/g, '"'));
            const medias = await this.productService.findMediasByMediasIds(mediaToRemoveArray);
            const mediasFilePath = medias.map((media) => path.join(process.cwd(), media.path));
            await this.fileService.deleteFiles(mediasFilePath);
            await this.productService.findMediasByIdsAndDeleteMany(mediaToRemoveArray);
        }
        /** End - Remove medias from medias array */

        /**  Start - Process new medias (if any) */
        let medias_result: any;
        if (files.medias) {
            let media_files_names = [];

            for (const file of files.medias) {
                const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
                const newFilename = await this.fileService.generateFileName(`${id}-${uniqueSuffix}-${file.originalname}`, file, 'uploads/product');
                media_files_names.push(`uploads/product/${newFilename}`);
            }

            if (media_files_names.length > 0) {
                medias_result = await this.productService.createMedias(media_files_names, id);
            }
        }
        /**  End - Process new medias (if any) */

        await updatedProduct.save();

        return {
            data: {
                ...updatedProduct.toObject(),
                medias: medias_result
            },
            message: "Product has been updated."
        };
    }

    @Patch(":id/set-rank")
    @HttpCode(200)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Update blog rank" })
    @ApiResponse({ status: 200, description: "success" })
    @ApiBody({
        description: 'Update blog rank',
        required: true,
        examples: {
            example1: {
                summary: 'Update blog rank',
                value: {
                    rank: 2,
                }
            }
        }
    })
    async setRank(
        @Param("id") id: string,
        @Body() body: { rank: number }
    ): Promise<any> {
        const { rank } = body;

        const product = await this.productService.findById(id);

        if (!product) {
            throw new InternalServerErrorException("Product data not found.");
        }

        product.rank = rank
        await product.save();

        const medias = await this.productService.findMediasByProductId(product._id);

        return {
            message: "Rank updated successfully",
            data: {
                ...product.toObject(),
                medias
            }
        };
    }

    // Delete Product -> Done - Need to remove old image from product
    @Delete("/:id")
    @HttpCode(200)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Delete Product" })
    @ApiResponse({ status: 200, description: "success" })
    async deleteProduct(@Param("id") id: string, @Request() req: RequestInterface) {
        const _id = req.user._id;
        const { role_id } = (await this.adminService.findById(_id)).toJSON();
        if (role_id.name !== "SUPER_ADMIN") {
            throw new InternalServerErrorException("You don't have the permission.")
        }
        const blog = await this.productService.findById(id);
        if (!blog) {
            throw new InternalServerErrorException("Blog not found.");
        }

        const medias = await this.productService.findMediasByProductId(blog._id);
        if (medias.length > 0) {
            // Extract _id array
            const ids = medias.map(media => media._id);

            await this.productService.findMediasByIdsAndDeleteMany(ids);

            const fileName: string[] = medias.map((media) => path.join(process.cwd(), media.path));
            await this.fileService.deleteFiles(fileName);
        }

        // delete product
        await this.productService.findByIdAndDelete(id);

        return {
            message: "Blog has been deleted successfully."
        }

    }
}
