import * as path from 'path';
import { Model } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

import { User } from './schema/user.schema';
// import { Cart } from 'src/cart/schema/cart.schema';
// import { CartItem } from 'src/cart/schema/cart-item.schema';
import { Account_Status } from './schema/account-status.schema';

// import { BillingAddress } from 'src/order/schema/billing-address.schema';
// import { PaymentVerification } from 'src/order/schema/payment-verification.schema';
// import { Order } from 'src/order/schema/order.schema';

import { CreateUserDto } from './dto/create-user.dto';

const scrypt = promisify(_scrypt);

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Account_Status.name)
        private accountStatusModel: Model<Account_Status>,
        // @InjectModel(Cart.name) private cartModel: Model<Cart>,
        // @InjectModel(CartItem.name) private cartItemModel: Model<CartItem>,
        // @InjectModel(BillingAddress.name) private billingAddressModel: Model<BillingAddress>,
        // @InjectModel(PaymentVerification.name) private paymentVerificationModel: Model<PaymentVerification>,
        // @InjectModel(Order.name) private orderModule: Model<Order>,
    ) {}

    async findByEmail(email: string) {
        const user = await this.userModel
            .findOne({ email: email.toLowerCase() })
            .exec();
        return user;
    }

    async findByPhoneNumber(phone_number: string) {
        const user = await this.userModel
            .findOne({ phone_number: phone_number })
            .exec();
        return user;
    }

    async signUp(body: CreateUserDto): Promise<User> {
        const salt = randomBytes(8).toString('hex');

        const hash = (await scrypt(body.password, salt, 32)) as Buffer;

        const result = salt + '.' + hash.toString('hex');

        const accountStatus = await this.accountStatusModel.findOne({
            status: 'Good',
        });

        if (!accountStatus) {
            throw new InternalServerErrorException('Account status not found.');
        }

        const admin = new this.userModel({
            ...body,
            password: result,
            account_status_id: accountStatus._id,
        });
        await admin.save();

        return admin;
    }

    // async createEmptyCart(customer_id: any) {
    //     const cart = new this.cartModel({
    //         customer_id,
    //         cart_items: []
    //     })
    //     await cart.save();
    //     return cart;
    // }

    async signIn(body: { email: string; password: string }) {
        const user = await this.userModel.findOne({
            $or: [
                { email: body.email.toLowerCase() },
                { phone_number: body.email },
            ],
        });
        if (!user) {
            throw new InternalServerErrorException(
                `An account with this ${body.email} was not found. Please try a different sign in method or contact support if you are unable to access your account.`,
            );
        }

        const [salt, storedHash] = user.password.split('.');

        const hash = (await scrypt(body.password, salt, 32)) as Buffer;

        if (storedHash !== hash.toString('hex')) {
            throw new InternalServerErrorException('Bad password');
        }
        return user;
    }

    async findOneByEmailVerifyToken(token: string) {
        const user = this.userModel.findOne({
            email_verify_token: token,
            email_verify_token_expiration: { $gt: Date.now() },
        });
        return user;
    }

    async findOneByEmailResetToken(token: string) {
        const user = this.userModel.findOne({
            reset_token: token,
            reset_token_expiration: { $gt: Date.now() },
        });
        return user;
    }

    async findById(id: string) {
        const user = await this.userModel
            .findById(id)
            .populate({
                path: 'account_status_id',
                select: 'status',
            })
            .select(
                '_id first_name last_name email country_code phone_number avatar gender dob email_verify_datetime',
            );
        return user;
    }

    async findByIdAndDelete(id: string) {
        await this.userModel.findByIdAndDelete(id);
        return;
    }

    // async deleteCustomerCartAndCartItem(customer_id: any) {
    //     const cart = await this.cartModel.findOne({
    //         customer_id: customer_id
    //     });
    //     if (cart) {
    //         if (cart.cart_items.length > 0) {
    //             // Delete Many Cart-item
    //             await this.cartItemModel.deleteMany({
    //                 _id: { $in: cart.cart_items }
    //             });
    //         }
    //         // Delete Cart
    //         await this.cartModel.findOneAndDelete({ customer_id: customer_id });
    //     }
    //     return;
    // }

    // async deleteCustomerBillingAddress(customer_id: any) {
    //     await this.billingAddressModel.deleteMany({ customer_id: customer_id });
    //     return;
    // }

    // // ** Need to delete customer's order history and related payment information, including screenshot
    // async findCustomerOrderListAndDeleteRelatedDocs(customer_id: any) {
    //     const orders = await this.orderModule.find({ customer_id: customer_id }).select("_id shipping_address_id billing_address_id payment_verification_id");

    //     const orderIds = [];
    //     const billingAddressIds = [];
    //     const paymentVerificationIds = [];

    //     orders.forEach(order => {
    //         orderIds.push(order._id);
    //         billingAddressIds.push(order.billing_address_id);
    //         paymentVerificationIds.push(order.payment_verification_id);
    //     });

    //     const paymentVerifyDocs = await this.paymentVerificationModel.find({
    //         _id : { $in : paymentVerificationIds }
    //     }).exec();

    //     const ssFileNames = paymentVerifyDocs.map(doc => {
    //         return path.join(path.join(process.cwd(), 'uploads', 'screenshot'), doc.payment_screenshot);
    //     });

    //     // Delete Payment Verification Document
    //     await this.paymentVerificationModel.deleteMany({
    //         _id : { $in : paymentVerificationIds }
    //     }).exec();

    //     // Delete billing Address
    //     await this.billingAddressModel.deleteMany({
    //         _id : { $in : billingAddressIds }
    //     }).exec();

    //     // Delete Order
    //     await this.orderModule.deleteMany({
    //         _id : { $in : orderIds }
    //     }).exec();

    //     return {ssFileNames};
    // }
}
