import * as mongoose from 'mongoose';
import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsArray, IsMongoId, IsNumber, IsBoolean, IsInt  } from "class-validator";
import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ example: 'Computer'})
    @IsString()
    @IsNotEmpty()
    title : string;

    @ApiProperty({ example: 'Electronic computer...'})
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: 9999 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: 9999 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    quantity: number;

    @IsString()
    @IsNotEmpty()
    rank: string;

    @IsString()
    @IsOptional()
    has_variant: string
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    @IsNotEmpty()
    @IsMongoId()
    @Type(() => mongoose.Types.ObjectId)
    category_id: mongoose.Types.ObjectId;
}
