import express from "express";
import cors from 'cors'
import mongoose from 'mongoose'
import env from 'dotenv'
import bodyparser from 'body-parser'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import categoryRouter from './routes/categoryRoute.js'
import tokenRouter from './routes/tokenRoute.js'
import roomRouter from './routes/roomRoute.js'
import freeProductRouter from './routes/freeProductRoute.js'
import paymentRouter from './routes/paymentRoute.js'



import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import http from 'http'
import { getCurrentPriceById_server, updateCurrentPriceById_server, updateBidForProduct_server } from "./controllers/productController.js";
import { updateBidsForUserById_server } from "./controllers/userController.js";
env.config()


const app = express()
const corsOrigin = {
    origin: process.env.CLIENT_URL || process.env.BASE_URL, //or whatever port your frontend is using
    credentials: true,
};

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || process.env.BASE_URL,
        methods: ["*"]
    }
})

app.use(express.static('public'))

app.use(cors(corsOrigin));
// app.use(cors())
app.use(bodyparser.json());
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use('/user', userRouter)
app.use('/product', productRouter)
app.use('/freeProduct', freeProductRouter)

app.use('/category', categoryRouter)
app.use('/token', tokenRouter)
app.use('/room', roomRouter)
app.use('/payment',paymentRouter)

io.on('connection', (socket) => {
    socket.on('joinRoom',(data)=>{
        socket.join(data)
    })

    socket.on('bid_price', async (data) => {
        const idProduct = await getCurrentPriceById_server(data.product)
        if (data.price > parseFloat(idProduct.currentPrice)) {
            const upPrice = await updateCurrentPriceById_server(data.product, data.price)
            if (upPrice) {
                const res = {
                    product: data.product,
                    price: upPrice.currentPrice,
                    users: data.users,
                }
                socket.broadcast.emit('respone_bid_price', res)
            }
            const infor = {
                user: data.users,
                price: data.price,
                lastName: data.lastName
            }
            const upBids = await updateBidForProduct_server(data.product, infor)
            const upBids2 = await updateBidsForUserById_server(data.users, data.product)

            io.in(data.room).emit('respone_bids', upBids.bids)

        }
    })
})

const PORT = process.env.PORT || 6000
const URI = process.env.URI_KEY

mongoose.set("strictQuery", true);

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('connected db');
    server.listen(PORT, () => {
        console.log(`server run ${PORT}`);
    })
}).catch(() => {
    console.log('can not connect db');
})









