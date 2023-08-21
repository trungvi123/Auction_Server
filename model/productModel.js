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
    basePrice: {
        type: mongoose.Types.Decimal128,
        required: true,
    },
    price:{
        type: mongoose.Types.Decimal128,
        require:true
    },
    currentPrice: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    stepPrice: {
        type: mongoose.Types.Decimal128,
        default: 0
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
    auctionStarted: { // admin duyet thi se bat dau
        type: Boolean,
        default: false,
    },
    status:{
        type: String,
        default: 'Đang chờ duyệt',
        // Đã được duyệt
        // Đã bị từ chối
    },
    auctionEnded: { // het thoi gian sẽ là true
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
    purchasedBy: { // người mua
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    currentBidder: { // người bid hiện tại
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    bids: [
        {
            user: {
                type: mongoose.Types.ObjectId,
                ref: 'auction_user',
                // required: true,
            },
            quantity: {
                type: mongoose.Types.Decimal128,
                // required: true,
            },
            //   time: {
            //     type: Date,
            //     default: Date.now,
            //   },
        },
    ],

}, { timestamps: true })

export const productModel = mongoose.model('auction_product', schema)