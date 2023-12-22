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
    outOfStock: {
        type: Boolean,
        default: false,
    },
    owner: { // người tạo 
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
        require: true
    },
    receiver: {
        type: mongoose.Types.ObjectId,
        ref: 'auction_user'
    },
    accepterList: [
        {
            lastName: {
                type: String,
            },
            email: {
                type: String
            },
            user: {
                type: mongoose.Types.ObjectId,
                ref: 'auction_user',
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
    },
    page: {
        type: Number
    },
    stateSlug: {
        type: String,
        default: 'sap-dien-ra'
        //dang-dien-ra
        //sap-ket-thuc
        //da-ket-thuc
    },
    state: {
        type: String,
        default: 'Sắp diễn ra'
    },
    hide: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

export const freeProductModel = mongoose.model('auction_freeProduct', schema)