import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

function toLower(val: string): string {
    return val.toLowerCase();
}

@Schema({ timestamps : true })
export class Variant extends Document {
    @Prop({ required: true, set: toLower })
    name: string;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
