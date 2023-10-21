import mongoose from "mongoose";


const schema = mongoose.Schema({
    img: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        require: true
    },
    type: {
        type: String,
        default: 'infor'
        //warning
    },
    recipient: { // id người nhận
        type: mongoose.Types.ObjectId,
        ref: 'auction_user'
    },
    read: {
        type: Boolean,
        default: false
    },
},
    { timestamps: true })

export const notificationModel = mongoose.model('auction_notification', schema)