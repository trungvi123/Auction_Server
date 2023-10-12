import mongoose from "mongoose";


const schema = mongoose.Schema({
    type: { // user,default
        type: String,
        require: true
    },
    year: {
        type: String,
        require: true
    },
    userCount: {
        type: Number,
        default: 0
    },
    auctionCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

export const statisticModel = mongoose.model('auction_statistic', schema)