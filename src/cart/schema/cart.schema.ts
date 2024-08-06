import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Cart extends Document {
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CartItem' }] })
    cart_items: mongoose.Types.ObjectId[];

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    customer_id: mongoose.Types.ObjectId;

    @Prop({ default: 0 })
    total_price: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
