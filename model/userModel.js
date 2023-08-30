import mongoose from "mongoose";


const schema = mongoose.Schema({
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        require: true,
        unique: true
    },
    hashPassWord: {
        type: String,
        require: true
    },
    birthday: {
        type: String,
    },
    idCard: {
        type: String,
        require: true,
        unique: true
    },
    role: {
        type: String,
        default: 'user' // admin
    },
    bankNumber: {
        type: String,
        require: true,
    },
    bankName: {
        type: String,
        require: true,
    },
    address: {
        type: String,
        require: true,
    },
    purchasedProduct: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_product'
        }
    ],
    createdProduct: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_product'
        }
    ],
    bids: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_product'
        }
    ],
    room: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_room',
        }
    ],
})

export const userModel = mongoose.model('auction_user', schema)







