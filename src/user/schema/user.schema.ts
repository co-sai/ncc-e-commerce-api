import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

function toUpper(val: string): string {
    return val.toUpperCase();
}
function toLower(val: string): string {
    return val.toLowerCase();
}

export enum Gender {
    Male = 'Male',
    Female = 'Female',
    Transgender = 'Transgender',
    NonBinary = 'NonBinary',
    Other = 'Other',
}

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    first_name: string;

    @Prop()
    last_name: string;

    @Prop({ unique: true, set: toLower, sparse: true })
    email?: string;

    @Prop({ default: null })
    country_code: string;

    @Prop({ unique: true, sparse: true })
    phone_number?: string;

    @Prop({ default: null })
    avatar: string;

    @Prop({ type: String, enum: Gender, required: true })
    gender: Gender;

    @Prop({ required: true, type: Date })
    dob: Date;

    @Prop({ default: null })
    email_verify_datetime?: Date;

    @Prop({ default: null })
    phone_number_verify_datetime?: Date;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account_Status',
        required: true,
    })
    account_status_id: mongoose.Types.ObjectId;

    @Prop({ required: true })
    password: string;

    @Prop({ default: null })
    email_verify_token: string;

    @Prop({ default: null })
    email_verify_token_expiration: Date;

    @Prop({ default: null })
    reset_token: string;

    @Prop({ default: null })
    reset_token_expiration: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
