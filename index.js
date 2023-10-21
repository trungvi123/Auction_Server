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
import cookieParser from 'cookie-parser'
import startWebsocket from "./io/index.js";
import http from 'http'
import { Server } from 'socket.io'
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
startWebsocket(io)

app.use(express.static('public'))

app.use(cors())
app.use(cors(corsOrigin));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/user', userRouter)
app.use('/product', productRouter)
app.use('/freeProduct', freeProductRouter)
app.use('/admin/', adminRouter)
app.use('/category', categoryRouter)
app.use('/token', tokenRouter)
app.use('/room', roomRouter)
app.use('/payment', paymentRouter)




const PORT = process.env.PORT || 6000
const URI = process.env.URI_KEY

mongoose.set("strictQuery", true);
server.listen(PORT, () => {
    console.log(`server run ${PORT}`);
})
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('connected db');

}).catch(() => {
    console.log('can not connect db');
})

export default server
export { io }










