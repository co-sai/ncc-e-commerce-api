import * as mongoose from 'mongoose';
import {
    Controller,
    Post,
    UseGuards,
    Body,
    Request,
    InternalServerErrorException,
    Get,
    HttpCode,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CustomerService } from 'src/customer/customer.service';
import { ProductService } from 'src/product/services/product.service';

interface CustomRequest extends ExpressRequest {
    user: {
        _id: string;
        email: string;
    };
}

@ApiTags('Cart API')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly customerService: CustomerService,
        private readonly productService: ProductService,
    ) {}

    @Get()
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Customer's cart list" })
    @ApiResponse({ status: 200, description: "Customer's cart list" })
    async cartList(@Request() req: CustomRequest) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }
        const cart = await this.cartService.findAllCartByCustomerId(
            customer._id,
        );
        return {
            data: cart
        };
    }

    @Post('add')
    @HttpCode(201)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Add wishlist' })
    @ApiResponse({
        status: 201,
        description: 'Product has been added to wishlist',
    })
    @ApiBody({
        type: CreateCartItemDto,
        required: true,
        examples: {
            example1: {
                summary: 'Example 1',
                value: {
                    product_id: '6684c64d4c2dd84e8a444528',
                    quantity: 1,
                },
            },
        },
    })
    async addToCart(
        @Body() body: CreateCartItemDto,
        @Request() req: CustomRequest,
    ) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);

        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }

        const product = await this.productService.findById(body.product_id);
        if (!product) {
            throw new InternalServerErrorException('Product not found.');
        }
        // Check quantity
        if (+product.quantity < +body.quantity) {
            throw new InternalServerErrorException(
                'Not enough quantity available for this product.',
            );
        }
        const unit_price = +product.price;
        const total_price = unit_price * +body.quantity;

        // Find existing Cart table for Customer
        let cart = await this.cartService.findCartByCustomerId(customer._id);

        if (!cart) {
            // Create new Cart Document for a customer
            cart = await this.cartService.createNewCart(customer._id);
        }

        // Find if the product is already in the cart

        // Find Cart-Item document to update quantity and total price.
        let cartItem = await this.cartService.findCartItemByProductId(
            product._id,
            customer._id,
        );
        if (!cartItem) {
            if (total_price > 0) {
                // Create new Cart-item document and push that cart_item_id to cart_items array that exist in Cart Table
                const cartItem = await this.cartService.addToCartItem(
                    product._id,
                    body.quantity,
                    unit_price,
                    total_price,
                    customer._id,
                );
                cart.cart_items.push(cartItem._id as mongoose.Types.ObjectId);
                await cart.save();
            }
        } else {
            // Compare the real product quantity with the quantity of cart_item
            const total_requested_quantity = cartItem.quantity + +body.quantity;
            if (total_requested_quantity > product.quantity) {
                throw new InternalServerErrorException(
                    'Not enough quantity available for this product.',
                );
            }

            const checkPrice =
                +cartItem.unit_price * (cartItem.quantity + +body.quantity);
            if (checkPrice <= 0) {
                // Remove from CartItem table and remove from cart_items array from Cart Table
                await this.cartService.removeFromCartItem(cartItem._id);
                const cartItems = cart.cart_items.filter(
                    (item_id) => item_id.toString() !== cartItem._id.toString(),
                );
                cart.cart_items = cartItems;
                await cart.save();
            } else {
                cartItem.quantity += +body.quantity;
                cartItem.total_price =
                    +cartItem.unit_price * +cartItem.quantity;
                await cartItem.save();
            }
        }

        const result = await this.cartService.calculateCartTotalPrice(
            customer._id,
        );

        return {
            data: {
                cart: result,
            },
        };
    }
}
