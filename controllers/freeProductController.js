import { categoryModel } from "../model/categoryModel.js";
import { userModel } from "../model/userModel.js";
import { freeProductModel } from "../model/freeProductModel.js";
import { deleteImages } from "./productController.js";
import mongoose from "mongoose";
import { io } from "../index.js";
import { notificationModel } from "../model/notificationModel.js";


const createFreeProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
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
        // const existingProductsCount = await freeProductModel.find().count()
        // const page = Math.ceil((existingProductsCount + 1) / itemsPerPage);

        const newprod = new freeProductModel({
            name,
            description,
            category: proCategory,
            owner: proOwner,
            images,
            // page
        })
        const result = await newprod.save({ session })

        const updatedUser = await userModel.findByIdAndUpdate(
            proOwner,
            { $push: { createdFreeProduct: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật 
        ).session(session);

        const updatedCate = await categoryModel.findByIdAndUpdate(
            proCategory,
            { $push: { freeProducts: result._id } }, // Thêm ObjectId của sản phẩm vào mảng products
            { new: true } // Trả về tài liệu sau khi cập nhật
        ).session(session);
        if (result && updatedUser && updatedCate) {
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ status: 'success', _id: result._id, msg: 'Tạo sản phẩm thành công!' });
        }

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ status: 'failure', error })
    }

}

const getAllFreeProducts = async (req, res) => {
    try {
        const limit = req.params.limit
        let data
        if (limit) {
            data = await freeProductModel.find({ status: 'Đã được duyệt' }).populate('category').limit(limit)
        } else {
            data = await freeProductModel.find({ status: 'Đã được duyệt' }).populate('category')
        }
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

const getProductById = async (req, res) => {
    try {
        const id = req.params.id

        const data = await freeProductModel.findById(id).populate('category owner')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }

}

const getParticipationList = async (req, res) => {
    try {
        const id = req.params.id
        const prod = await freeProductModel.findById(id).select('accepterList owner receiver name')
        if (!prod) {
            return res.status(400).json({ status: 'failure' })
        }

        return res.status(200).json({ status: 'success', data: prod })

    } catch (error) {
        return res.status(500)
    }

}

const signUpToReceive = async (req, res) => {
    try {
        const { idProduct, idUser, lastName, email } = req.body
        const data = {
            lastName,
            email,
            user: idUser,
        }
        const checkProd = await freeProductModel.findById(idProduct)
        if (checkProd.accepterList.length > 20) {
            return res.status(200).json({ status: 'failure', msg: 'Sản phẩm đã đạt số lượng người đăng ký tối đa!' });
        }
        if (!checkProd) {
            return res.status(400).json({ status: 'failure', msg: 'Đăng ký tham gia thất bại!' });
        }
        const user = await userModel.findByIdAndUpdate(idUser, {
            $push: { participateReceiving: idProduct }
        }, { new: true })


        const prod = await freeProductModel.findByIdAndUpdate(idProduct, {
            $push: { accepterList: data }
        }, { new: true })

        if (!prod || !user) {
            return res.status(400).json({ status: 'failure', msg: 'Đăng ký tham gia thất bại!' });
        }

        return res.status(200).json({ status: 'success', msg: 'Đăng ký tham gia thành công!' });
    } catch (error) {
        return res.status(500)
    }
}

const getProductsByStatus = async (req, res) => {
    try {
        const { status } = req.body
        const data = await freeProductModel.find({ status: status })
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const editFreeProduct = async (req, res) => {
    try {
        const { id, keepImgs, name, owner, oldCategory, category, description } = req.body
        const product = await freeProductModel.findById(id)
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

            const newProduct = await freeProductModel.findByIdAndUpdate(id, {
                name,
                description,
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

const confirmSharingProduct = async (req, res) => {
    try {
        const { type, owner, idProduct } = req.body
        const product = await freeProductModel.findById(idProduct).populate('owner')
        if (!product || product.receiver) {
            return res.status(400).json({ status: 'failure' })
        }
        if (product.owner._id.toString() === owner) {
            let user
            if (type === 'email') {
                user = await userModel.findOneAndUpdate({ email: req.body.email }, {
                    $push: {
                        receivedProduct: product._id
                    }
                }, { new: true })
            } else {
                user = await userModel.findByIdAndUpdate(req.body.idUser, {
                    $push: {
                        receivedProduct: product._id
                    }
                }, { new: true })
            }
            if (!user) {
                return res.status(400).json({ status: 'failure' })
            }

            const update = await freeProductModel.findByIdAndUpdate(idProduct, {
                receiver: user._id,
                outOfStock: true,
                stateSlug: 'da-ket-thuc',
                state: 'Đã kết thúc'
            }, { new: true })

            if (!update) {
                return res.status(400).json({ status: 'failure' })
            }

            const notification = new notificationModel({
                content: `Chúc mừng bạn nhận được sản phẩm "${update.name}" từ "${product.owner.email}", hãy liện hệ với họ để nhận nhé!`,
                type: 'success',
                recipient: update.receiver,
                img: update.images[0] || ''
            })

            await notification.save()
            const receiver = await userModel.findById(update.receiver)
            receiver.notification.unshift(notification._id)
            await receiver.save()
            io.in(update.receiver.toString()).emit('new_notification', 'new')


            return res.status(200).json({ status: 'success' })
        }
        return res.status(400).json({ status: 'failure' })
    } catch (error) {
        return res.status(500).json({ status: 'failure', error })

    }
}

export { createFreeProduct, getAllFreeProducts, getProductById, confirmSharingProduct, getParticipationList, signUpToReceive, getProductsByStatus, editFreeProduct }
