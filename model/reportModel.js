import mongoose from "mongoose";


const schema = mongoose.Schema({
    type: [
        {
            type: String,
            require: true
        }
    ],
    productId:{
        type: mongoose.Types.ObjectId,
        ref: 'auction_product',
    },
    approve: {
        type: Boolean,
        default: false
    },
    accuser: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    accused: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    mailToAccuser:{
        type: Boolean,
        default: false
    },
    mailToAccused:{
        type: Boolean,
        default: false
    },
}, { timestamps: true })

export const reportModel = mongoose.model('auction_report', schema)