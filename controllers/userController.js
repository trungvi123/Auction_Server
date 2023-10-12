import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import jwt from 'jsonwebtoken'

import { userModel } from "../model/userModel.js";
import { productModel } from "../model/productModel.js";

import configMail from "../utils/configMail.js";
import mongoose from "mongoose";
import { freeProductModel } from "../model/freeProductModel.js";
import { reportModel } from "../model/reportModel.js";


const getUserById = async (req, res) => {
    try {
        const idUser = req.params.id

        const user = await userModel.findById(idUser).select('_id firstName lastName email address phoneNumber')

        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
        }
        return res.status(200).json({ status: 'success', user })
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

const getAllUser = async (req, res) => {
    try {
        const user = await userModel.find().select('_id firstName lastName email phoneNumber warnLevel')

        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
        }
        return res.status(200).json({ status: 'success', data: user })
    } catch (error) {
        return res.status(500).json({ status: 'failure' });

    }
}


const updateBlockUserById = async (req, res) => {
    try {
        const idUser = req.params.id
        const { type } = req.body

        const user = await userModel.findById(idUser)
        if (type === 'block') {
            user.block = true
            user.save()
        } else {
            user.block = false
            user.save()
        }
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
        }
        return res.status(200).json({ status: 'success', data: user })
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
}

const signUp = async (req, res) => {
    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { email, address, idCard, password, lastName, phoneNumber } = req.body

        const already = await userModel.findOne({ email })
        if (already) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản đã tồn tại!' } });
        }

        const salt = bcrypt.genSaltSync(12)
        const hashPassWord = bcrypt.hashSync(password, salt)

        const newUser = new userModel({
            firstName: req.body.firstName ? req.body.firstName : '',
            lastName,
            email,
            phoneNumber,
            hashPassWord,
            birthday: req.body.birthday ? req.body.birthday : '',
            idCard,
            address
        })

        await newUser.save()
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

const signIn = async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { email, password } = req.body

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản hoặc mật khẩu không chính xác!' } });
        }

        // Match password
        const matched = bcrypt.compareSync(password, user.hashPassWord);
        if (!matched) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản hoặc mật khẩu không chính xác!' } });
        }

        const payload = {
            _id: user._id,
            email,
            role: user.role || 'user',
            lastName: user.lastName,
            productPermission: user.createdProduct,
            freeProductPermission: user.createdFreeProduct
        }

        const accessToken = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1d' })
        const refreshToken = jwt.sign(payload, process.env.SECRET_REFRESH_KEY, { expiresIn: '7d' })

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'none', // or 'lax' if applicable
            secure: true, // Set to true in production for secure cookies
        });

        return res.status(200).json({ status: 'success', accessToken });
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

const deleteUserById = async (req, res) => {
    const idUser = req.params.id

    const user = await userModel.findByIdAndDelete(idUser)

    if (user) {
        return res.status(200).json({ status: 'success' })
    } else {
        return res.status(400).json({ status: 'failure' })
    }

};

const resetPass = async (req, res) => {
    try {
        const { email } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản không tồn tại!' } });
        }
        // tao pass mới
        const newpass = 'pass' + Math.floor(Math.random() * 100000)
        // ma hóa pass
        const salt = bcrypt.genSaltSync(12)
        const hashPassWord = bcrypt.hashSync(newpass, salt)
        //cap nhat csdl
        await userModel.findOneAndUpdate({ email }, {
            hashPassWord
        },
            { new: true })
        // gửi mail cho user
        const subject = 'Mật khẩu mới'
        const text = 'Xin chào,'
        const html = `
        <p>Chúc mừng bạn đã khôi phục mật khẩu thành công</p>
        <p>Đây là mật khẩu tạm thời của bạn: ${newpass}</p>
        <p>Vui lòng thay đổi mật khẩu của bạn!</p>
        `
        const { transporter, mailOption } = configMail(email, subject, text, html)
        transporter.sendMail(mailOption, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ status: 'failure', message: "Gửi mail thất bại!" });

            } else {
                res.status(200).json({ status: 'success', message: "success" });
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'failure' });
    }

}

const changePass = async (req, res) => {
    try {
        const { email, password, newPassword } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản không tồn tại!' } });
        }

        const matched = bcrypt.compareSync(password, user.hashPassWord);
        if (!matched) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản hoặc mật khẩu không chính xác!' } });
        }

        const salt = bcrypt.genSaltSync(12)
        const hashPassWord = bcrypt.hashSync(newPassword, salt)
        //cap nhat csdl
        await userModel.findOneAndUpdate({ email }, {
            hashPassWord
        },
            { new: true })

        return res.status(200).json({ status: 'success' })

    } catch (error) {
        res.status(500).json({ status: 'failure' });

    }
}

const updateBidsForUserById_server = async (id, idProd) => {
    try {
        const check = await userModel.findOne({ bids: idProd })
        if (check) {
            return true
        } else {
            const data = await userModel.findByIdAndUpdate(id, {
                $push: { bids: idProd }
            }, { new: true })
            if (!data) {
                return false
            }
            return data
        }

    } catch (err) {
        return err
    }
}

const getProductsByOwner = async (req, res) => {
    // get product thong qua id cua nguoi tao
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('createdProduct').select('name image status')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.createdProduct })
    } catch (err) {
        return res.status(500)
    }
}

const getFreeProductsByOwner = async (req, res) => {
    // get product thong qua id cua nguoi tao
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('createdFreeProduct').select('name image status')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.createdFreeProduct })
    } catch (err) {
        return res.status(500)
    }
}

const getPurchasedProducts = async (req, res) => {
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('purchasedProduct').select('name image status')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.purchasedProduct })
    } catch (err) {
        return res.status(500)
    }
}

const getReceivedProducts = async (req, res) => {
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('receivedProduct').select('name image status')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.receivedProduct })
    } catch (err) {
        return res.status(500)
    }
}

const getParticipateReceiving = async (req, res) => {
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('participateReceiving').select('name image status')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.participateReceiving })
    } catch (err) {
        return res.status(500)
    }
}

const getBidsProducts = async (req, res) => {
    try {
        const id = req.params.id
        const data = await userModel.findById(id).populate('bids').select('name image status')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.bids })
    } catch (err) {
        return res.status(500)
    }
}

const getRefuseProducts = async (req, res) => {
    try {
        const id = req.params.id
        const data = await productModel.find({ owner: id, status: 'Đã từ chối' })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        return res.status(500)
    }
}

const getRefuseFreeProducts = async (req, res) => {
    try {
        const id = req.params.id
        const data = await freeProductModel.find({ owner: id, status: 'Đã từ chối' })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data })
    } catch (err) {
        return res.status(500)
    }
}

const getWinProducts = async (req, res) => {
    try {
        const id = req.params.id

        const data = await userModel.findById(id).populate('winProduct').select('name image status')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: data.winProduct })
    } catch (err) {
        return res.status(500)
    }
}

const deleteProductHistory = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const id = req.params.id
        const { type, idProd, isFree } = req.body
        let data
        if (isFree) {
            if (type === 'participate') { // participate || received
                data = await userModel.updateMany({ _id: id }, { $pull: { participateReceiving: idProd } }, { new: true }).session(session)
            } else {
                data = await userModel.updateMany({ _id: id }, { $pull: { receivedProduct: idProd } }, { new: true }).session(session)
            }
        } else {
            if (type === 'win') { // join || buy || win || 
                data = await userModel.updateMany({ _id: id }, { $pull: { winProduct: idProd } }, { new: true }).session(session)
            } else if (type === 'join') {
                data = await userModel.updateMany({ _id: id }, { $pull: { bids: idProd } }, { new: true }).session(session)
            } else {
                data = await userModel.updateMany({ _id: id }, { $pull: { purchasedProduct: idProd } }, { new: true }).session(session)
            }
            if (!data) {
                return res.status(400).json({ status: 'failure' })
            }
        }

        await session.commitTransaction()
        session.endSession()
        return res.status(200).json({ status: 'success' })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}

const getQuatityUsersByMonth = async (req, res) => {
    try {
        try {
            const yearr = new Date().getFullYear()
            const months = [
                '01', '02', '03', '04', '05', '06',
                '07', '08', '09', '10', '11', '12'
            ];
            const result = await userModel.aggregate([
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

    } catch (error) {
        return res.status(500)

    }
}




// --------------------- REPORT HANDLE-------------------
const getReports = async (req, res) => {
    try {
        const data = await reportModel.find().populate('productId accuser accused')
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500)

    }
}

const createReport = async (req, res) => {
    try {

        const { type, accuserId, accusedId, productId } = req.body
        if (type.length === 0) {
            return res.status(400).json({ status: 'failure' })
        }
        const user1 = userModel.exists({ _id: accuserId })
        const user2 = userModel.exists({ _id: accusedId })
        if (!user1 || !user2) {
            return res.status(400).json({ status: 'failure' })
        }

        const checkProduct = await reportModel.findOne({ productId: productId })
        if (checkProduct) {
            return res.status(400).json({ status: 'failure', msg: 'Khiếu nại của bạn đang được chúng tôi xem xét!' })
        }
        const report = new reportModel({
            type,
            accuser: accuserId,
            accused: accusedId,
            productId
        })
        await report.save()
        if (!report) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)

    }
}

const approveReport = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const idReport = req.params.id
        if (!idReport) {
            return res.status(400).json({ status: 'failure' })
        }

        const reportUpd = await reportModel.findById(idReport)
        if (reportUpd && ( !reportUpd.mailToAccused || !reportUpd.mailToAccuser)) {
            return res.status(400).json({ status: 'failure', msg: 'Hãy gửi mail đến 2 người dùng để xác nhận tố cáo từ 2 phía!' })
        }

        reportUpd.approve = true
        await reportUpd.save({ session })
        const updateAccuser = await userModel.findById(reportUpd.accuser)
        const updateAccused = await userModel.findById(reportUpd.accused)

        if (!updateAccuser.reportList.includes(reportUpd._id)) {
            updateAccuser.reportList.push(reportUpd._id)
            await updateAccuser.save({ session })
        }

        if (!updateAccused.myBadList.includes(reportUpd._id)) {
            updateAccused.warnLevel = updateAccused.warnLevel + 1
            updateAccused.myBadList.push(reportUpd._id)
            await updateAccused.save({ session })

        }

        if (!reportUpd || !updateAccuser || !updateAccused) {
            return res.status(400).json({ status: 'failure' })
        }
        await session.commitTransaction()
        session.endSession()
        return res.status(200).json({ status: 'success' })


    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}

const handleFinishTransaction = async (req, res) => {

    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ status: 'failure' })
        }

        const update = await productModel.findByIdAndUpdate(id, {
            successfulTransaction: true,
            paid: true,
            statusPayment: 'Đã thanh toán',
            statusPaymentSlug: 'da-thanh-toan',
        })

        if (!update) {
            return res.status(400).json({ status: 'failure' })

        }
        return res.status(200).json({ status: 'success' })


    } catch (error) {
        return res.status(500)
    }
}

const sendMailToUser = async (req, res) => {
    try {
        const { email, type, productName, typeReport, idReport } = req.body
        const user = await userModel.findOne({ email: email })
        const report = await reportModel.findById(idReport)
        if (!user || !report) {
            return res.status(400).json({ status: 'failure' })
        }

        // gửi mail cho user
        const subject = 'CIT Auction - Xác nhận tố cáo'
        const text = 'Xin chào,'
        let html = ""
        if (type === 'mailToAccuser') {
            report.mailToAccuser = true
            html = `
            <p>Chúng tôi đã nhận được tố cáo của bạn về người đấu giá sản phẩm có tên là ${productName}</p>
            <p>Vui lòng cung cấp cho chúng tôi thêm các bằng chứng về tố cáo này!</p>
            <p>Chúc bạn một ngày tốt lành</p>
            <p>Trân trọng,</p>
            <p><b>CIT Auction</b></p>
        `
        } else {
            report.mailToAccused = true
            html = `
            <p>Chúng tôi nhận được một tố cáo về bạn</p>
            <p>Tên sản phẩm: ${productName}</p>
            <p>Lý do tố cáo: ${typeReport}</p>
            <p>Vui lòng cung cấp cho chúng tôi thêm các bằng chứng chứng minh bạn không vi phạm các qui tắc mua hàng của chúng tôi!</p>
            <p>Tố cáo này sẽ có giá trị nếu bạn không thể chứng minh bản thân không vi phạm trong 3 ngày!</p>
            <p>Chúc bạn một ngày tốt lành</p>
            <p>Trân trọng,</p>
            <p><b>CIT Auction</b></p>
            `
        }
        await report.save()
        const { transporter, mailOption } = configMail(email, subject, text, html)
        transporter.sendMail(mailOption, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ status: 'failure', message: "Gửi mail thất bại!" });

            } else {
                res.status(200).json({ status: 'success', message: "success" });
            }
        });
    } catch (error) {
        return res.status(500)

    }
}

const deleteReport = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const id = req.params.id
        await reportModel.findByIdAndDelete(id).session(session)

        const del2 = await userModel.updateMany({ myBadList: id, reportList: id }, { $pull: { myBadList: id, reportList: id } }, { new: true })
        if (!del2) {
            return res.status(400).json({ status: 'failure' })
        }

        await session.commitTransaction()
        session.endSession()
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}



export {
    getQuatityUsersByMonth, getParticipateReceiving, getRefuseFreeProducts, sendMailToUser,
    getRefuseProducts, getBidsProducts, getReceivedProducts, getFreeProductsByOwner,
    getProductsByOwner, deleteProductHistory, getPurchasedProducts, getWinProducts,
    deleteUserById, updateBidsForUserById_server, getUserById, signIn, signUp, resetPass, deleteReport,
    changePass, updateBlockUserById, getAllUser, approveReport, createReport, getReports, handleFinishTransaction
};
