import { productModel } from "../model/productModel.js";
import { userModel } from "../model/userModel.js";
import { categoryModel } from "../model/categoryModel.js";
import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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

        const data = await productModel.find({ owner: id })
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

const editProduct = async (req, res) => {
    try {
        const { id, name, price, endTime, basePrice, stepPrice, startTime, duration, owner, oldCategory, category, description } = req.body
        const product = await productModel.findById(id)
        // chỉ có người tạo mới có quyền sửa
        if (product.owner.toString() === owner) {
            const proOwner = await userModel.findById(owner).select('_id')
            const proCategory = await categoryModel.findById(category).select('_id')

            if (!proOwner) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Không tìm thấy tài khoản người dùng!' } });
            }

            if (!proCategory) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Danh mục không hợp lệ!' } });
            }

            await deleteImages(id)
            const images = req.files.map((file) => {
                return `${process.env.BASE_URL}/uploads/${file.filename}`
            });

            const newProduct = await productModel.findByIdAndUpdate(id, {
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
            }, { new: true })
            if (!newProduct) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Cập nhật thất bại!' } });
            }

            // category thay đổi
            if (oldCategory !== category) {
                // xóa id sản phẩm ra khỏi cate cũ
                const rs1 = await categoryModel.updateMany({ products: id }, { $pull: { products: id } })
                //thêm id vào cate mới
                const rs2 = await categoryModel.findByIdAndUpdate(
                    proCategory,
                    { $push: { products: newProduct._id } },
                    { new: true }
                );

                if (!rs1 || !rs2) {
                    return res.status(400).json({ status: 'failure', errors: { msg: 'Cập nhật thất bại!' } });
                }
            }

            return res.status(200).json({ status: 'success', msg: 'Sửa sản phẩm thành công!' });
        }

    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }
}

//sai
const deleteProduct = async (req, res) => {
    try {
        const { idOwner } = req.body
        const idProd = req.params.id
        const product = await productModel.findByIdAndDelete(idProd)
        if (!product) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy sản phẩm!' })
        }
        if (product.owner.toString() === idOwner) {
            const owner = await userModel.findById(idOwner)
            if (!owner) {
                return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy người dùng!' })
            }
            const res1 = await categoryModel.updateMany({ products: idProd }, { $pull: { products: idProd } })
            const res2 = await userModel.updateMany({ createdProduct: idProd }, { $pull: { createdProduct: idProd } })
            if (!res1 || !res2) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
            }
        } else {
            return res.status(400).json({ status: 'failure', msg: 'Không thể update a!' })
        }
        return res.status(200).json({ status: 'success', msg: 'Xóa sản phẩm thành công!' });
    } catch (err) {
        return res.status(500)
    }
}

const deleteImages = async (id) => {
    try {
        // tim va xoa cac anh cu
        const folderPath = path.join(__dirname, '../public', 'uploads'); // Đường dẫn đến thư mục chứa tệp ảnh
        const product = await productModel.findById(id).select('_id images')

        product.images.forEach(async (e) => {
            let fileName = e.replace(`${process.env.BASE_URL}/uploads/`, '');
            let filePath = path.join(folderPath, fileName);
            await fs.unlink(filePath, (error) => {
                if (error) {
                    if (error) throw error;
                }
            });
        })
    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }

}

export { createProduct, getProductById, getProducts, getProductsByOwner, deleteProduct, editProduct }