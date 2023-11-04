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
    emailPaypal: {
        type: String,
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
    address: {
        type: String,
        require: true,
    },
    reliability: {
        type: String,
    },
    verifyAccount: {
        type: Boolean,
        default: false
    },
    lastOTP: {
        OTP: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    purchasedProduct: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_product'
        }
    ],
    participateReceiving: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_freeProduct'
        }
    ],
    receivedProduct: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_freeProduct'
        }
    ],
    winProduct: [
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
    createdFreeProduct: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_freeProduct'
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
    rate: [{
        type: mongoose.Types.ObjectId,
        ref: 'auction_rate',
    }],
    starRate: {
        type: Number
    },
    myBadList: [ // danh sách những report về bản thân
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_report',
        }
    ],
    reportList: [ // danh sách những người mà mình đã tố cáo
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_report',
        }
    ],
    notification: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_notification',
        }
    ],
    followTo: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_user',
        }
    ],
    follow: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'auction_user',
        }
    ],
    followProductPreStart: [
        {
            productId: {
                type: mongoose.Types.ObjectId,
                ref: 'auction_product',
            },
            time: {
                type: String
            },
            timeInput: {
                type: String
            },
            type: {
                type: String
            },
        }
    ],
    followProductPreEnd: [
        {
            productId: {
                type: mongoose.Types.ObjectId,
                ref: 'auction_product',
            },
            time: {
                type: String
            },
            timeInput: {
                type: String
            },
            type: {
                type: String
            },
        }
    ],
    warnLevel: {
        type: Number,
        default: 0
    },
    block: {
        type: Boolean,
        default: false
    }


}, { timestamps: true })

export const userModel = mongoose.model('auction_user', schema)







