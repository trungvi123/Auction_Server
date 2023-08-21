import { productModel } from "../model/productModel.js";
import { userModel } from "../model/userModel.js";
import { categoryModel } from "../model/categoryModel.js";



const getProductById = async (req, res) => {
    try {
        const id = req.params.id

        const data = await productModel.findById(id)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }

}

const getProducts = async (req, res) => {
    try {
        const quantity = parseInt(req.params.quantity)
        const data = await productModel.find().limit(quantity) || 5
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500)
    }
}

const getProductsByOwner = async (req, res) => {
    try {
        const id = req.params.id

        const data = await productModel.find({owner:id})
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}


const createProduct = async (req, res) => {
    try {

        const { name, price, endTime, basePrice, stepPrice, startTime, duration, owner, category, description } = req.body
        // owner => object id
        console.log(req.body);
        const proOwner = await userModel.findById(owner).select('_id ')
        const proCategory = await categoryModel.findById(category).select('_id')

        const images = req.files.map((file) => {
            return `${process.env.BASE_URL}/uploads/${file.filename}`
        });

        if (!proOwner) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Không tìm thấy tài khoản người dùng!' } });
        }

        if (!proCategory) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Danh mục không hợp lệ!' } });
        }

        const newprod = new productModel({
            name,
            basePrice,
            price,
            stepPrice,
            startTime,
            duration,
            description,
            endTime,
            category: proCategory,
            owner: proOwner,
            images
        })

        const result = await newprod.save()

        const updatedUser = await userModel.findByIdAndUpdate(
            proOwner,
            { $push: { createdProduct: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật
        );

        const updatedCate = await categoryModel.findByIdAndUpdate(
            proCategory,
            { $push: { products: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật
        );

        if (result && updatedUser && updatedCate) {
            return res.status(200).json({ status: 'success', msg: 'Tạo sản phẩm thành công!' });
        }

    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }

}

export { createProduct, getProductById, getProducts,getProductsByOwner }