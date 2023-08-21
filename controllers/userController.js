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
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'failure' });
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
            lastName: user.lastName
        }

        jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: 36000 }, (err, token) => {
            if (err) {
                throw err;
            }
            res.status(200).json({ status: 'success', token });
        })


    } catch (error) {
        res.status(500).json({ status: 'failure' });
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
                res.status(500).json({ status:'failure', message: "Gửi mail thất bại!" });

            } else {
                res.status(200).json({ status:'success',message: "success" });
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

export { deleteUserById, getUserById, signIn, signUp, resetPass, changePass };
