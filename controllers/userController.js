import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import jwt from 'jsonwebtoken'

import { userModel } from "../model/userModel.js";
import { productModel } from "../model/productModel.js";

import configMail from "../utils/configMail.js";
import mongoose from "mongoose";
import { freeProductModel } from "../model/freeProductModel.js";
import { reportModel } from "../model/reportModel.js";
import { notificationModel } from "../model/notificationModel.js";
import { io } from "../index.js";
import { statisticModel } from "../model/statisticModel.js";
import { payouts } from "./adminController.js";
import { rateModel } from "../model/rateModel.js";
import { profitModel } from "../model/profitModel.js";
import { contactModel } from "../model/contactModel.js";
import { deleteImg } from "./newsController.js";

const getUserById = async (req, res) => {
    try {
        const idUser = req.params.id
        const user = await userModel.findById(idUser).select('_id followProductPreStart avatar verifyAccount followProductPreEnd emailPaypal address birthday idCard firstName lastName email address phoneNumber')
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
        }
        return res.status(200).json({ status: 'success', data: user })
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

const getUserByEmail = async (req, res) => {
    try {
        const email = req.params.email
        const user = await userModel.findOne({ email }).select('rate avatar starRate createdAt follow followTo -_id').populate('rate')
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
        }
        return res.status(200).json({ status: 'success', data: user })
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

const getAllUser = async (req, res) => {
    try {
        const user = await userModel.find().select('_id firstName lastName email phoneNumber warnLevel block')

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

        const { email, address, password, lastName, phoneNumber } = req.body

        const already = await userModel.findOne({ email })
        if (already) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản đã tồn tại!' } });
        }

        const salt = bcrypt.genSaltSync(12)
        const hashPassWord = bcrypt.hashSync(password, salt)

        const newUser = new userModel({
            firstName: req.body.firstName || '',
            lastName,
            email,
            phoneNumber,
            hashPassWord,
            birthday: req.body.birthday || '',
            address,
            avatar: `https://ui-avatars.com/api/name=${req.body.firstName || ''}%20${lastName}&background=random`
        })

        if (req.body.idCard) newUser.idCard = req.body.idCard
        if (req.body.emailPaypal) newUser.emailPaypal = req.body.emailPaypal

        await newUser.save()

        const currentTime = new Date()
        const currentYear = currentTime.getFullYear()
        const currentMonth = currentTime.getMonth() + 1

        const statisticByYear = await statisticModel.findOne({ year: currentYear })
        if (statisticByYear) {
            statisticByYear.userCount += 1

            let checkMonth = statisticByYear.months.find((item) => item.month.toString() === currentMonth.toString())
            if (checkMonth) {
                // Nếu đã có thống kê cho tháng đó, tăng userCountInMonth trong tháng
                checkMonth.userCountInMonth += 1;
            } else {
                // Nếu chưa có thống kê cho tháng đó, tạo một thống kê mới
                statisticByYear.months.push({
                    month: currentMonth,
                    userCountInMonth: 1
                });
            }

            await statisticByYear.save()
        }

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

        if (user.block) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản của bạn tạm thời bị khóa!' } });
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
            emailPaypal: user.emailPaypal || '',
            productPermission: user.createdProduct,
            freeProductPermission: user.createdFreeProduct,
            verifyAccount: user.verifyAccount
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

const updateProfile = async (req, res) => {
    try {
        const { userId, birthday, firstName, lastName, email, phoneNumber, idCard, address, emailPaypal } = req.body
        const check = await userModel.findOne({
            $or: [{
                email
            }, { emailPaypal }, { idCard },{phoneNumber}]
        })
        if (check && check._id.toString() !== userId.toString()) {
            return res.status(400).json({ status: 'failure', msg: 'Vui lòng xem lại email, CCCD hoặc emailPaypal!' })
        }

        const user = await userModel.findByIdAndUpdate(userId, {
            birthday, firstName, lastName, email, phoneNumber, address,idCard,emailPaypal
        }, { new: true })
        if (req.file) {
            await deleteImg(user.avatar, 'users')
            user.avatar = `${process.env.BASE_URL}/users/${req.file.filename}`
        }
     
        const result = await user.save()

        if (!user) {
            return res.status(400).json({ status: 'failure', msg: 'Cập nhật hồ sơ thất bại!' })
        }

        const payload = {
            _id: result._id,
            email,
            role: result.role || 'user',
            lastName: result.lastName,
            emailPaypal: result.emailPaypal || '',
            productPermission: result.createdProduct,
            freeProductPermission: result.createdFreeProduct,
            verifyAccount: result.verifyAccount
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
        return res.status(500).json({ status: 'failure', error });
    }
}

const deleteUserById = async (req, res) => {
    const idUser = req.params.id
    const user = await userModel.findByIdAndDelete(idUser)
    if (user) {
        return res.status(200).json({ status: 'success' })
    }
    return res.status(400).json({ status: 'failure' })

};




const resetPass = async (req, res) => {
    try {
        const { OTP, email } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 'failure', msg: 'Tài khoản không tồn tại!' });
        }

        const currentTime = new Date();
        const timeDiff = (currentTime - user.lastOTP.createdAt) / 1000;
        if (OTP && user.lastOTP.OTP === OTP && timeDiff <= 60) {
            // tao pass mới
            const newpass = 'pass' + Math.floor(Math.random() * 100000)
            // ma hóa pass
            const salt = bcrypt.genSaltSync(12)
            const hashPassWord = bcrypt.hashSync(newpass, salt)
            //cap nhat csdl
            user.hashPassWord = hashPassWord
            user.lastOTP = { OTP: '' }

            await user.save()
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
                    res.status(500).json({ status: 'failure', msg: "Gửi mail thất bại!" });

                } else {
                    res.status(200).json({ status: 'success', msg: "success" });
                }
            });


            return res.status(200).json({ status: 'success', msg: "success" });
        } else {
            return res.status(400).json({ status: 'failure', msg: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
        }
    } catch (error) {
        res.status(500).json({ status: 'failure' });
    }

}

const confirmResetPass = async (req, res) => {
    try {
        const { email } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản không tồn tại!' } });
        }

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        // Lưu thông tin xác thực vào cơ sở dữ liệu
        user.lastOTP = { OTP }

        // gửi mail cho user
        const subject = 'Cit Auction - OTP'
        const text = 'Xin chào,'
        const html = `
        <p>Đây là mã OTP của bạn ${OTP}</p>
        <p>Mã này sẽ có hiệu lực trong 60 giây!</p>
        `
        const { transporter, mailOption } = configMail(email, subject, text, html)
        transporter.sendMail(mailOption, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ status: 'failure', msg: "Gửi mail thất bại!" });
            } else {
                res.status(200).json({ status: 'success', msg: "success" });
            }
        });
        await user.save()
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


const createOTP = async (req, res) => {
    try {
        const dataFromToken = req.dataFromToken
        const user = await userModel.findById(dataFromToken)
        // Tạo mã xác thực ngẫu nhiên
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu thông tin xác thực vào cơ sở dữ liệu
        user.lastOTP = { OTP }
        await user.save()
        // Gửi mã xác thực đến email (mô phỏng)
        const subject = 'Mã xác minh'
        const text = 'Xin chào,'
        const html = `
        <p>Đây là mã xác minh của bạn ${OTP}</p>
        <p>Mã này sẽ có hiệu lực trong 60 giây!</p>
        `
        const { transporter, mailOption } = configMail(dataFromToken.email, subject, text, html)
        transporter.sendMail(mailOption, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ status: 'failure', message: "Gửi mail thất bại!" });

            } else {
                return res.status(200).json({ status: 'success', message: "success" });
            }
        });

    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
}

const verifyAccount = async (req, res) => {
    try {
        const dataFromToken = req.dataFromToken
        const { OTP } = req.body;
        const user = await userModel.findById(dataFromToken._id)
        if (!user) {
            return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản không tồn tại!' } });
        }
        const currentTime = new Date();
        const timeDiff = (currentTime - user.lastOTP.createdAt) / 1000;
        if (OTP && user.lastOTP.OTP === OTP && timeDiff <= 60) {
            user.verifyAccount = true
            user.lastOTP = { OTP: '' }

            await user.save()
            return res.status(200).json({ status: 'success', msg: "success" });
        } else {
            return res.status(400).json({ msg: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }
    } catch (error) {
        return res.status(500).json({ status: 'failure' });
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

        const result = await userModel.findById(id).populate('createdProduct').select('name image status')
        const data = result.createdProduct.filter((item) => item.hide === false)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getFreeProductsByOwner = async (req, res) => {
    // get product thong qua id cua nguoi tao
    try {
        const id = req.params.id

        const result = await userModel.findById(id).populate('createdFreeProduct').select('name image status')
        const data = result.createdFreeProduct.filter((item) => item.hide === false)
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getPurchasedProducts = async (req, res) => {
    try {
        const id = req.params.id

        const result = await userModel.findById(id).populate('purchasedProduct').select('name image status')
        const data = result.purchasedProduct.filter((item) => item.hide === false)

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getReceivedProducts = async (req, res) => {
    try {
        const id = req.params.id

        const result = await userModel.findById(id).populate('receivedProduct').select('name image status')
        const data = result.receivedProduct.filter((item) => item.hide === false)

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getParticipateReceiving = async (req, res) => {
    try {
        const id = req.params.id

        const result = await userModel.findById(id).populate('participateReceiving').select('name image status')
        const data = result.participateReceiving.filter((item) => item.hide === false)

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (err) {
        return res.status(500)
    }
}

const getBidsProducts = async (req, res) => {
    try {
        const id = req.params.id
        const result = await userModel.findById(id).populate('bids').select('name image status')
        const data = result.bids.filter((item) => item.hide === false)

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
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

        const result = await userModel.findById(id).populate('winProduct').select('name image status')
        const data = result.winProduct.filter((item) => item.hide === false)

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
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

const getNotifications = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!userId) {
            return res.status(400).json({ status: 'failure' })
        }
        const data = await userModel.findById(userId).populate('notification').select('notification')

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500)

    }
}

const deleteNotification = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const id = req.params.id
        const { userId } = req.body
        const notification = await notificationModel.findById(id)
        if (!notification) {
            return res.status(400).json({ status: 'failure' })
        }

        if (notification.recipient.toString() !== userId) {
            return res.status(400).json({ status: 'failure' })
        }

        await notificationModel.findByIdAndDelete(id).session(session)
        await userModel.updateOne({ notification: notification._id }, {
            $pull: {
                notification: notification._id
            }
        }).session(session)
        await session.commitTransaction()
        session.endSession()
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}

const updateNotifications = async (req, res) => {
    try {
        const userId = req.params.userId
        const data = await notificationModel.updateMany({ recipient: userId, read: false }, { read: true })

        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }

        return res.status(200).json({ status: 'success' })
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
        if (reportUpd && (!reportUpd.mailToAccused || !reportUpd.mailToAccuser)) {
            return res.status(400).json({ status: 'failure', msg: 'Hãy gửi mail đến 2 người dùng để xác nhận tố cáo từ 2 phía!' })
        }

        reportUpd.approve = true
        await reportUpd.save({ session })
        const updateAccuser = await userModel.findById(reportUpd.accuser)
        const updateAccused = await userModel.findById(reportUpd.accused)

        if (!updateAccuser.reportList.includes(reportUpd._id)) {
            updateAccuser.reportList.push(reportUpd._id)
        }

        if (!updateAccused.myBadList.includes(reportUpd._id)) {
            updateAccused.warnLevel = updateAccused.warnLevel + 1
            updateAccused.myBadList.push(reportUpd._id)
        }

        if (!reportUpd || !updateAccuser || !updateAccused) {
            return res.status(400).json({ status: 'failure' })
        }

        const new1 = new notificationModel({
            content: 'Chúng tôi cảm ơn bạn vì đã tố cáo những tài khoản có hành vi vi phạm điều khoản!',
            type: 'infor',
            recipient: [reportUpd.accuser]
        })

        const new2 = new notificationModel({
            content: 'Chúng tôi nhận thấy bạn có hành vi vi phạm điều khoản của chúng tôi! Nếu những hành vi này còn xảy ra, chúng tôi bắt buộc phải khóa tài khoản của bạn!',
            type: 'warning',
            recipient: [reportUpd.accused]
        })
        await new1.save({ session })
        await new2.save({ session })

        updateAccuser.notification.unshift(new1._id)
        updateAccused.notification.unshift(new1._id)

        await updateAccuser.save({ session })
        await updateAccused.save({ session })
        io.in([reportUpd.accuser.toString(), reportUpd.accused.toString()]).emit('new_notification', 'new')

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
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const id = req.params.id
        const { userId } = req.body

        if (!id) {
            return res.status(400).json({ status: 'failure' })
        }

        const update = await productModel.findById(id)

        if (!update) {
            return res.status(400).json({ status: 'failure' })

        }
        const winner = update.winner || update.purchasedBy
        if (userId.toString() !== winner.toString()) {
            return res.status(400).json({ status: 'failure' })
        }

        if (update.successfulTransaction === false) {
            update.successfulTransaction = true
            update.paid = true
            update.statusPayment = 'Đã thanh toán'
            update.statusPaymentSlug = 'da-thanh-toan'
            await update.save({ session })
            let price;
            if (update.purchasedBy) {
                price = Number(update.price) / 24000;
            } else {
                price = Number(update.currentPrice) / 24000;
            }

            let payoutValue = 0
            if (price <= 0.41) {
                payoutValue = 0
            } else if (price <= 4.16) {
                payoutValue = 0.1
            } else if (price <= 20.83) { // be hon 500k thi lay 5k
                payoutValue = 0.2
            } else if (price <= 41.6) {
                payoutValue = 0.4
            } else {
                payoutValue = 1 // phi
            }
            price -= payoutValue
            const shop = await userModel.findById(update.owner)
            if (update.checkoutTypeSlug !== 'cod') {
                price -= shop.debt
                payoutValue += shop.debt
                price = price.toFixed(2).toString()
                await payouts(shop.emailPaypal, price, update._id, update.name) //emailPaypal cua nguoi nhan, value, productId,name
                if (payoutValue > 0) {
                    const newProfit = new profitModel({
                        product: update._id,
                        profit: payoutValue
                    })
                    await newProfit.save({ session })
                }
                shop.debt = 0
                const notification2 = new notificationModel({
                    content: `Chúng tôi vừa thanh toán cho bạn sản phẩm có tên "${update.name}", 
                    vui lòng kiểm tra lại! Nếu có bất kỳ sai sót nào xin vui lòng liên hệ với chúng tôi!`,
                    type: 'success',
                    recipient: [update.owner],
                    img: update.images[0] || ''
                })
                await notification2.save()
                shop.notification.unshift(notification2._id)
            } else {
                shop.debt = Number(shop.debt + payoutValue)  // lưu tiền nợ
            }



            const notification = new notificationModel({
                content: `Sản phẩm "${update.name}" đã được giao thành công!`,
                type: 'success',
                recipient: [update.owner],
                img: update.images[0] || ''
            })

            await notification.save()
            shop.notification.unshift(notification._id)
            await shop.save()


            io.in(update.owner.toString()).emit('new_notification', 'new')

        } else {
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
        const report = await reportModel.findByIdAndDelete(id).session(session)
        if (!report) {
            return res.status(400).json({ status: 'failure' })
        }
        const del2 = await userModel.updateMany({ $or: [{ myBadList: id }, { reportList: id }] }, { $pull: { myBadList: id, reportList: id } }, { new: true })
        if (!del2) {
            return res.status(400).json({ status: 'failure' })
        }

        const accused = await userModel.findById(report.accused)
        accused.warnLevel = accused.warnLevel - 1
        await accused.save({ session })

        await session.commitTransaction()
        session.endSession()
        return res.status(200).json({ status: 'success', message: "success" });
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}


// --------------------- REPORT HANDLE-------------------
const createRate = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { id, comment, star } = req.body

        const product = await productModel.findById(id).populate('owner winner purchasedBy')
        if (!product) {
            return res.status(400).json({ status: 'failure' })
        }
        const fromName = !product.sold ? `${product.winner.firstName} ${product.winner.lastName}` : `${product.purchasedBy.firstName} ${product.purchasedBy.lastName}`

        let from = {
            userId: !product.sold ? product.winner._id : product.purchasedBy._id,
            name: fromName,
            avatar: `https://ui-avatars.com/api/name=${fromName}&background=random`
        }
        let to = product.owner._id


        const images = req.files.map((file) => {
            return `${process.env.BASE_URL}/rate/${file.filename}`
        });

        const rate = new rateModel({
            from, to, comment, images, star: Number(star), product: id, productName: product.name
        })

        const newRate = await rate.save({ session })
        if (!newRate) {
            return res.status(400).json({ status: 'failure' })
        }

        const user = await userModel.findById(product.owner._id).populate('rate')
        const starRate = await handleStarRate(user, newRate)
        if (!starRate) {
            return res.status(400).json({ status: 'failure' })
        }

        user.rate.unshift(newRate._id)
        user.starRate = starRate
        product.rate = rate._id


        await product.save({ session })

        //xu li tao thong bao va thong bao den nguoi dung
        const notification = new notificationModel({
            content: `Bạn có một đánh giá mới từ sản phẩm ${product.name}`,
            type: 'infor',
            recipient: [product.owner._id],
            img: product.images[0] || ''
        })

        await notification.save({ session })

        user.notification.unshift(notification._id)
        await user.save({ session })

        io.in(product.owner._id.toString()).emit('new_notification', 'new')

        await session.commitTransaction()
        session.endSession()
        return res.status(200).json({ status: 'success', message: "success" });

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500)
    }
}

const replyComment = async (req, res) => {
    try {
        const rateId = req.params.rateId
        const { comment } = req.body

        const dataFromToken = req.dataFromToken

        const rate = await rateModel.findById(rateId).populate('product')

        if (!rate) {
            return res.status(400).json({ status: 'failure' })
        }

        if (rate.to.toString() !== dataFromToken._id) {
            return res.status(400).json({ status: 'failure' })
        }

        rate.replyComment = comment
        await rate.save()
        //xu li tao thong bao va thong bao den nguoi dung
        const notification = new notificationModel({
            content: `Người bán đã phản hồi một đánh giá của bạn!`,
            type: 'infor',
            recipient: [rate.from.userId],
            img: rate.product.images[0] || ''
        })

        await notification.save()
        const receiver = await userModel.findById(rate.from.userId)
        receiver.notification.unshift(notification._id)
        await receiver.save()

        io.in(rate.from.userId.toString()).emit('new_notification', 'new')


        return res.status(200).json({ status: 'success', message: "success" });
    } catch (error) {
        return res.status(500)
    }
}

const handleStarRate = async (user, newRate) => {
    try {
        let currStar = user.rate.reduce((accumulator, currentValue) => accumulator + currentValue.star, 0)
        currStar += newRate.star
        let countRate = user.rate.length + 1
        let starRate = currStar / countRate
        return starRate
    } catch (error) {
        return false
    }
}

// --------------------- Follow user HANDLE-------------------

const addFollow = async (req, res) => {
    try {
        const { followEmail, myId } = req.body
        const dataFromToken = req.dataFromToken

        if (followEmail === dataFromToken.email) { // tu follow
            return res.status(400).json({ status: 'failure', msg: 'Bạn không thể tự theo dõi mình' })
        }

        if (dataFromToken._id !== myId) { // lay id cua nguoi khac roi follow
            return res.status(400).json({ status: 'failure' })
        }

        // người đc follow
        const user = await userModel.findOne({ email: followEmail })
        if (user.follow.includes(myId)) {
            return res.status(400).json({ status: 'failure', msg: 'Bạn đã theo dõi người này rồi!' })
        }
        user.follow.push(myId)
        if (!user) {
            return res.status(400).json({ status: 'failure' })
        }
        // người follow
        const myAcc = await userModel.findByIdAndUpdate(myId, {
            $push: { followTo: user._id }
        }, { new: true })
        if (!myAcc) {
            return res.status(400).json({ status: 'failure' })
        }

        //Thông báo cho người được follow
        const notification = new notificationModel({
            content: `Bạn có một lượt theo dõi mới từ ${myAcc.email}`,
            type: 'infor',
            recipient: [user._id],
            // img: rate.product.images[0] || ''
        })

        await notification.save()
        user.notification.unshift(notification._id)
        await user.save()

        io.in(user._id.toString()).emit('new_notification', 'new')


        return res.status(200).json({ status: 'success', message: "success" });

    } catch (error) {
        return res.status(500)
    }
}

const unFollow = async (req, res) => {
    try {
        const { followEmail, myId } = req.body
        const dataFromToken = req.dataFromToken

        if (dataFromToken._id !== myId) {
            return res.status(400).json({ status: 'failure' })
        }

        // người bị unfollow
        const user = await userModel.findOneAndUpdate({ email: followEmail }, {
            $pull: {
                follow: myId
            }
        }, { new: true })


        if (!user) {
            return res.status(400).json({ status: 'failure' })
        }

        // người follow
        const myAcc = await userModel.findOneAndUpdate({ email: dataFromToken.email }, {
            $pull: {
                followTo: user._id
            }
        }, { new: true })
        if (!myAcc) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', message: "success" });

    } catch (error) {
        return res.status(500)
    }
}


// --------------------- Follow product HANDLE-------------------

const addFollowProduct = async (req, res) => {
    try {
        const { productId, time, type } = req.body
        const dataFromToken = req.dataFromToken
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(400).json({ status: 'failure' })
        }

        const user = await userModel.findById(dataFromToken._id)

        if (type === 'pre-start') {
            // Giá trị thời gian ban đầu
            const originalTime = new Date(product.startTime);

            // Sao chép giá trị thời gian
            const previousTime = originalTime.getTime() - (time * 60000);

            const check = user.followProductPreStart.find((item) => item.productId.toString() === productId)
            if (check) {
                return res.status(400).json({ status: 'failure' })
            }

            user.followProductPreStart.push({
                productId,
                time: previousTime,
                timeInput: time,
                type: 'pre-start'
            })

            await user.save()

        } else {
            const originalTime = new Date(product.endTime);

            // Sao chép giá trị thời gian
            const previousTime = originalTime.getTime() - (time * 60000);

            const check = user.followProductPreEnd.find((item) => item.productId.toString() === productId)
            if (check) {
                return res.status(400).json({ status: 'failure' })
            }

            user.followProductPreEnd.push({
                productId,
                time: previousTime,
                timeInput: time,
                type: 'pre-end'
            })

            await user.save()
        }
        const check = product.follower.find((item) => item === user._id)
        if (!check) {
            product.follower.push(user._id)
            await product.save()
        }



        return res.status(200).json({ status: 'success', msg: "success" });

    } catch (error) {
        return res.status(500)
    }
}

const unFollowProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const dataFromToken = req.dataFromToken

        const user = await userModel.updateOne({ _id: dataFromToken._id }, {
            $pull: {
                followProductPreStart: { productId: productId },
                followProductPreEnd: { productId: productId }
            }
        }, { new: true })

        const productUpdate = await productModel.updateOne({ _id: productId },
            {
                $pull: { follower: dataFromToken._id }
            }, { new: true })

        if (!user) {
            return res.status(400).json({ status: 'failure' })
        }

        if (!productUpdate) {
            return res.status(400).json({ status: 'failure' })
        }

        return res.status(200).json({ status: 'success', msg: "success" });

    } catch (error) {
        return res.status(500)
    }
}


// --------------------- Contact-------------------

const contact = async (req, res) => {
    try {
        const { name, content, phoneNumber } = req.body

        const newContact = new contactModel({
            name,
            phoneNumber,
            email: req.body.email || '',
            address: req.body.address || '',
            content
        })
        const ct = await newContact.save()
        if (!ct) {
            return res.status(400).json({ status: 'failure', msg: "Gửi liên hệ không thành công!" })
        }
        return res.status(201).json({ status: 'success', msg: "success" });

    } catch (error) {
        return res.status(500)
    }
}

const handleMilestone_server = async (data) => {
    const product = await productModel.findById(data.productId)
    const client = await userModel.findById(data.clientId)

    //Thông báo cho người được follow
    const notification = new notificationModel({
        content: `Cuộc đấu giá "${product.name}" sẽ ${data.type === 'pre-start' ? 'bắt đầu' : 'kết thúc'}  sau khoảng ${data.timeInput} phút nữa!`,
        type: 'infor',
        recipient: [data.clientId],
        img: product.images[0] || '',
        link: `/chi-tiet-dau-gia/${product._id}`
    })

    await notification.save()
    client?.notification.unshift(notification._id)
    await client?.save()

    await userModel.updateOne({ _id: data.clientId }, {
        $pull: {
            followProductPreStart: { _id: data.milestoneId },
            followProductPreEnd: { _id: data.milestoneId }
        }
    }, { new: true })

    await productModel.updateOne({ _id: data.productId },
        {
            $pull: { follower: data.clientId }
        }, { new: true })

    io.in(client?._id.toString()).emit('new_notification', 'milestone_new')
// 
}

//  ui

const getNumberOfIntro = async (req, res) => {
    try {
        const data = {
            auction: 0,
            free: 0,
            news: 0,
            user: 0
        }
        const statistic = await statisticModel.find()
        statistic.forEach((item) => {
            data.auction += item.auctionCount
            data.free += item.freeProductCount
            data.news += item.newsCount
            data.user += item.userCount
        })
        return res.status(200).json({ status: 'success', data });

    } catch (error) {
        return res.status(500)
    }
}





export {
    createRate, contact, handleMilestone_server, replyComment, getUserByEmail, addFollow, unFollow, addFollowProduct, unFollowProduct,
    getParticipateReceiving, getRefuseFreeProducts, sendMailToUser, getNotifications, updateNotifications, getNumberOfIntro,
    getRefuseProducts, getBidsProducts, getReceivedProducts, getFreeProductsByOwner, deleteNotification,
    getProductsByOwner, deleteProductHistory, getPurchasedProducts, getWinProducts, updateProfile, createOTP, verifyAccount,
    deleteUserById, updateBidsForUserById_server, getUserById, signIn, signUp, resetPass, deleteReport, confirmResetPass,
    changePass, updateBlockUserById, getAllUser, approveReport, createReport, getReports, handleFinishTransaction
};
