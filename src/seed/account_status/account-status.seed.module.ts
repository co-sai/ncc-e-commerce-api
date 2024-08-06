import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Account_Status,
    AccountStatusSchema,
} from 'src/user/schema/account-status.schema';
import { SeedingService } from './account-status.seed.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Account_Status.name, schema: AccountStatusSchema },
        ]),
    ],
    providers: [SeedingService],
})
export class AccountStatusSeedModule {}
