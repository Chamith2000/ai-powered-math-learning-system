const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db')


app.use(express.json());
app.use(cors());

connectDB();



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});