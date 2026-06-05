const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const connectDB = require('./config/db');
const consumerRouter = require('./routers/consumerRoutes');
const companyRouter = require('./routers/companyRoutes');
const cors = require('cors');



connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());


app.use('/consumer',consumerRouter);
app.use('/company',companyRouter);

PORT = 5000;

app.listen(PORT,()=>{
    console.log(`Server is listening at port : ${PORT}`);
})