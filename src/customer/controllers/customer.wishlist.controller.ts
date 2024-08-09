import { Request as ExpressRequest } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Post,
    Request,
    UseGuards,
    Delete,
    Patch,
    Query,
    HttpCode,
} from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { CreateWishList } from '../dto/create-wishlist.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ProductService } from 'src/product/services/product.service';

interface CustomRequest extends ExpressRequest {
    user: {
        _id: string;
        email: string;
    };
}

@ApiTags('Customer Wish List')
@UseGuards(JwtAuthGuard)
@Controller('customer/wish-list')
export class CustomerWishListController {
    constructor(
        private readonly customerService: CustomerService,
        private readonly productService: ProductService
    ) {}

    @Get()
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Customer wishlist' })
    @ApiResponse({ status: 200, description: 'Customer wishlist' })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Limit the number of results',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number for pagination',
    })
    async wishList(
        @Request() req: CustomRequest,
        @Query() query: { limit: string; page: string },
    ) {
        const user_id = req.user._id;
        const page = +query.page || 1;
        const limit = +query.limit || 20;

        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }

        const { wishList, total_count } =
            await this.customerService.findAllCustomerWishList(
                customer._id,
                page,
                limit,
            );
        
        const productIds = wishList.map(item=> item.product_id._id);
        // Find media for these product IDs
        const medias = await this.productService.findMediasByProductIds(productIds);

        // Map media documents to their corresponding blogs
        const result = wishList.map((obj) => {
            const productMedias = medias.filter(
                (media) =>
                    media.product_id.toString() === obj.product_id._id.toString(),
            );
            return {
                ...obj.toObject(),
                medias: productMedias.map((media) => ({
                    _id: media._id,
                    path: media.path,
                })),
            };
        });

        return {
            data: {
                wish_list: result,
                page,
                limit,
                total_count,
            },
        };
    }

    @Post('add')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Add wishlist' })
    @ApiResponse({
        status: 201,
        description: 'Product has been added to wishlist',
    })
    @ApiBody({
        type: CreateWishList,
        required: true,
        examples: {
            example1: {
                summary: 'Product Id',
                value: {
                    product_id: '6684c64d4c2dd84e8a444528',
                },
            },
        },
    })
    async createWishList(
        @Body() body: CreateWishList,
        @Request() req: CustomRequest,
    ) {
        const user_id = req.user._id;

        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }
        const wishList = await this.customerService.createWishList(
            body.product_id,
            customer._id,
        );

        return {
            message: 'Product has been added to wishlist.',
            data: {
                wishList,
            },
        };
    }

    @Delete('/:id')
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Remove product from wishlist' })
    @ApiResponse({
        status: 200,
        description: 'Product has been removed from wishlist',
    })
    async removeFromWishList(
        @Param('id') id: string,
        @Request() req: CustomRequest,
    ) {
        const product_id = id;
        const user_id = req.user._id;

        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }

        await this.customerService.removeProductFromWishList(
            product_id,
            customer._id,
        );

        return {
            message: 'Product has been removed from wish-list.',
        };
    }
}
