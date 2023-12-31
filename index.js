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
import adminRouter from './routes/adminRoute.js'
import newsRouter from './routes/newsRoute.js'

import cookieParser from 'cookie-parser'
import startWebsocket from "./io/index.js";
import http from 'http'
import { Server } from 'socket.io'
env.config()

const app = express()
const corsOrigin = {
    origin: [process.env.CLIENT_URL, process.env.CLIENT_URL2, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
};
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL, process.env.CLIENT_URL2, 'http://localhost:3000'], // nhớ xóa khi mt product
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
})
startWebsocket(io)

app.use(express.static('public'))

// app.use(cors())
app.use(cors(corsOrigin));
app.options("", cors(corsOrigin))
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/user', userRouter)
app.use('/product', productRouter)
app.use('/freeProduct', freeProductRouter)
app.use('/admin', adminRouter)
app.use('/category', categoryRouter)
app.use('/token', tokenRouter)
app.use('/room', roomRouter)
app.use('/payment', paymentRouter)
app.use('/news', newsRouter)

app.get('/', (req, res) => {
    res.send('Hello')
})




const PORT = process.env.PORT || 6000
const URI = process.env.URI_KEY

try {
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
} catch (error) {
    console.log(error);
}


export default server
export { io }










