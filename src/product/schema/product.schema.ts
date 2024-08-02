import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Product extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    quantity: number;

    @Prop({ default: 0 })
    view: number;

    @Prop({ required: true, default : 1 })
    rank: number;

    @Prop({ default: false })
    has_variant: boolean
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category_id: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
    admin_id: mongoose.Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
