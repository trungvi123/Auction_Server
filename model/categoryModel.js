import mongoose from "mongoose";


const schema = mongoose.Schema({
    name:{
        type: String,
        require:true
    },
    link:{
        type: String,
        require:true
    },
    products:[
        {
            type: mongoose.Types.ObjectId,
            ref:'auction_product'
        }
    ],
    freeProducts:[
        {
            type: mongoose.Types.ObjectId,
            ref:'auction_freeProduct'
        }
    ]
  },
  { timestamps: true })

export const categoryModel = mongoose.model('auction_categogy',schema)