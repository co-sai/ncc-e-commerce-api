import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerShippingAddress } from './controllers/customer.shippingaddress.controller';
import { CustomerWishListController } from './controllers/customer.wishlist.controller';
import { CustomerService } from './customer.service';
import { Customer, CustomerSchema } from './schema/customer.schema';
import {
    Customer_Level,
    CustomerLevelSchema,
} from './schema/customer-level.schema';
import {
    Shipping_Address,
    ShippingAddressSchema,
} from './schema/shipping-address.schema';
import { WishList, WishListSchema } from './schema/wish-list.schema';
import { ProductModule } from 'src/product/product.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Customer.name, schema: CustomerSchema },
            { name: Customer_Level.name, schema: CustomerLevelSchema },
            { name: Shipping_Address.name, schema: ShippingAddressSchema },
            { name: WishList.name, schema: WishListSchema },
        ]),
        ProductModule
    ],
    controllers: [CustomerShippingAddress, CustomerWishListController],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule {}
