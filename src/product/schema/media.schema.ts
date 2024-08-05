import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'medias' })
export class Media extends Document {
    @Prop({ required: true })
    path: string; // "uploads/blog_id/image_id.jpeg"

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    })
    product_id: mongoose.Types.ObjectId;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
