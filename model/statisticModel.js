import mongoose from "mongoose";


const schema = mongoose.Schema({
    year: {
        type: String,
        require: true,
        unique: true
    },
    months: [
        {
            month: {
                type: String,
                default: ''
            },
            userCountInMonth: {
                type: Number,
                default: 0
            },
            newsCountInMonth: {
                type: Number,
                default: 0
            },
            auctionCountInMonth: {
                type: Number,
                default: 0
            },
            freeProductCountInMonth: {
                type: Number,
                default: 0
            }
        }
    ],
    userCount: {
        type: Number,
        default: 0
    },
    newsCount: {
        type: Number,
        default: 0
    },
    auctionCount: {
        type: Number,
        default: 0
    },
    freeProductCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

export const statisticModel = mongoose.model('auction_statistic', schema)