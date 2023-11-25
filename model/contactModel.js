import mongoose from "mongoose";


const schema = mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
        require: true
    },
    address: {
        type: String,
    },
    content: {
        type: String,
    },
    reply: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true })

export const contactModel = mongoose.model('auction_contact', schema)