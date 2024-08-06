import * as mongoose from 'mongoose';
import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    MinLength,
    Matches,
    IsString,
    IsMongoId,
} from 'class-validator';

export class CreateShippingAddressDto {
    @ApiProperty({ example: 'Myanmar' })
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiProperty({ example: 'Yangon' })
    @IsString()
    @IsNotEmpty()
    region: string;

    @ApiProperty({ example: 'C0 Sai' })
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({ example: 'last name' })
    @IsString()
    @IsOptional()
    last_name: string;

    @ApiProperty({ example: 'Korea' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ example: 'San Chaung' })
    @IsString()
    @IsNotEmpty()
    township: string;

    @ApiProperty({ example: 'Yangon' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ example: '+95' })
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @ApiProperty({ example: '925000000' })
    @IsString()
    @IsNotEmpty()
    phone_number: string;
}
