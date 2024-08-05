import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Post,
    Request,
    UseGuards,
    Delete,
    Patch,
} from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { CreateShippingAddressDto } from '../dto/create-shipping-address.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface CustomRequest extends ExpressRequest {
    user: {
        _id: string;
        email: string;
    };
}

@ApiTags('Customer Shipping Address')
@UseGuards(JwtAuthGuard)
@Controller('customer/shipping-address')
export class CustomerShippingAddress {
    constructor(private readonly customerService: CustomerService) {}

    @Get('')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Customer shipping address list' })
    @ApiResponse({ status: 200, description: 'Customer shipping address list' })
    async shippingAddressList(@Request() req: CustomRequest) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Customer not found.');
        }
        const shippingAddress =
            await this.customerService.findShippingAddressByCustomerId(
                customer._id,
            );

        return {
            data: {
                shippingAddress,
            },
        };
    }

    @Post('add')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create shipping address' })
    @ApiResponse({
        status: 201,
        description: 'Shipping address has been created.',
    })
    @ApiBody({ type: CreateShippingAddressDto })
    async createShippingAddress(
        @Request() req: CustomRequest,
        @Body() body: CreateShippingAddressDto,
    ) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);
        if (!customer) {
            throw new InternalServerErrorException('Customer not found.');
        }
        const shippingAddress =
            await this.customerService.createShippingAddress(
                body,
                customer._id,
            );

        return {
            message: 'Shipping address has been created.',
            data: {
                shippingAddress,
            },
        };
    }

    @Patch('/:id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Updated shipping address' })
    @ApiResponse({
        status: 200,
        description: 'Shipping address has been updated.',
    })
    @ApiBody({ type: CreateShippingAddressDto })
    async updateShippingAddress(
        @Request() req: CustomRequest,
        @Param('id') id: string,
        @Body() body: Partial<CreateShippingAddressDto>,
    ) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);

        const shippingAddress =
            await this.customerService.findShippingAddressById(id);
        if (!shippingAddress) {
            throw new InternalServerErrorException(
                'Shipping address not found.',
            );
        }
        if (
            shippingAddress.customer_id.toString() !== customer._id.toString()
        ) {
            throw new InternalServerErrorException(
                'You are not allowed to update this shipping address.',
            );
        }

        Object.assign(shippingAddress, body);
        await shippingAddress.save();

        return {
            message: 'Shipping address has been updated successfully.',
            data: {
                shippingAddress,
            },
        };
    }

    @Delete('/:id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Delete shipping address' })
    @ApiResponse({
        status: 200,
        description: 'Address has been deleted successfully.',
    })
    async deleteShippingAddress(
        @Request() req: CustomRequest,
        @Param('id') id: string,
    ) {
        const user_id = req.user._id;
        const customer =
            await this.customerService.findCustomerByUserId(user_id);

        const shippingAddress =
            await this.customerService.findShippingAddressById(id);
        if (!shippingAddress) {
            throw new InternalServerErrorException(
                'Shipping address not found.',
            );
        }
        if (
            shippingAddress.customer_id.toString() !== customer._id.toString()
        ) {
            throw new InternalServerErrorException(
                'You are not allowed to delete this shipping address.',
            );
        }
        await this.customerService.findShippingAddressByIdAndDelete(id);

        return {
            message: 'Address has been deleted successfully.',
        };
    }
}
