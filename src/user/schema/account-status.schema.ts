import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Status {
    Good = 'Good',
    Warning = 'Warning',
    Restrict = 'Restrict',
}

@Schema({ timestamps: true })
export class Account_Status extends Document {
    @Prop({ required: true, enum: Status, default: Status.Good })
    status: Status;

    @Prop()
    description: string;
}

export const AccountStatusSchema = SchemaFactory.createForClass(Account_Status);
