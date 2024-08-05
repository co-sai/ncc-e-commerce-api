import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Product } from '../schema/product.schema';
import { Media } from '../schema/media.schema';
import { ProductVariant } from '../schema/product-variant.schema';
import { Variant } from '../schema/variant.schema';
@Injectable()
export class ProductVariantService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>,
        @InjectModel(Media.name) private mediaModel: Model<Media>,
        @InjectModel(ProductVariant.name) private productVariantModel: Model<ProductVariant>,
        @InjectModel(Variant.name) private variantModel: Model<Variant>
    ) { }

    async findVariantByName(name: string) {
        const variant = await this.variantModel.findOne({ name: name.trim().toLowerCase() });
        return variant;
    }

    async createVariant(name: string) {
        const variant = new this.variantModel({ name });
        await variant.save();
        return variant;
    }

    async createProductVariant({ value, price, product_id, variant_id }) {
        const productVariant = new this.productVariantModel({ value, price, product_id, variant_id });
        await productVariant.save();
        return productVariant;
    }

    async findProductVariant(product_id: string) {
        const result = await this.productVariantModel.find({ product_id: product_id })
            .populate("variant_id", "name")
            .select("value price media")
        return result;
    }

    async findProductVariantById(id: string) {
        return await this.productVariantModel.findById(id);
    }

    async deleteSingleVariant(id: string) {
        await this.productVariantModel.findByIdAndDelete(id);
        return;
    }

    async findProductVariantByProductIdAndDoGroup(product_id: string) {
        const result = await this.productVariantModel.aggregate([
            {
                $match: {
                    product_id: new mongoose.Types.ObjectId(product_id)
                }
            },
            {
                $lookup: {
                    from: 'variants', // Replace with the actual name of your variant metadata collection
                    localField: 'variant_id',
                    foreignField: '_id',
                    as: 'variant'
                }
            },
            {
                $unwind: '$variant'
            },
            {
                $group: {
                    _id: '$variant.name',
                    variants: {
                        $push: {
                            _id: '$_id',
                            value: '$value',
                            price: '$price',
                            image: '$media'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    variants: 1
                }
            }
        ]);

        // Format the result into the desired structure
        const formattedResult = {};
        result.forEach(item => {
            formattedResult[item.name] = item.variants;
        });

        return formattedResult;
    }

    async deleteProductVariantManyByPId(id: string) {
        await this.productVariantModel.deleteMany({ product_id: id });
        return;
    }

}
