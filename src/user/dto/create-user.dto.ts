import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    MinLength,
    Matches,
    IsString,
    IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../schema/user.schema';

export class CreateUserDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    @IsOptional()
    last_name: string;

    @ApiProperty({ example: 'john@gmail.com' })
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty({ example: '+95' })
    @IsString()
    @IsOptional()
    country_code: string;

    @ApiProperty({ example: '925000000' })
    @IsString()
    @IsOptional()
    phone_number: string;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    avatar?: any;

    @ApiProperty({ example: 'Male' })
    @IsString()
    gender: Gender;

    @ApiProperty({ example: '1996-10-12' })
    @IsString()
    dob: String;

    @ApiProperty({ example: 'Pass@Word123' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/(?=.*[a-zA-Z])/, {
        message: 'Password must contain at least one letter',
    })
    @Matches(/(?=.*[0-9])/, {
        message: 'Password must contain at least one number',
    })
    @Matches(/(?=.*[!@#$%^&*])/, {
        message: 'Password must contain at least one special character',
    })
    password: string;
}
