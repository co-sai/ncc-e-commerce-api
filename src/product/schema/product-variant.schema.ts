import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

function toLower(val: string): string {
    return val.toLowerCase();
}

@Schema({ timestamps : true })
export class ProductVariant extends Document {
    @Prop({ required: true, set : toLower })
    value: string;

    @Prop({ default: null })
    price: number;

    @Prop({ default: null })
    image: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
    product_id: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true })
    variant_id: mongoose.Types.ObjectId;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
