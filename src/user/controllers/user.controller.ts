import * as fs from 'fs';
import * as path from 'path';
import { extname } from 'path';
import { diskStorage } from 'multer';
import {
    Controller,
    UseGuards,
    UseFilters,
    Get,
    Patch,
    Request,
    InternalServerErrorException,
    UseInterceptors,
    Param,
    Body,
    UploadedFiles,
    Delete,
} from '@nestjs/common';

import { UserService } from '../user.service';
import { CustomerService } from 'src/customer/customer.service';
import { CreateUserDto } from '../dto/create-user.dto';

import { FileUtilsService } from 'src/utils/file-utils.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
    FileInterceptor,
    FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import { FileService } from 'src/common/file/file.service';
import { RequestInterface } from 'src/interface/request.interface';
import { CartService } from 'src/cart/cart.service';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
// @UseFilters(ErrorExceptionFilter)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly customerService: CustomerService,
        private readonly cartService: CartService,
        private readonly fileUtilsService: FileUtilsService,
        private readonly fileService: FileService,
    ) {}

    @Get('profile')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'User Profile' })
    @ApiResponse({ status: 201, description: 'User profile data.' })
    async userProfile(@Request() req: RequestInterface) {
        const user_id = req.user._id;
        const user = await this.userService.findById(user_id);
        if (!user) {
            throw new InternalServerErrorException('Account not found.');
        }
        return {
            data: {
                user,
            },
        };
    }

    @Patch('/:id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiResponse({
        status: 200,
        description: 'Profile has been updated successfully.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Update User Profile',
        schema: {
            type: 'object',
            properties: {
                first_name: { type: 'string', nullable: true },
                last_name: { type: 'string', nullable: true },
                email: { type: 'string', nullable: true },
                country_code: { type: 'string', nullable: true },
                phone_number: { type: 'string', nullable: true },
                gender: { type: 'string', nullable: true },
                dob: { type: 'string', nullable: true },
                avatar: { type: 'string', format: 'binary', nullable: true },
            },
        },
    })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
    async userUpdateProfile(
        @Param('id') id: string,
        @Body() body: Partial<CreateUserDto>,
        @UploadedFiles() files: { avatar?: Express.Multer.File },
        @Request() req: RequestInterface,
    ) {
        const user_id = req.user._id;
        let filenames: string[] = [];
        try {
            const uploadFolder = path.join(process.cwd(), 'uploads', 'user');
            if (files.avatar) {
                filenames.push(
                    path.join(uploadFolder, files.avatar[0].filename),
                );
            }

            const user = await this.userService.findById(id);
            if (!user) {
                await this.fileService.deleteFiles(filenames);
                throw new InternalServerErrorException('Account not found.');
            }
            if (user._id.toString() !== user_id.toString()) {
                await this.fileService.deleteFiles(filenames);
                throw new InternalServerErrorException(
                    "You are not allowed to modify other user's data.",
                );
            }

            if (body.email) {
                if (user.email !== body.email.toLowerCase()) {
                    const user = await this.userService.findByEmail(body.email);
                    if (user) {
                        await this.fileService.deleteFiles(filenames);
                        throw new InternalServerErrorException(
                            'E-mail are already in used. Try with another one.',
                        );
                    }
                }
            }
            if (body.phone_number) {
                if (user.phone_number !== body.phone_number) {
                    const user = await this.userService.findByPhoneNumber(
                        body.phone_number,
                    );
                    if (user) {
                        await this.fileService.deleteFiles(filenames);
                        throw new InternalServerErrorException(
                            'Phone number are already in used. Try with another one.',
                        );
                    }
                }
            }

            const { avatar, ...userBody } = body;
            Object.assign(user, userBody);

            if (files.avatar) {
                // check old file and delete it
                if (user.avatar) {
                    await this.fileService.deleteFiles([
                        path.join(process.cwd(), user.avatar),
                    ]);
                }

                const uniqueSuffix = Math.floor(
                    100000 + Math.random() * 900000,
                );
                const avatarFileName = await this.fileService.generateFileName(
                    `${user._id}-${uniqueSuffix}-${files.avatar[0].originalname}`,
                    files.avatar[0],
                    'uploads/user',
                );
                user.avatar = `uploads/user/${avatarFileName}`;
            } else {
                user.avatar = user.avatar;
            }
            await user.save();

            return {
                message: 'Profile has been updated successfully.',
                data: {
                    user,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    @Delete('/:id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Delete user profile.' })
    @ApiResponse({ status: 200, description: 'Account has been deleted.' })
    async deleteAccount(
        @Param('id') id: string,
        @Request() req: RequestInterface,
    ) {
        const user_id = req.user._id;

        const user = await this.userService.findById(id);
        if (!user) {
            throw new InternalServerErrorException('Account not found.');
        }
        if (user._id.toString() !== user_id.toString()) {
            throw new InternalServerErrorException(
                "You are not allowed to delete other user's data.",
            );
        }

        const uploadFolder = path.join(process.cwd(), 'uploads', 'user');
        let filenames: string[] = [];
        if (user.avatar) {
            filenames.push(path.join(process.cwd(), user.avatar));
        }

        await this.fileService.deleteFiles(filenames);

        // remove customer's wishlist, cart, cart-item, shipping address and billing-address

        const customer = await this.customerService.findCustomerByUserId(id);
        if (customer) {
            // Delete customer's wishlist
            await this.customerService.findWishListByCustomerIdAndDeleteMany(
                customer._id,
            );

            // Delete customer's shipping address
            await this.customerService.findShippingAddressByCustomerIdAndDeleteMany(
                customer._id,
            );

            // Delete customer's Cart and Cart-Item
            await this.cartService.deleteCustomerCartAndCartItem(customer._id);

            // ** Need to delete customer billing address
            // await this.userService.deleteCustomerBillingAddress(customer._id);
            // ** Need to delete customer's order history and related payment information, including screenshot
            // const { ssFileNames } = await this.userService.findCustomerOrderListAndDeleteRelatedDocs(customer._id);

            // if (ssFileNames.length > 0) {
            //     await this.fileUtilsService.deleteFiles(ssFileNames);
            // }
        }

        await this.userService.findByIdAndDelete(id);

        await this.customerService.findByUserIdAndDelete(id);

        return {
            message: 'Account has been deleted.',
        };
    }
}
