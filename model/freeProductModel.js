import mongoose from "mongoose";


const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: ''
    },
    startTime: {
        type: String,
        require: true
    },
    endTime: {
        type: String
    },
    duration: {
        type: Number,
        require: true
    },
    soldAt: {
        type: String,
    },
    images: [
        {
            type: String,
        }
    ],
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_categogy',
    },
    freeProductStarted: { // admin duyet thi se bat dau
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        default: 'Đang chờ duyệt',
        // Đã được duyệt
        // Đã từ chối
        // Yêu cầu duyệt lại
    },
    freeProductEnded: { // het thoi gian sẽ là true
        type: Boolean,
        default: false,
    },
    sold: {
        type: Boolean,
        default: false,
    },
    owner: { // người tạo 
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
        require: true
    },
    accepter: { // người nhận
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    isFree: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

export const productModel = mongoose.model('auction_product', schema)