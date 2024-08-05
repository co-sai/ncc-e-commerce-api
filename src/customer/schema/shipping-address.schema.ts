import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Shipping_Address extends Document {
    @Prop({ required: true })
    country: string;

    @Prop({ required: true })
    region: string;

    @Prop({ required: true })
    first_name: string;

    @Prop({ default: null })
    last_name: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    township: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    country_code: string;

    @Prop({ required: true })
    phone_number: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    customer_id: mongoose.Types.ObjectId;
}

export const ShippingAddressSchema =
    SchemaFactory.createForClass(Shipping_Address);
