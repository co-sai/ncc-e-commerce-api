import * as mongoose from 'mongoose';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    ValidateNested,
    IsArray,
    IsMongoId,
    IsNumber,
    IsBoolean,
} from 'class-validator';
import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWishList {
    // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' })
    // @IsNotEmpty()
    // @IsMongoId()
    // @Type(() => mongoose.Types.ObjectId)
    // customer_id: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
    @IsNotEmpty()
    @IsMongoId()
    @Type(() => mongoose.Types.ObjectId)
    product_id: mongoose.Types.ObjectId;
}
