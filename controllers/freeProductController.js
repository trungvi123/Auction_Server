import { categoryModel } from "../model/categoryModel.js";
import { userModel } from "../model/userModel.js";
import { freeProductModel } from "../model/freeProductModel.js";


const createFreeProduct = async (req, res) => {
    try {
        const { name, owner, category, description } = req.body
        // owner => object id
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

        const newprod = new freeProductModel({
            name,
            description,
            category: proCategory,
            owner: proOwner,
            images
        })
        const result = await newprod.save()
    
        const updatedUser = await userModel.findByIdAndUpdate(
            proOwner,
            { $push: { createdFreeProduct: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật 
        );

        const updatedCate = await categoryModel.findByIdAndUpdate(
            proCategory,
            { $push: { products: result._id } }, // Thêm ObjectId của sản phẩm vào mảng products
            { new: true } // Trả về tài liệu sau khi cập nhật
        );
        if (result && updatedUser && updatedCate) {
            return res.status(200).json({ status: 'success', msg: 'Tạo sản phẩm thành công!' });
        }

    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }

}

export { createFreeProduct }
