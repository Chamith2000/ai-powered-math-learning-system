const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db')

const teacherGuideRoutes = require("./src/routes/teacherGuideRoutes");
const teacherGuideFeedBackRoutes = require("./src/routes/teacherGuideFeedBackRoutes");


app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/teacher-guides", teacherGuideRoutes);
app.use("/api/teacher-guide-feedbacks", teacherGuideFeedBackRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});