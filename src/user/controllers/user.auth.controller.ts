import * as fs from 'fs';
import * as util from 'util';
import { promisify } from 'util';
import * as path from 'path';
import { extname } from 'path';
import * as crypto from 'crypto';
import { diskStorage } from 'multer';
import { Request as ExpressRequest } from 'express';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiConsumes,
    ApiProperty,
    ApiQuery,
} from '@nestjs/swagger';
import {
    FileInterceptor,
    FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    InternalServerErrorException,
    UseFilters,
    Request,
    Query,
    HttpCode,
} from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { CustomerService } from 'src/customer/customer.service';
import { CartService } from 'src/cart/cart.service';

import { FileUtilsService } from 'src/utils/file-utils.service';
import { MailService } from 'src/mail/services/mail.service';
import { FileService } from '../../common/file/file.service';

const scrypt = promisify(_scrypt);

@ApiTags('User Authentication')
@Controller('auth/user')
export class UserAuthController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly customerService: CustomerService,
        private readonly cartService: CartService,
        private readonly fileService: FileService,
        private readonly mailService: MailService,
    ) {}

    @Post('signup')
    @HttpCode(201)
    @ApiOperation({ summary: 'User Register' })
    @ApiResponse({ status: 201, description: 'Sign-up Successful' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateUserDto })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
    async signup(
        @Body() body: CreateUserDto,
        @UploadedFiles() files: { avatar?: Express.Multer.File },
    ) {
        let filenames: string[] = [];
        try {
            const uploadFolder = path.join(process.cwd(), 'uploads', 'user');
            if (files.avatar) {
                filenames.push(
                    path.join(uploadFolder, files.avatar[0].filename),
                );
            }

            if (!body.email && !body.phone_number) {
                await this.fileService.deleteFiles(filenames);
                throw new InternalServerErrorException(
                    'Either email or phone number must be provided',
                );
            }

            if (body.email) {
                const exUser = await this.userService.findByEmail(body.email);
                if (exUser) {
                    await this.fileService.deleteFiles(filenames);
                    throw new InternalServerErrorException(
                        'Email is already registered.',
                    );
                }
            }

            if (body.phone_number) {
                const exUser = await this.userService.findByPhoneNumber(
                    body.phone_number,
                );
                if (exUser) {
                    await this.fileService.deleteFiles(filenames);
                    throw new InternalServerErrorException(
                        'Phone number is already registered.',
                    );
                }
            }

            const user = await this.userService.signUp(body);

            if (files.avatar) {
                const uniqueSuffix = Math.floor(
                    100000 + Math.random() * 900000,
                );
                const avatarFileName = await this.fileService.generateFileName(
                    `${user._id}-${uniqueSuffix}-${files.avatar[0].originalname}`,
                    files.avatar[0],
                    'uploads/user',
                );
                user.avatar = `uploads/user/${avatarFileName}`;
            }
            await user.save();

            /* Start - Save user_id into customer table */
            const customer = await this.customerService.createCustomer(
                user._id,
            );

            // Create Empty Cart
            await this.cartService.createEmptyCart(customer._id);
            /* End - Save user_id into customer table */

            /* Start - Send Mail Verification link */
            if (user.email) {
                const token = crypto.randomBytes(32).toString('hex');

                user.email_verify_token = token;
                user.email_verify_token_expiration = new Date(
                    Date.now() + 3600000,
                );
                await user.save();

                await this.mailService.sendVerificationMail(
                    token,
                    user.email,
                    'Verify your mail',
                    'Verify your mail',
                );
            }
            /* End - Send Mail Verification link */

            const { access_token } = await this.authService.generateToken(user);

            const {
                password,
                reset_token,
                reset_token_expiration,
                email_verify_datetime,
                phone_number_verify_datetime,
                account_status_id,
                email_verify_token,
                email_verify_token_expiration,
                ...result
            } = user.toJSON();

            return {
                message: `Sign Up successful. Please check your email (${user.email}) to confirm your account.`,
                data: {
                    result,
                    access_token,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    @Post('signin')
    @HttpCode(200)
    @ApiOperation({ summary: 'User Login' })
    @ApiResponse({ status: 201, description: 'Sign-In Successful' })
    @ApiBody({
        description: 'User login data',
        required: true,
        examples: {
            example1: {
                summary: 'User login example',
                value: {
                    email: 'user@example.com',
                    password: 'password123',
                },
            },
        },
    })
    async signIn(@Body() body: { email: string; password: string }) {
        // email can be Email or Phone_Number
        const user = await this.userService.signIn(body);
        if (!user) {
            throw new InternalServerErrorException('Account not found.');
        }
        const { access_token } = await this.authService.generateToken(user);
        const {
            password,
            reset_token,
            reset_token_expiration,
            email_verify_datetime,
            phone_number_verify_datetime,
            account_status_id,
            email_verify_token,
            email_verify_token_expiration,
            ...result
        } = user.toJSON();

        return {
            message: 'Sign-In successful',
            data: {
                result,
                access_token,
            },
        };
    }

    // Need to implement If user have only phone_number
    // Send otp sms to user's phone_number

    @ApiOperation({ summary: 'Forget Password' })
    @ApiResponse({
        status: 200,
        description: 'Check your mail for a link to reset your password',
    })
    @ApiBody({
        required: true,
        examples: {
            example1: {
                summary: 'Forget Password example',
                value: {
                    email: 'user@example.com',
                },
            },
        },
    })
    @Post('forget-password')
    async forgetPassword(@Body() body: { email: string }) {
        const email = body.email;

        const account = await this.userService.findByEmail(email);
        if (!account) {
            throw new InternalServerErrorException('Account not found.');
        }

        const reset_token = crypto.randomBytes(32).toString('hex');

        account.reset_token = reset_token;
        account.reset_token_expiration = new Date(Date.now() + 3600000);
        await account.save();

        // Need to pass base url for /auth/admin/
        const route = 'auth/user';
        const template = 'reset-password.template.html';
        await this.mailService.sendMail(
            route,
            template,
            reset_token,
            account.email,
            'Reset your password',
            'Reset your password',
        );
        console.log('run');
        return {
            message: 'Check your mail for a link to reset your password',
        };
    }

    @ApiOperation({ summary: 'Reset Password' })
    @ApiResponse({
        status: 200,
        description: 'Password has been updated successfully.',
    })
    @ApiBody({
        required: true,
        examples: {
            example1: {
                summary: 'Reset Password example',
                value: {
                    reset_token: 'token',
                    password: 'password',
                },
            },
        },
    })
    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        const token = body.reset_token;
        const newPassword = body.password;

        const account = await this.userService.findOneByEmailResetToken(token);

        if (!account) {
            throw new InternalServerErrorException('Account not found.');
        }

        const salt = randomBytes(8).toString('hex');

        const hash = (await scrypt(newPassword, salt, 32)) as Buffer;

        const result = salt + '.' + hash.toString('hex');

        account.password = result;
        account.reset_token = null;
        account.reset_token_expiration = null;

        await account.save();

        const { access_token } = await this.authService.generateToken(account);
        const {
            password,
            reset_token,
            reset_token_expiration,
            email_verify_datetime,
            phone_number_verify_datetime,
            account_status_id,
            email_verify_token,
            email_verify_token_expiration,
            ...user
        } = account.toJSON();
        return {
            message: 'Password has been updated successfully.',
            data: {
                user,
                access_token,
            },
        };
    }

    @Get('email-verification')
    @HttpCode(200)
    @ApiOperation({ summary: 'Email Verification' })
    @ApiResponse({ status: 200, description: 'Email verified.' })
    @ApiQuery({
        name: 'token',
        required: true,
        description: 'token to verify email',
        example: 'token',
    })
    async verifyUserEmail(@Query() query: any) {
        const user = await this.userService.findOneByEmailVerifyToken(
            query.token,
        );

        if (!user) {
            throw new InternalServerErrorException('Account not found.');
        }
        user.email_verify_datetime = new Date();
        user.email_verify_token = null;
        user.email_verify_token_expiration = null;

        await user.save();

        const { access_token } = await this.authService.generateToken(user);

        const {
            password,
            reset_token,
            reset_token_expiration,
            email_verify_datetime,
            phone_number_verify_datetime,
            account_status_id,
            email_verify_token,
            email_verify_token_expiration,
            ...result
        } = user.toJSON();

        return {
            message: 'Email verified.',
            data: {
                result,
                access_token,
            },
        };
    }
}
