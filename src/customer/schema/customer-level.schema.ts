import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Level {
    Normal = 'Normal',
    Royal = 'Royal',
    Vip = 'Vip',
}

@Schema({ timestamps: true })
export class Customer_Level extends Document {
    @Prop({ required: true, enum: Level, default: Level.Normal })
    level: Level;

    @Prop({ type: String, default: null })
    description: string;
}

export const CustomerLevelSchema = SchemaFactory.createForClass(Customer_Level);
