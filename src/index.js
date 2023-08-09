import express from "express";
import cors from 'cors'
import mongoose from 'mongoose'
import env from 'dotenv'
import bodyparser from 'body-parser'


import userRouter from './routes/userRoute.js'

env.config()


const app = express()

const corsOrigin = {
    origin: ["http://localhost:3000"], //or whatever port your frontend is using
    credentials: true,
};
app.use(cors(corsOrigin));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use('/user',userRouter)



const PORT = process.env.PORT || 6000
const URI = process.env.URI_KEY
app.use(cors())
mongoose.set("strictQuery", true);

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('connected db');
    app.listen(PORT, () => {
        console.log('server run');
    })
}).catch(() => {
    console.log('can not connect db');
})









