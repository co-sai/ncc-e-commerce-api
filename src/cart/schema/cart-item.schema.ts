import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CartItem extends Document {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    })
    product_id: mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    customer_id: mongoose.Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unit_price: number;

    @Prop({ required: true })
    total_price: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
