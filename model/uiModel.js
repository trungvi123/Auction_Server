import mongoose from "mongoose";

const schema = mongoose.Schema({
    configName: {
        type: String,
        require: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    short_intro: {
        type: String,
        default: ''
    },
    long_intro: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    map: {
        type: String,
        default: ''
    },
    mst: {
        type: String,
        default: ''
    },
    colors: [
        {
            color_primary: {
                type: String,
                default: ''
            },
            color_secondary: {
                type: String,
                default: ''
            }
        }
    ],
    images: [
        {
            img_logo: {
                type: String,
                default: ''
            },
            img_mini_logo: {
                type: String,
                default: ''
            },
            img_intro_homePage: {
                type: String,
                default: ''
            },
            img_breadcrum: {
                type: String,
                default: ''
            }
        }
    ]
},
    { timestamps: true })

export const uiModel = mongoose.model('auction_uis', schema)