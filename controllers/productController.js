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




const getQuatityProductByMonth = async (req, res) => {

    try {
        const yearr = new Date().getFullYear()
        const months = [
            '01', '02', '03', '04', '05', '06',
            '07', '08', '09', '10', '11', '12'
        ];
        const result = await productModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${yearr}-01-01T00:00:00.000Z`), // Bắt đầu từ đầu năm
                        $lt: new Date(`${yearr + 1}-01-01T00:00:00.000Z`), // Kết thúc vào đầu năm tiếp theo
                    },
                },
            },
            {
                $project: {
                    createdAt: 1, // Lấy trường createdAt
                    yearMonth: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: '$createdAt',
                            timezone: '+07:00', // Điều chỉnh múi giờ theo định dạng của bạn
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$yearMonth',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 }, // Sắp xếp theo thời gian tạo
            },
        ])

        const data = {};
        result.forEach((item) => {
            data[item._id] = item.count;
        });

        // Điền giá trị 0 cho các tháng không có dữ liệu
        months.forEach((month) => {
            if (!data[yearr + '-' + month]) {
                data[yearr + '-' + month] = 0;
            }
        });

        return res.status(200).json({ status: 'success', data: data })

    } catch (error) {
        return res.status(500)

    }
}

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
        const quantity = req.params?.quantity ? parseInt(req.params?.quantity) : null
        if (quantity) {
            const data = await productModel.find({ status: 'Đã được duyệt' }).limit(quantity)
            return res.status(200).json({ status: 'success', data })
        }
        const data = await productModel.find({ status: 'Đã được duyệt' })
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })

    } catch (error) {
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
        await productModel.findByIdAndUpdate(result._id, {
            room: newroom._id
        })

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

const updateAuctionStarted = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findById(id)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        if (new Date(data.startTime).getTime() <= new Date().getTime()) {
            const result = await productModel.findByIdAndUpdate(id, {
                auctionStarted: true
            }, { new: true })
            if (!result) {
                return res.status(400).json({ status: 'failure' })
            }
            return res.status(200).json({
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
                    winner: data.bids[data.bids.length] || data.owner
                }, { new: true })

                const result2 = await userModel.findByIdAndUpdate(result.winner,
                    {
                        $push: { winProduct: result._id }
                    }
                    , { new: true }
                )

                if (!result || !result2) {
                    return res.status(400).json({ status: 'failure' })
                }

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
                    sold: true,
                    soldAt: new Date(),
                    purchasedBy: user._id
                }, { new: true })

                const result2 = await userModel.findByIdAndUpdate(user._id,
                    {
                        $push: { purchasedProduct: result._id }
                    }
                    , { new: true }
                )
                if (!result || !result2) {
                    return res.status(400).json({ status: 'failure', msg: 'Đã xảy ra lỗi!' })
                }

                return res.status(200).json({
                    status: 'success',
                    data: result
                })
            }
        }
    } catch (error) {
        return res.status(500)
    }
}

const approveProduct = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findByIdAndUpdate(id, {
            status: 'Đã được duyệt'
        })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}
const refuseProduct = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findByIdAndUpdate(id, {
            status: 'Đã từ chối'
        })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}
const approveAgainProduct = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.findByIdAndUpdate(id, {
            status: 'Yêu cầu duyệt lại'
        })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
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
    getQuatityProductByMonth, getProductsByStatus, createProduct,
    updateAuctionEnded, updateAuctionStarted, getBidsById,
    updateBidForProduct_server, getCurrentPriceById_server,
    updateCurrentPriceById_server, getCurrentPriceById, getProductById,
    getProducts, deleteProduct, editProduct, approveProduct,
    refuseProduct,approveAgainProduct
}