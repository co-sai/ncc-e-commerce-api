import mongoose, { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<Category>,
    ) {}

    async create(categoryDto: CreateCategoryDto): Promise<Category> {
        const createdCategory = new this.categoryModel(categoryDto);
        return await createdCategory.save();
    }

    async findOne(id: any): Promise<Category> {
        return await this.categoryModel.findById(id).exec();
    }

    async findAll() {
        return await this.categoryModel.find().exec();
    }

    async update(
        id: string,
        categoryDto: Partial<CreateCategoryDto>,
    ): Promise<Category> {
        return await this.categoryModel
            .findByIdAndUpdate(id, categoryDto, { new: true })
            .exec();
    }

    async findByIdAndDelete(id: string) {
        return await this.categoryModel.findByIdAndDelete(id).exec();
    }
}

/**
 * 
 * {
    "data": [
        {
            "_id": "66ab04be0f73c063630eb30a",
            "name": "Xiaomi",
            "description": "Xiaomi Product",
            "parent_category_id": null,
            "createdAt": "2024-08-01T03:45:02.040Z",
            "updatedAt": "2024-08-01T03:45:02.040Z",
            "__v": 0,
            product: {
            ...
            }
        },
        {
            "_id": "66ab04c40f73c063630eb30c",
            "name": "Oppo",
            "description": "Oppo Product",
            "parent_category_id": null,
            "createdAt": "2024-08-01T03:45:08.149Z",
            "updatedAt": "2024-08-01T03:45:08.149Z",
            "__v": 0,
            product: {
            ...
            }
        }
    ]
}
 */
