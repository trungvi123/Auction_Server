import { productModel } from "../model/productModel.js";
import { userModel } from "../model/userModel.js";
import { categoryModel } from "../model/categoryModel.js";
import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { createRoom } from "./roomController.js";
import { roomModel } from "../model/roomModel.js";

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

const getCurrentPriceById = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findById(id).select('currentPrice')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getBidsById = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findById(id).select('bids')
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
            currentPrice: basePrice,
            description,
            endTime,
            category: proCategory,
            owner: proOwner,
            images
        })
        const result = await newprod.save()

        const newroom = await createRoom(result._id, proOwner)

        const updatedUser = await userModel.findByIdAndUpdate(
            proOwner,
            { $push: { createdProduct: result._id, room: newroom._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật 
        );

        const updatedCate = await categoryModel.findByIdAndUpdate(
            proCategory,
            { $push: { products: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật
        );


        if (result && updatedUser && updatedCate && newroom) {
            return res.status(200).json({ status: 'success', msg: 'Tạo sản phẩm thành công!' });
        }

    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }

}

const editProduct = async (req, res) => {
    try {
        const { id, keepImgs, name, price, endTime, basePrice, stepPrice, startTime, duration, owner, oldCategory, category, description } = req.body
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
            if (keepImgs?.length > 0) {
                await deleteImages(product, keepImgs)
            } else {
                await deleteImages(product)
            }
            let images = req.files.map((file) => {
                return `${process.env.BASE_URL}/uploads/${file.filename}`
            });
            if (keepImgs?.length > 0) {
                if (Array.isArray(keepImgs)) {
                    images = [...keepImgs, ...images]
                } else {
                    images = [keepImgs, ...images]
                }
            }

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

const deleteProduct = async (req, res) => {
    try {
        const { idOwner } = req.body
        const idProd = req.params.id
        const product = await productModel.findById(idProd)
        if (!product) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy sản phẩm!' })
        }
        if (product.owner.toString() === idOwner) {
            const owner = await userModel.findById(idOwner)
            await productModel.findByIdAndDelete(idProd)
            if (!owner) {
                return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy người dùng!' })
            }
            const res1 = await categoryModel.updateMany({ products: idProd }, { $pull: { products: idProd } })
            const res2 = await roomModel.findOneAndDelete({ product: idProd })
            const res3 = await userModel.updateMany({ createdProduct: idProd }, { $pull: { createdProduct: idProd, bid: idProd, room: res2._id } })
            if (!res1 || !res2 || !res3) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
            }
            const del = await deleteImages(product)
            if (!del) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
            }
            return res.status(200).json({ status: 'success', msg: 'Xóa sản phẩm thành công!' });
        } else {
            return res.status(400).json({ status: 'failure', msg: 'Không thể update a!' })
        }

    } catch (err) {
        return res.status(500)
    }
}

const deleteImages = async (product, oldImgs = []) => {
    try {
        // tim va xoa cac anh cu
        const folderPath = path.join(__dirname, '../public', 'uploads'); // Đường dẫn đến thư mục chứa tệp ảnh

        const imgList = product?.images?.filter((e) => !oldImgs.includes(e))
        // imglist là những ảnh mà user không giũ lại, tức là đã xóa
        imgList.forEach(async (e) => {
            let fileName = e.replace(`${process.env.BASE_URL}/uploads/`, '');
            let filePath = path.join(folderPath, fileName);
            await fs.unlink(filePath, (error) => {
                if (error) {
                    console.log(error);
                }
            });
        })
        return true
    } catch (error) {
        console.log(error);
    }

}


const getCurrentPriceById_server = async (id) => {
    try {
        const data = await productModel.findById(id).select('currentPrice')
        if (!data) {
            return false
        }
        return data
    } catch (err) {
        return err
    }
}
const updateCurrentPriceById_server = async (id, price) => {
    try {
        const data = await productModel.findByIdAndUpdate(id, {
            currentPrice: price
        }, { new: true })
        if (!data) {
            return false
        }
        return data
    } catch (err) {
        return err
    }
}

const updateBidForProduct_server = async (id, infor) => {
    try {
        const data = await productModel.findByIdAndUpdate(id, {
            $push: { bids: infor }
        }, { new: true })
        if (!data) {
            return false
        }
        return data
    } catch (err) {
        return err
    }
}

export { createProduct, getBidsById, updateBidForProduct_server, getCurrentPriceById_server, updateCurrentPriceById_server, getCurrentPriceById, getProductById, getProducts, getProductsByOwner, deleteProduct, editProduct }