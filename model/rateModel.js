import mongoose from "mongoose";


const schema = mongoose.Schema({
    from: {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: 'auction_user'
        },
        name: {
            type: String
        },
        avatar: {
            type: String
        }
    },
    to: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_user'
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_product'
    },
    productName:{
        type: String
    },
    comment: {
        type: String
    },
    replyComment: {
        type: String
    },
    star: {
        type: Number
    },
    images: [
        {
            type: String
        }
    ],
},
    { timestamps: true })

export const rateModel = mongoose.model('auction_rate', schema)