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
    IsInt,
} from 'class-validator';
import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
    @ApiProperty({ example: 'Computer' })
    @IsString()
    @IsOptional()
    title: string;

    @ApiProperty({ example: 'Electronic computer...' })
    @IsString()
    @IsOptional()
    content: string;

    @ApiProperty({ example: 9999 })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    price: number;

    @ApiProperty({ example: 9999 })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    quantity: number;

    @IsString()
    @IsOptional()
    rank: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    @IsNotEmpty()
    @IsMongoId()
    @Type(() => mongoose.Types.ObjectId)
    category_id: mongoose.Types.ObjectId;

    /** These two are one pair => medias and mediasIndices */
    medias?: Express.Multer.File[];

    medias_to_remove?: any;
}
