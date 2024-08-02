import { Body, Controller, Delete, Get, HttpCode, InternalServerErrorException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public } from 'src/decorators/public.decorators';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileService } from 'src/common/file/file.service';
import { ProductService } from 'src/product/product.service';
import * as path from 'path';

@ApiTags("Category API")
@UseGuards(JwtAuthGuard)
@Controller({ path: "category", version: "1" })
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService,
        private readonly fileService: FileService,
        private readonly productService: ProductService
    ) { }

    @Post("add")
    @HttpCode(201)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Create category." })
    @ApiResponse({ status: 201, description: "Category has been created successfully." })
    @ApiBody({ type: CreateCategoryDto })
    async createParentCategory(@Body() createCategoryDto: CreateCategoryDto) {
        const category = await this.categoryService.create(createCategoryDto);
        return {
            data: category
        }
    }

    /** Category List */
    /** Done : Need to take the first product detail of each category */
    @Public()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: "Category List for learning page." })
    @ApiQuery({ name: 'q', required: false, description: 'true or false for fetching first product for each category' })
    async findAll(@Query('q') q: string) {
        const includeProduct = q === 'true';
        
        const categories = await this.categoryService.findAll();

        let categoriesWithFirstProduct: any;
        if (includeProduct) {
            categoriesWithFirstProduct = await Promise.all(categories.map(async (category) => {
                const firstProduct = await this.productService.findOneProductByCategoryId(category._id);
                return {
                    ...category.toObject(),
                    product: firstProduct
                };
            }));
        } else {
            categoriesWithFirstProduct = categories.map(category => category.toObject());
        }

        return {
            data: categoriesWithFirstProduct
        };
    }

    /** Need to fetch the related products of each category */
    @Public()
    @Get(':id')
    @HttpCode(200)
    @ApiOperation({ summary: "List of Category / Sub-category and related product." })
    @ApiResponse({ status: 200, description: "List of Category / Sub-category and related products." })
    async findOne(
        @Param('id') id: string,
        @Query() query: { page: string, limit: string }
    ) {
        const page = +query.page || 1;
        const limit = +query.limit || 20;

        const category = await this.categoryService.findOne(id);

        const { products, total_count } = await this.productService.findProductsByCategoryId(id, page, limit);

        // Extract blog IDs
        const productIds = products.map(product => product._id);
        // Fetch media documents
        const medias = await this.productService.findMediasByProductIds(productIds);

        // Map media documents to their corresponding blogs
        const productResult = products.map(product => {
            const productMedias = medias.filter(media => media.product_id.toString() === product._id.toString());
            return {
                ...product.toObject(),
                medias: productMedias.map(media => ({ _id: media._id, path: media.path }))
            };
        });

        return {
            data: {
                category,
                products: productResult,
                page,
                limit,
                total_count
            }
        }
    }

    @Patch(':id')
    @HttpCode(200)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Update sub-category." })
    @ApiResponse({ status: 200, description: "Success." })
    @ApiBody({
        description: 'update',
        required: true,
        examples: {
            example1: {
                summary: 'update example',
                value: {
                    name: 'sub-category from swagger',
                    description: 'Testing update in swagger',
                    // parent_category_id: "id"
                }
            }
        }
    })
    async update(@Param('id') id: string, @Body() updateCategoryDto: Partial<CreateCategoryDto>) {
        const result = await this.categoryService.update(id, updateCategoryDto);
        return {
            data: result,
            message: "Category has been updated."
        }
    }

    @Delete(':id')
    @HttpCode(200)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Delete Category / Sub-Category and related blogs." })
    @ApiResponse({ status: 200, description: "Success." })
    async remove(@Param('id') id: string) {
        /** Check the category is exist or not */
        const category = await this.categoryService.findOne(id);
        if (!category) {
            throw new InternalServerErrorException("Category not found.");
        }
        /** Need to find related products for a category */
        const products = await this.productService.findProductIdsByCategoryId(id);
        const productIds = products.map((obj) => obj._id);
        /** Need to delete each products media file */
        const medias = await this.productService.findMediasByProductIds(productIds);
        if (medias.length > 0) {
            // Extract _id array
            const ids = medias.map(media => media._id);

            await this.productService.findMediasByIdsAndDeleteMany(ids);

            const fileName: string[] = medias.map((media) => path.join(process.cwd(), media.path));
            await this.fileService.deleteFiles(fileName);
        }
        /** Need to delete related products for a category */
        await this.productService.deleteByCategoryId(id);
        /** Need to delete a category */
        await this.categoryService.findByIdAndDelete(id);

        return {
            message: "Category and related products have been deleted successfully."
        };
    }
}


/**
 * Need to implement Category detail with related product.
 * Need to implement Category Delete, also need to delete category related product.
 * 
 */