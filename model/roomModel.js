import mongoose from "mongoose";


const schema = mongoose.Schema({
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'auction_product',
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'auction_user',
      },
    ],
  },
  { timestamps: true })

export const roomModel = mongoose.model('auction_room',schema)