import mongoose, { Model } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './schema/customer.schema';
import { Customer_Level } from './schema/customer-level.schema';
import { Shipping_Address } from './schema/shipping-address.schema';
import { WishList } from './schema/wish-list.schema';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';

@Injectable()
export class CustomerService {
    constructor(
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(Customer_Level.name)
        private customerLevelModel: Model<Customer_Level>,
        @InjectModel(Shipping_Address.name)
        private shippingAddressModel: Model<Shipping_Address>,
        @InjectModel(WishList.name) private wishListModel: Model<WishList>,
    ) {}

    async createCustomer(id: any) {
        const customerLevel = await this.customerLevelModel.findOne({
            level: 'Normal',
        });
        if (!customerLevel) {
            throw new InternalServerErrorException('Customer level not found.');
        }
        const customer = new this.customerModel({
            user_id: id,
            customer_level_id: customerLevel._id,
        });
        await customer.save();
        return customer;
    }

    async findByUserIdAndDelete(user_id: string) {
        await this.customerModel.findOneAndDelete({ user_id: user_id });
        return;
    }

    async findCustomerByUserId(user_id: string) {
        const customer = await this.customerModel.findOne({ user_id: user_id });
        return customer;
    }

    async createShippingAddress(
        body: CreateShippingAddressDto,
        customer_id: any,
    ) {
        const result = new this.shippingAddressModel({ ...body, customer_id });
        await result.save();
        return result;
    }

    async findShippingAddressByCustomerId(customer_id: any) {
        const result = await this.shippingAddressModel.find({
            customer_id: customer_id,
        });
        return result;
    }

    async findShippingAddressById(id: string) {
        const result = await this.shippingAddressModel.findById(id);
        return result;
    }

    async findShippingAddressByIdAndDelete(id: string) {
        await this.shippingAddressModel.findByIdAndDelete(id);
        return;
    }

    async findShippingAddressByCustomerIdAndDeleteMany(id: any) {
        await this.shippingAddressModel.deleteMany({
            customer_id: id,
        });
        return;
    }

    /* Start - Wish List */
    async createWishList(product_id: any, customer_id: any) {
        const exWishList = await this.wishListModel
            .findOne({
                $and: [
                    { product_id: product_id },
                    { customer_id: customer_id },
                ],
            })
            .exec();
        if (!exWishList) {
            const wishList = new this.wishListModel({
                customer_id,
                product_id,
            });
            await wishList.save();
            return wishList;
        }
        return exWishList;
    }

    async removeProductFromWishList(product_id: any, customer_id: any) {
        const result = await this.wishListModel
            .findOne({
                $and: [
                    { product_id: product_id },
                    { customer_id: customer_id },
                ],
            })
            .exec();
        if (!result) {
            throw new InternalServerErrorException(
                'Product not found in wish-list',
            );
        }
        await this.wishListModel
            .findOneAndDelete({
                $and: [
                    { product_id: product_id },
                    { customer_id: customer_id },
                ],
            })
            .exec();
        return;
    }

    async findAllCustomerWishList(
        customer_id: any,
        page: number,
        limit: number,
    ) {
        const result = await this.wishListModel
            .find({
                customer_id: customer_id,
            })
            .populate({
                path: 'product_id',
                select: 'title description image price',
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        const total_count = await this.wishListModel
            .find({
                customer_id: customer_id,
            })
            .countDocuments();

        return { wishList: result, total_count };
    }

    async findWishListByCustomerIdAndDeleteMany(id: any) {
        await this.wishListModel.deleteMany({
            customer_id: id,
        });
        return;
    }

    /* End - Wish List */
}
