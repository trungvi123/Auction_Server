import { productModel } from "../model/productModel.js";
import { userModel } from "../model/userModel.js";
import { categoryModel } from "../model/categoryModel.js";
import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { createRoom } from "./roomController.js";
import { roomModel } from "../model/roomModel.js";
import { reportModel } from '../model/reportModel.js'
import { freeProductModel } from "../model/freeProductModel.js";
import normalizeWord from "../utils/normalizeWord.js";
import mongoose from "mongoose";
import { statisticModel } from "../model/statisticModel.js";
import { notificationModel } from "../model/notificationModel.js";
import { io } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);




const getPrepareToStart = async (req, res) => {
    try {
        const data = await productModel.find({ status: 'Đã được duyệt' }).sort({ startTime: 1 })
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

        const data = await productModel.findById(id).populate('category owner')
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

const getProductsByStatus = async (req, res) => {
    try {
        const { status } = req.body
        const data = await productModel.find({ status: status })
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
        const page = req.params.page
        const data = await productModel.find({ status: 'Đã được duyệt', page: page }).populate('category')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

const getAllProducts = async (req, res) => {
    try {
        const data = await productModel.find({ status: 'Đã được duyệt' }).populate('category')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

const search = async (req, res) => {
    try {
        const { keyword } = req.body
        const regex = new RegExp(keyword, 'i');
        const data = await productModel.find({
            $and: [
                { status: 'Đã được duyệt' },
                {
                    $or: [
                        { name: { $regex: regex } },
                        { description: { $regex: regex } },
                        { lazyName: { $regex: regex } },
                        { lazyDescription: { $regex: regex } }
                    ]
                }
            ]
        })
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

// const itemsPerPage = 9;
const createProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, price, endTime, auctionTypeSlug, checkoutTypeSlug, basePrice, stepPrice, startTime, duration, owner, category, description } = req.body
        // owner => object id
        const proOwner = await userModel.findById(owner).select('_id ')
        const proCategory = await categoryModel.findById(category).select('_id')
        const checkName = await productModel.countDocuments({ name: name })
        const productName = checkName > 0 ? `${name} CA-${checkName}` : name

        const images = req.files.map((file) => {
            return `${process.env.BASE_URL}/uploads/${file.filename}`
        });

        if (!proOwner) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Không tìm thấy tài khoản người dùng!' } });
        }

        if (!proCategory) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Danh mục không hợp lệ!' } });
        }
        // const existingProductsCount = await productModel.find().count()
        // const page = Math.ceil((existingProductsCount + 1) / itemsPerPage);
        const newprod = new productModel({
            name: productName,
            lazyName: normalizeWord(productName),
            basePrice,
            price,
            stepPrice,
            startTime,
            duration,
            currentPrice: basePrice,
            description,
            lazyDescription: normalizeWord(description),
            endTime,
            category: proCategory,
            owner: proOwner,
            images,
            // page, 
            auctionTypeSlug,
            checkoutTypeSlug
        })
        const result = await newprod.save({ session })

        const newroom = await createRoom(result._id, proOwner)
        await productModel.findByIdAndUpdate(result._id, {
            room: newroom._id
        }).session(session)

        const updatedUser = await userModel.findByIdAndUpdate(
            proOwner,
            { $push: { createdProduct: result._id, room: newroom._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật 
        ).session(session);

        const updatedCate = await categoryModel.findByIdAndUpdate(
            proCategory,
            { $push: { products: result._id } }, // Thêm ObjectId của sản phẩm vào mảng createdProduct
            { new: true } // Trả về tài liệu sau khi cập nhật
        ).session(session);


        if (!result || !updatedUser || !updatedCate || !newroom) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: 'failure', errors: { msg: 'Có lỗi xảy ra' } });
        }
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ status: 'success', _id: result._id, msg: 'Tạo sản phẩm thành công!' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ status: 'failure', error })
    }

}

const editProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id, keepImgs, name, price, endTime, auctionTypeSlug, checkoutTypeSlug, basePrice, stepPrice, startTime, duration, owner, oldCategory, category, description } = req.body
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
                auctionTypeSlug, checkoutTypeSlug,
                startTime,
                duration,
                description,
                endTime,
                category: proCategory,
                owner: proOwner,
                images
            }, { new: true }).session(session)
            if (!newProduct) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Cập nhật thất bại!' } });
            }

            // category thay đổi
            if (oldCategory !== category) {
                // xóa id sản phẩm ra khỏi cate cũ
                const rs1 = await categoryModel.updateMany({ products: id }, { $pull: { products: id } }).session(session)
                //thêm id vào cate mới
                const rs2 = await categoryModel.findByIdAndUpdate(
                    proCategory,
                    { $push: { products: newProduct._id } },
                    { new: true }
                ).session(session);

                if (!rs1 || !rs2) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ status: 'failure', errors: { msg: 'Cập nhật thất bại!' } });
                }
            }
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ status: 'success', msg: 'Sửa sản phẩm thành công!' });
        }

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ status: 'failure', error })
    }
}

const deleteProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    //delete product or free product 

    try {
        const { idOwner, isFree } = req.body
        const idProd = req.params.id
        let product = isFree ? await freeProductModel.findById(idProd) : await productModel.findById(idProd)

        // if (product.auctionStarted && !product.successfulTransaction) {
        //     if (product.winner && !product.winner.equals(product.owner)) {
        //         return res.status(400).json({ status: 'failure', msg: 'Bạn không thể đơn phương xóa sản phẩm khi giao dịch chưa hoàn tất!' })
        //     }
        //     if (product.purchasedBy && !product.purchasedBy.equals(product.owner)) {
        //         return res.status(400).json({ status: 'failure', msg: 'Bạn không thể đơn phương xóa sản phẩm khi giao dịch chưa hoàn tất!' })
        //     }
        // }

        if (!product) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy sản phẩm!' })
        }
        const owner = await userModel.findById(idOwner)
        if (!owner) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy người dùng!' })
        }
        if (product.owner.toString() === idOwner) {
            if (isFree) { // vat pham chia se
                await freeProductModel.findByIdAndDelete(idProd).session(session)
                const res2 = await userModel.updateMany({ $or: [{ createdFreeProduct: idProd }, { participateReceiving: idProd }, { receivedProduct: idProd }] },
                    { $pull: { createdFreeProduct: idProd, participateReceiving: idProd, receivedProduct: idProd } }).session(session)
                const res3 = await categoryModel.updateMany({ freeProducts: idProd }, { $pull: { freeProducts: idProd } }).session(session)

                if (!res2 || !res3) {
                    return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
                }
            } else {
                await productModel.findByIdAndDelete(idProd).session(session)
                await reportModel.findOneAndDelete({ productId: idProd }).session(session)

                const res1 = await roomModel.findOneAndDelete({ product: idProd }).session(session)
                const res2 = await userModel.updateMany(
                    {
                        $or: [
                            { createdProduct: idProd }, { bids: idProd }, { room: res1._id }, { purchasedProduct: idProd }, { winProduct: idProd }
                        ]

                    },
                    { $pull: { createdProduct: idProd, bids: idProd, room: res1._id, purchasedProduct: idProd, winProduct: idProd } }).session(session)

                const res3 = await categoryModel.updateMany({ products: idProd }, { $pull: { products: idProd } }).session(session)


                if (!res1 || !res2 || !res3) {
                    return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
                }
            }
            const del = await deleteImages(product)
            if (!del) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Xóa thất bại!' } });
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ status: 'success', _id: idProd, msg: 'Xóa sản phẩm thành công!' });
        } else {

            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: 'failure', msg: 'Không thể update!' })
        }

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
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

const updateAuctionStarted = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findById(id)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        if (new Date(data.startTime).getTime() <= new Date().getTime()) {
            const result = await productModel.findByIdAndUpdate(id, {
                auctionStarted: true,
                stateSlug: 'dang-dien-ra',
                state: 'Đang diễn ra'
            }, { new: true }).populate('category owner')
            if (!result) {
                return res.status(400).json({ status: 'failure' })
            }
            return res.status(200).json({
                status: 'success',
                data: result
            })
        } else {
            return res.status(400).json({ status: 'failure' })
        }
    } catch (error) {
        return res.status(500)
    }
}

const updateAuctionEnded = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const id = req.params.id
        const { type, idUser } = req.body
        const data = await productModel.findById(id)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }


        if (type === 'bid') {  // or buy
            if (new Date(data.endTime).getTime() <= new Date().getTime()) {

                const result = await productModel.findByIdAndUpdate(id, {
                    auctionEnded: true,
                    stateSlug: 'da-ket-thuc',
                    state: 'Đã kết thúc',
                    winner: data.bids.length ? data.bids[data.bids.length - 1].user : data.owner
                }, { new: true }).session(session).populate('category owner')
                const result2 = await userModel.findByIdAndUpdate(result.winner,
                    {
                        $addToSet: { winProduct: result._id },
                    }
                    , { new: true }
                ).session(session)

                if (!result || !result2) {
                    return res.status(400).json({ status: 'failure' })
                }

                //xu li tao thong bao va thong bao den nguoi dung
                const notification = new notificationModel({
                    content: `Bạn đã đấu giá thành công sản phẩm "${result.name}"`,
                    type: 'success',
                    recipient: result.winner,
                    img: result.images[0] || ''
                })

                await notification.save({ session })

                const receiver = await userModel.findById(result.winner)
                receiver.notification.unshift(notification._id)
                await receiver.save({ session })

                io.in(result.winner.toString()).emit('new_notification', 'new')


                await session.commitTransaction();
                session.endSession();
                return res.status(200).json({
                    status: 'success',
                    data: result
                })
            } else {
                return res.status(400).json({ status: 'failure' })
            }
        } else { // type = buy
            if (data.auctionStarted && !data.auctionEnded) { // chir mua khi đã bắt đầu và chưa kết thúc
                const user = await userModel.findById(idUser)
                if (!user) {
                    return res.status(400).json({ status: 'failure', msg: 'User not found' })
                }


                const result = await productModel.findByIdAndUpdate(id, {
                    auctionEnded: true,
                    stateSlug: 'da-ket-thuc',
                    state: 'Đã kết thúc',
                    sold: true,
                    soldAt: new Date(),
                    purchasedBy: user._id,
                    outOfDatePayment: outOfDate
                }, { new: true }).session(session).populate('category owner')

                const result2 = await userModel.findByIdAndUpdate(user._id,
                    {
                        $push: { purchasedProduct: result._id }
                    }
                    , { new: true }
                ).session(session)
                if (!result || !result2) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ status: 'failure', msg: 'Đã xảy ra lỗi!' })
                }
                //xu li tao thong bao va thong bao den nguoi dung
                const notification = new notificationModel({
                    content: `Bạn đã mua ngay thành công sản phẩm "${result.name}"`,
                    type: 'success',
                    recipient: result.purchasedBy,
                    img: result.images[0] || ''
                })

                await notification.save({ session })

                const receiver = await userModel.findById(result.purchasedBy)
                receiver.notification.unshift(notification._id)
                await receiver.save({ session })

                io.in(result.purchasedBy.toString()).emit('new_notification', 'new')


                await session.commitTransaction();
                session.endSession();
                return res.status(200).json({
                    status: 'success',
                    data: result
                })
            }
        }


    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500)
    }
}

// const shareProductOnFacebook = async (req, res) => {
//     try {
//         const { id, type } = req.body
//         let product
//         if (type === 'free') {
//             product = await freeProductModel.findById(id)
//         } else {
//             product = await productModel.findById(id)
//         }

//         if (!product) {
//             return res.status(400).send("Not found");
//         }
//         const folderPath = path.join(__dirname, '../html', 'share.html');
//         // console.log(folderPath);
     
//         return res.sendFile(folderPath);

//     } catch (error) {
//         return res.status(500)
//     }
// }


const approveProduct = async (req, res) => {
    try {
        const id = req.params.id
        const { isFree } = req.body
        let data
        if (isFree) {
            data = await freeProductModel.findByIdAndUpdate(id, {
                status: 'Đã được duyệt',
                stateSlug: 'dang-dien-ra',
                state: 'Đang diễn ra'
            })

            const currentTime = new Date(data.createdAt)
            const currentYear = currentTime.getFullYear()
            const currentMonth = currentTime.getMonth() + 1

            const statisticByYear = await statisticModel.findOne({ year: currentYear })

            if (statisticByYear) {
                statisticByYear.freeProductCount += 1

                let checkMonth = statisticByYear.months.find((item) => item.month.toString() === currentMonth.toString())

                if (checkMonth) {
                    // Nếu đã có thống kê cho tháng đó, tăng userCountInMonth trong tháng
                    checkMonth.freeProductCountInMonth += 1;
                } else {
                    // Nếu chưa có thống kê cho tháng đó, tạo một thống kê mới
                    statisticByYear.months.push({
                        month: currentMonth,
                        freeProductCountInMonth: 1
                    });
                }

                await statisticByYear.save()
            }

        } else {
            data = await productModel.findByIdAndUpdate(id, {
                status: 'Đã được duyệt'
            })

            const currentTime = new Date(data.createdAt)
            const currentYear = currentTime.getFullYear()
            const currentMonth = currentTime.getMonth() + 1

            const statisticByYear = await statisticModel.findOne({ year: currentYear })
            if (statisticByYear) {
                statisticByYear.auctionCount += 1

                let checkMonth = statisticByYear.months.find((item) => item.month.toString() === currentMonth.toString())
                if (checkMonth) {
                    // Nếu đã có thống kê cho tháng đó, tăng userCountInMonth trong tháng
                    checkMonth.auctionCountInMonth += 1;
                } else {
                    // Nếu chưa có thống kê cho tháng đó, tạo một thống kê mới
                    statisticByYear.months.push({
                        month: currentMonth,
                        auctionCountInMonth: 1
                    });
                }

                await statisticByYear.save()
            }
        }

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        //xu li tao thong bao va thong bao den nguoi dung
        const notification = new notificationModel({
            content: `Sản phẩm "${data.name}" của bạn đã được duyệt!`,
            type: 'success',
            recipient: data.owner,
            img: data.images[0] || ''

        })


        await notification.save()

        const receiver = await userModel.findById(data.owner)
        receiver.notification.unshift(notification._id)
        await receiver.save()

        io.in(data.owner.toString()).emit('new_notification', 'new')



        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}
const refuseProduct = async (req, res) => {
    try {
        const id = req.params.id
        const { isFree } = req.body
        let data
        if (isFree) {
            data = await freeProductModel.findByIdAndUpdate(id, {
                status: 'Đã từ chối'
            })
        } else {
            data = await productModel.findByIdAndUpdate(id, {
                status: 'Đã từ chối'
            })
        }

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        //xu li tao thong bao va thong bao den nguoi dung
        const notification = new notificationModel({
            content: `Sản phẩm "${data.name}" của bạn đã bị từ chối!`,
            type: 'warning',
            recipient: data.owner,
            img: data.images[0] || ''

        })

        await notification.save()

        const receiver = await userModel.findById(data.owner)
        receiver.notification.unshift(notification._id)
        await receiver.save()


        io.in(data.owner.toString()).emit('new_notification', 'new')


        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}
const approveAgainProduct = async (req, res) => {
    try {
        const id = req.params.id

        const { isFree } = req.body
        let data
        if (isFree) {
            data = await freeProductModel.findByIdAndUpdate(id, {
                status: 'Yêu cầu duyệt lại'
            })
        } else {
            data = await productModel.findByIdAndUpdate(id, {
                status: 'Yêu cầu duyệt lại'
            })
        }

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        //xu li tao thong bao va thong bao den nguoi dung
        const notification = new notificationModel({
            content: `Sản phẩm "${data.name}" của bạn đã được xem xét lại và đã được duyệt!`,
            type: 'success',
            recipient: data.owner,
            img: data.images[0] || ''

        })

        await notification.save()

        const receiver = await userModel.findById(data.owner)
        receiver.notification.unshift(notification._id)
        await receiver.save()


        io.in(data.owner.toString()).emit('new_notification', 'new')

        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}

const updateShipping = async (req, res) => {
    try {
        const id = req.params.id
        const product = await productModel.findById(id)
        if (!product || (product.checkoutTypeSlug !== 'cod' && !product.paid)) {
            return res.status(400).json({ status: 'failure' })
        }

        product.shipping = true
        await product.save()

        //xu li tao thong bao va thong bao den nguoi dung
        const userId = product.sold ? product.purchasedBy : product.winner
        const notification = new notificationModel({
            content: `Sản phẩm "${product.name}" đang trên đường giao đến bạn!`,
            type: 'infor',
            recipient: userId,
            img: product.images[0] || ''
        })

        await notification.save()

        const receiver = await userModel.findById(userId)
        receiver.notification.unshift(notification._id)
        await receiver.save()

        io.in(userId.toString()).emit('new_notification', 'new')

        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500)

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

export {
    getProductsByStatus, createProduct,
    updateAuctionEnded, updateAuctionStarted, getBidsById,
    updateBidForProduct_server, getCurrentPriceById_server, 
    updateCurrentPriceById_server, getCurrentPriceById, getProductById,
    getProducts, deleteProduct, editProduct, approveProduct, getAllProducts,
    refuseProduct, approveAgainProduct, deleteImages, search, updateShipping, getPrepareToStart
}