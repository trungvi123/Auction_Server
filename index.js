import express from "express";
import cors from 'cors'
import mongoose from 'mongoose'
import env from 'dotenv'
import bodyparser from 'body-parser'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import categoryRouter from './routes/categoryRoute.js'

env.config()



const app = express()
const corsOrigin = {
    origin: [process.env.CLIENT_URL || process.env.BASE_URL], //or whatever port your frontend is using
    credentials: true,
};

app.use(express.static('public'))

app.use(cors(corsOrigin));
app.use(cors())
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use('/user', userRouter)
app.use('/product', productRouter)
app.use('/category', categoryRouter)


const PORT = process.env.PORT || 6000
const URI = process.env.URI_KEY

mongoose.set("strictQuery", true);

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('connected db');
    app.listen(PORT, () => {
        console.log(`server run ${PORT}`);
    })
}).catch(() => {
    console.log('can not connect db');
})


 






