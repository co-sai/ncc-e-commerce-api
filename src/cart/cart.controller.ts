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
import { RequestInterface } from 'src/interface/request.interface';

@ApiTags('Cart API')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly customerService: CustomerService,
        private readonly productService: ProductService,
    ) { }

    @Get()
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Customer's cart list" })
    @ApiResponse({ status: 200, description: "Customer's cart list" })
    async cartList(@Request() req: RequestInterface) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }
        const cart: any = await this.cartService.findAllCartByCustomerId(customer._id);


        if (!cart) {
            return { data: [] };
        }

        // Collect all product IDs from the cart items
        const productIds = cart.cart_items.map(item => item.product_id._id);

        // Find media for these product IDs
        const medias = await this.productService.findMediasByProductIds(productIds);

        // Group media by product_id and attach to the cart items
        const updatedCartItems = cart.cart_items.map(item => {
            const productMedias = medias.filter(
                media => media.product_id.toString() === item.product_id._id.toString()
            );

            return {
                ...item.toObject(),
                media: productMedias.map(media => ({
                    _id: media._id,
                    path: media.path,
                })),
            };
        });

        return {
            data: {
                ...cart.toObject(),
                cart_items: updatedCartItems,
            }
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
        @Request() req: RequestInterface,
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

    // Remove Entire Item from Cart
    @Post('remove')
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Remove entire product from cart' })
    @ApiResponse({
        status: 200,
        description: 'Product has been removed from cart',
    })
    @ApiBody({
        type: CreateCartItemDto,
        required: true,
        examples: {
            example1: {
                summary: 'Example 1',
                value: {
                    product_id: '6684c64d4c2dd84e8a444528',
                },
            },
        },
    })
    async removeCartItemFromCart(
        @Body() body: { product_id : string },
        @Request() req: RequestInterface,
    ) {
        const user_id = req.user._id;
        const customer = await this.customerService.findCustomerByUserId(user_id);

        if (!customer) {
            throw new InternalServerErrorException('Account not found.');
        }

        const product = await this.productService.findById(body.product_id);
        if (!product) {
            throw new InternalServerErrorException('Product not found.');
        }

        let cart = await this.cartService.findCartByCustomerId(customer._id);

        if (!cart) {
            throw new InternalServerErrorException('Cart not found.');
        }

        const cartItem = await this.cartService.findCartItemByProductId(
            product._id,
            customer._id,
        );

        if (!cartItem) {
            throw new InternalServerErrorException(
                'Product not found in the cart.',
            );
        }

        // Remove the cart item
        await this.cartService.removeFromCartItem(cartItem._id);

        // Remove cart item from cart's cart_items array
        const cartItems = cart.cart_items.filter(
            (item_id) => item_id.toString() !== cartItem._id.toString(),
        );
        cart.cart_items = cartItems;
        await cart.save();

        // Recalculate the total price
        const result = await this.cartService.calculateCartTotalPrice(
            customer._id,
        );

        return {
            data: {
                cart: result,
            },
            message: "Removed cart item from cart."
        };
    }

}
