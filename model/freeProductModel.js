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
    images: [
        {
            type: String,
        }
    ],
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_categogy',
    },
    status: {
        type: String,
        default: 'Đang chờ duyệt',
        // Đã được duyệt
        // Đã từ chối
        // Yêu cầu duyệt lại
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
    accepterList: [
        {
            lastName: {
                type: String,
                default: 'Ẩn danh'
            },
            user: {
                type: mongoose.Types.ObjectId,
                ref: 'auction_user',
                // required: true,
            },
            message: {
                type: String,
                // required: true,
            },
            time: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    isFree: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

export const freeProductModel = mongoose.model('auction_freeProduct', schema)