import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserAuthController } from './controllers/user.auth.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schema/user.schema';
import {
    Account_Status,
    AccountStatusSchema,
} from './schema/account-status.schema';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from 'src/auth/auth.module';
import { CustomerModule } from 'src/customer/customer.module';
import { MailModule } from 'src/mail/mail.module';
// import { CartModule } from 'src/cart/cart.module';

import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

import { FileUtilsService } from 'src/utils/file-utils.service';
import { CommonModule } from 'src/common/common.module';
import { CartModule } from 'src/cart/cart.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './user.multer.config';
// import { Cart, CartSchema } from 'src/cart/schema/cart.schema';
// import { CartItem, CartItemSchema } from 'src/cart/schema/cart-item.schema';
// import { BillingAddress, BillingAddressSchema } from 'src/order/schema/billing-address.schema';
// import { Order, OrderSchema } from 'src/order/schema/order.schema';
// import { PaymentVerification, PaymentVerificationSchema } from 'src/order/schema/payment-verification.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Account_Status.name, schema: AccountStatusSchema },
            // { name: Cart.name, schema: CartSchema },
            // { name: CartItem.name, schema: CartItemSchema },
            // { name: Order.name, schema: OrderSchema },
            // { name: PaymentVerification.name, schema: PaymentVerificationSchema },
            // { name : BillingAddress.name, schema : BillingAddressSchema},
        ]),
        forwardRef(() => AuthModule),
        forwardRef(() => CustomerModule),
        forwardRef(() => CartModule),
        MailModule,
        CommonModule,
        MulterModule.register(multerConfig),
    ],
    controllers: [UserController, UserAuthController],
    providers: [UserService, FileUtilsService, JwtStrategy, JwtModule],
    exports: [UserService],
})
export class UserModule {}
