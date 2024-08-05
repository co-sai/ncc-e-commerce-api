import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    Customer_Level,
    Level,
} from 'src/customer/schema/customer-level.schema';

@Injectable()
export class CustomerLevelSeedingService implements OnModuleInit {
    constructor(
        @InjectModel(Customer_Level.name)
        private readonly accountStatusModel: Model<Customer_Level>,
    ) {}

    async onModuleInit() {
        await this.seed();
    }

    async seed() {
        const existing = await this.accountStatusModel.find().exec();
        if (existing.length === 0) {
            await this.accountStatusModel.insertMany([
                { status: Level.Normal, description: 'Normal customer.' },
                { status: Level.Royal, description: 'Royal customer.' },
                { status: Level.Vip, description: 'VIP customer.' },
            ]);
            console.log('Seed Customer Level data inserted');
        } else {
            console.log('Seed Customer Level data already exists');
        }
    }
}
