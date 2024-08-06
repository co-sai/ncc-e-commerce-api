import mongoose, { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './schema/cart.schema';
import { CartItem } from './schema/cart-item.schema';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cartModel: Model<Cart>,
        @InjectModel(CartItem.name) private cartItemModel: Model<CartItem>,
    ) {}

    async findAllCartByCustomerId(customer_id: any) {
        const carts = await this.cartModel
            .findOne({ customer_id: customer_id })
            .populate({
                path: 'cart_items',
                populate: {
                    path: 'product_id',
                    select: 'title image',
                    model: 'Product',
                },
            })
            .exec();
        return carts;
    }

    async findCartByCustomerId(customer_id: any) {
        const cart = await this.cartModel
            .findOne({ customer_id: customer_id })
            // .populate("cart_items")
            .exec();
        return cart;
    }

    async createNewCart(customer_id: any) {
        const cart = new this.cartModel({
            cart_items: [],
            customer_id: customer_id,
        });
        await cart.save();
        return cart;
    }

    async createEmptyCart(customer_id: any) {
        const cart = new this.cartModel({
            customer_id,
            cart_items: [],
        });
        await cart.save();
        return cart;
    }

    async findCartItemByProductId(product_id: any, customer_id: any) {
        const productCartItem = await this.cartItemModel
            .findOne({
                $and: [
                    { product_id: product_id },
                    { customer_id: customer_id },
                ],
            })
            .exec();
        return productCartItem;
    }

    async addToCartItem(
        product_id: any,
        quantity: number,
        unit_price: number,
        total_price: number,
        customer_id: any,
    ) {
        const cartItem = new this.cartItemModel({
            product_id,
            quantity,
            unit_price,
            total_price,
            customer_id,
        });
        await cartItem.save();
        return cartItem;
    }

    async removeFromCartItem(productCartItem_id: any) {
        await this.cartItemModel.findByIdAndDelete(productCartItem_id);
        return;
    }

    async calculateCartTotalPrice(customer_id: any) {
        const cart = await this.cartModel.findOne({ customer_id: customer_id });
        const cartItems = await this.cartItemModel.find({
            _id: { $in: cart.cart_items },
        });
        const totalPrice = cartItems.reduce(
            (sum, item) => sum + item.total_price,
            0,
        );

        cart.total_price = totalPrice;
        await cart.save();
        return cart;
    }

    // Clean-up Customer Cart's cart_items array and Delete related cart_items
    async cleanUpCustomerCartAndCartItem(customer_id: any) {
        const cart = await this.cartModel.findOne({
            customer_id: customer_id,
        });
        if (cart) {
            if (cart.cart_items.length > 0) {
                // Delete Many Cart-item
                await this.cartItemModel.deleteMany({
                    _id: { $in: cart.cart_items },
                });
            }
            // Clean-up cart_items array from Cart
            cart.cart_items = [];
            cart.total_price = 0;
            await cart.save();
        }
        return;
    }

    async deleteCustomerCartAndCartItem(customer_id: any) {
        const cart = await this.cartModel.findOne({
            customer_id: customer_id,
        });
        if (cart) {
            if (cart.cart_items.length > 0) {
                // Delete Many Cart-item
                await this.cartItemModel.deleteMany({
                    _id: { $in: cart.cart_items },
                });
            }
            // Delete Cart
            await this.cartModel.findOneAndDelete({ customer_id: customer_id });
        }
        return;
    }
}
