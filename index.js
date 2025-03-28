const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./config/connectDB')
const router = require('./routes/index')
const authRouter = require('./routes/auth');
const cookiesParser = require('cookie-parser')
const { app, server } = require('./socket/index')

// const app = express()
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

console.log("CORS for Express: ", process.env.FRONTEND_URL);

app.use(express.json());
app.use(cookiesParser());
app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT || 8080

app.get('/',(request,response)=>{
    response.json({
        message : "Server running at " + PORT
    })
})

//api endpoints
app.use('/api',router)
app.use('/api', authRouter);

connectDB().then(()=>{
    server.listen(PORT,()=>{
        console.log("server running at " + PORT)
    })
})
