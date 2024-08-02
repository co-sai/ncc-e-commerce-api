import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schema/product.schema';
import { Media } from './schema/media.schema';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>,
        @InjectModel(Media.name) private mediaModel: Model<Media>
    ) { }

    async createProduct(body: CreateProductDto, admin_id: string) {
        const product = new this.productModel({
            ...body, admin_id
        });
        return await product.save();
    }

    async createMedias(media_files_names: string[], product_id: any) {
        const mediaDocs = media_files_names.map(path => ({ path, product_id }));
        const medias = await this.mediaModel.insertMany(mediaDocs);
        return medias.map(media => ({ _id: media._id, path: media.path }));
    }

    async findById(id: string): Promise<Product> {
        return await this.productModel.findById(id).exec();
    }

    async findMediasByProductId(product_id: any) {
        return await this.mediaModel.find({ product_id: product_id }).select("_id path").exec();
    }

    async findMediasByProductIds(productIds: any) {
        return this.mediaModel.find({ product_id: { $in: productIds } }).exec();
    }

    async findByIdAndUpdate(id: string, body: any) {
        const product = await this.productModel.findByIdAndUpdate(id, body, { new: true }).exec();
        return product;
    }

    async findMediasByMediasIds(ids: any) {
        return this.mediaModel.find({ _id: { $in: ids } }).exec();
    }

    async findMediasByIdsAndDeleteMany(ids: any) {
        return this.mediaModel.deleteMany({ _id: { $in: ids } }).exec();
    }

    async filterAndSortProducts(q: string, limit: number, page: number, random: Boolean): Promise<{ products: Product[], total_count: number }> {

        let products: Product[];
        const skip = (page - 1) * limit;
        const total_count = await this.productModel.countDocuments().exec();

        if (random) {
            const randomIndices = new Set<number>();

            while (randomIndices.size < Math.min(limit, total_count)) {
                randomIndices.add(Math.floor(Math.random() * total_count));
            }

            const productPromises = Array.from(randomIndices).map(skip =>
                this.productModel.findOne().skip(skip).select("title content main_media view rank").exec()
            );

            products = await Promise.all(productPromises);
        } else {
            let sortOrder: { [key: string]: 1 | -1 } = { view: -1 };

            if (q === 'rank') {
                sortOrder = { rank: 1 };
            } else if (q === 'latest' || q === 'new') {
                sortOrder = { createdAt: -1 }; // sorting by latest products
            }

            products = await this.productModel.find()
                .sort(sortOrder)
                .select("title content main_media view rank")
                .limit(limit)
                .skip(skip)
                .exec();
        }

        return { products, total_count };
    }

    /** Find Blog for category detail  using pagination */
    async findProductsByCategoryId(id: string, page: number, limit: number
    ) {
        const products = await this.productModel.find({ category_id: id })
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();
        const total_count = await this.productModel.find({ category_id: id }).countDocuments();

        return { products, total_count };
    }

    /** Just get product ids */
    async findProductIdsByCategoryId(id: string) {
        const result = await this.productModel.find({ category_id: id }).select("_id");
        return result;
    }

    async deleteByCategoryId(categoryId: string): Promise<void> {
        await this.productModel.deleteMany({ category_id: categoryId }).exec();
    }

    async findOneProductByCategoryId(category_id: any) {
        const product = await this.productModel.findOne({ category_id: category_id }).sort({ createdAt: -1 }).exec();
        if (product) {
            const medias = await this.findMediasByProductId(product._id);
            return {
                ...product.toObject(),
                medias: medias.map(media => ({ _id: media._id, path: media.path }))
            };
        }
        return null;
    }

    async filterByName(q: string, category_id: string, page: number, limit: number): Promise<{ products: Product[], total_count: number }> {
        const searchTerm = q.trim();
        if (!searchTerm) {
            return { products: [], total_count: 0 };
        }
        // Build the query condition
        const queryCondition: any = {
            title: { $regex: new RegExp(searchTerm, 'i') }
        };

        if (category_id) {
            queryCondition.category_id = category_id;
        }

        const products = await this.productModel.find(queryCondition)
            .select("_id title price")
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const total_count = await this.productModel.find(queryCondition).countDocuments();

        return { products, total_count };
    }

    async findByIdAndDelete(id: string) {
        await this.productModel.findByIdAndDelete(id);
    }
}
