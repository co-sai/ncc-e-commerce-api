import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schema/cart.schema';
import { CartItem, CartItemSchema } from './schema/cart-item.schema';
import { CustomerModule } from 'src/customer/customer.module';
import { ProductModule } from 'src/product/product.module';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        forwardRef(() => ProductModule),
        forwardRef(() => CustomerModule),
        forwardRef(() => UserModule),
        MongooseModule.forFeature([
            { name: Cart.name, schema: CartSchema },
            { name: CartItem.name, schema: CartItemSchema },
        ]),
    ],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService],
})
export class CartModule {}
