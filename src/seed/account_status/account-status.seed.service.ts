import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    AccountStatusSchema,
    Account_Status,
    Status,
} from 'src/user/schema/account-status.schema';

@Injectable()
export class SeedingService implements OnModuleInit {
    constructor(
        @InjectModel(Account_Status.name)
        private readonly accountStatusModel: Model<Account_Status>,
    ) {}

    async onModuleInit() {
        await this.seed();
    }

    async seed() {
        const existing = await this.accountStatusModel.find().exec();
        if (existing.length === 0) {
            await this.accountStatusModel.insertMany([
                {
                    status: Status.Good,
                    description: 'Account is in good standing.',
                },
                {
                    status: Status.Warning,
                    description: 'Account has a warning.',
                },
                {
                    status: Status.Restrict,
                    description: 'Account is restricted.',
                },
            ]);
            console.log('Seed Account Status data inserted');
        } else {
            console.log('Seed Account Status data already exists');
        }
    }
}
