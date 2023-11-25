import mongoose from "mongoose";


const schema = mongoose.Schema({
    product:{
        type: mongoose.Types.ObjectId,
        ref:'auction_product'
    },
    profit:{
        type: Number,
    }
  },
  { timestamps: true })

export const profitModel = mongoose.model('auction_profit',schema)