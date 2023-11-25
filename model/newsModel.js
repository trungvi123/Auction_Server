import mongoose from "mongoose";


const schema = mongoose.Schema({
    title: {
        type: String,
        require: true

    },
    description: {
        type: String,
        require: true

    },
    content: {
        type: String,
        require: true

    },
    owner: {
            type: mongoose.Types.ObjectId,
            ref: 'auction_user'
    },
    img: {
        type: String
    },
    isApprove: {
        type: Number,
        enum: [-1, 0, 1],
        default: 0
        // -1 refuse
        // 0 pending
        // 1 approve
    },
    reApprove: {
        type: Boolean,
        default: false
    },
    hide: {
        type: Boolean,
        default: false
    },
    newsSystem: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true })

export const newsModel = mongoose.model('auction_news', schema)