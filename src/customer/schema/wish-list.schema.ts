import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WishList extends Document {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    customer_id: mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    })
    product_id: mongoose.Types.ObjectId;
}

export const WishListSchema = SchemaFactory.createForClass(WishList);
