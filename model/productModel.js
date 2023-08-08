import mongoose from "mongoose";


const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    basePrice: {
        type: mongoose.Types.Decimal128,
        required: true,
    },
    currentPrice: {
        type: mongoose.Types.Decimal128,
        required: true,
    },
    stepPrice: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    startTime: {
        type: Date,
        require: true
    },
    endTime: {
        type: Date,
        require: true
    },
    duration: {
        type: Number,
        default: 300,
    },
    soldAt: {
        type: Date,
    },
    image: [
        {
            type: String,
        }
    ],
    catergory: {
        type: String,
    },
    auctionStarted: { // admin duyet thi se bat dau
        type: Boolean,
        default: false,
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
                required: true,
            },
            quantity: {
                type: types.Decimal128,
                required: true,
            },
            //   time: {
            //     type: Date,
            //     default: Date.now,
            //   },
        },
    ],

}, { timestamps: true })

export const productModel = mongoose.model('auction_product', schema)