import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Customer_Level,
    CustomerLevelSchema,
} from 'src/customer/schema/customer-level.schema';
import { CustomerLevelSeedingService } from './customer-level.seed.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Customer_Level.name, schema: CustomerLevelSchema },
        ]),
    ],
    providers: [CustomerLevelSeedingService],
})
export class CustomerLevelSeedModule {}
