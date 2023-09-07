import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import jwt from 'jsonwebtoken'

import { userModel } from "../model/userModel.js";
import configMail from "../utils/configMail.js";


const getUserById = async (req, res) => {
    const idUser = req.params.id

    const user = await userModel.findById(idUser).select('_id firstName lastName email address phoneNumber')

    if (!user) {
        return res.status(400).json({ status: 'failure', errors: { msg: 'thất bại!' } })
    }
    return res.status(200).json({ status: 'success', user })

};

const signUp = async (req, res) => {
    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { email, address, idCard, bankName, bankNumber, password, lastName, phoneNumber } = req.body

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
            bankNumber,
            bankName,
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
            lastName: user.lastName
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
    try {
        const id = req.params.id
        const { type, idProd } = req.body
        let data
        if (type === 'win') { // join || buy || win
            data = await userModel.updateMany({ _id: id }, { $pull: { winProduct: idProd } }, { new: true })
        } else if (type === 'join') {
            data = await userModel.updateMany({ _id: id }, { $pull: { bids: idProd } }, { new: true })
        } else {
            data = await userModel.updateMany({ _id: id }, { $pull: { purchasedProduct: idProd } }, { new: true })
        }
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success' })
    } catch (err) {
        return res.status(500)
    }
}



export { getBidsProducts, getProductsByOwner, deleteProductHistory, getPurchasedProducts, getWinProducts, deleteUserById, updateBidsForUserById_server, getUserById, signIn, signUp, resetPass, changePass };
