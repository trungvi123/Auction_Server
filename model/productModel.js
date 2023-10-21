import mongoose from "mongoose";


const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    lazyName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: ''
    },
    lazyDescription: {
        type: String,
        default: ''
    },
    basePrice: {
        type: mongoose.Types.Decimal128,
        required: true,
    },
    price: {
        type: mongoose.Types.Decimal128,
        require: true
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
    sold: {
        type: Boolean,
        default: false,
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
    stateSlug: {
        type: String,
        default: 'sap-dien-ra'
        //dang-dien-ra
        //da-ket-thuc
    },
    state: {
        type: String,
        default: 'Sắp diễn ra'
        // Đang diễn ra
        // Đã kết thúc
    },
    auctionStarted: { // admin duyet thi se bat dau
        type: Boolean,
        default: false,
    },
    auctionEnded: { // het thoi gian sẽ là true
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
    statusPayment: {
        type: String,
        default: 'Chưa thanh toán',
        // Đã thanh toán
    },
    statusPaymentSlug: {
        type: String,
        default: 'chua-thanh-toan',
        // Đã thanh toán
    },
    outOfDatePayment: {
        type: String,
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
    winner: { // người win bid
        type: mongoose.Types.ObjectId,
        ref: 'auction_user',
    },
    room: { // người bid hiện tại
        type: mongoose.Types.ObjectId,
        ref: 'auction_room',
    },
    paid: {
        type: Boolean,
        default: false
    },
    bids: [
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
            price: {
                type: mongoose.Types.Decimal128,
                // required: true,
            },
            time: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    auctionTypeSlug: {
        type: String,
        default: 'dau-gia-xuoi',
        // dau-gia-nguoc
    },
    checkoutTypeSlug: {
        type: String,
        default: 'cod',
        // payment
    },
    isFree: {
        type: Boolean,
        default: false
    },
    page: {
        type: Number
    },
    shipping: {
        type: Boolean,
        default: false
    },
    successfulTransaction: {
        type: Boolean,
        default: false
    },
    payout_batch_id: { // view detail payout
        type: String,
        default: ''
    }

}, { timestamps: true })

export const productModel = mongoose.model('auction_product', schema)