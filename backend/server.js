const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db')

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const userRoleRoutes = require("./src/routes/userRoleRoutes");
const studentPerformanceRoutes = require("./src/routes/studentPerformanceRoutes");
const studentPerformanceHistoryRoutes = require("./src/routes/studentPerformanceHistoryRoutes");
const videoLectureRoutes = require("./src/routes/videoLectureRoutes");

const startingPaperTitleRoutes = require("./src/routes/startingPaperTitleRoutes");
const startingPaperQuestionRoutes = require("./src/routes/startingPaperQuestionRoutes");
const teacherGuideRoutes = require("./src/routes/teacherGuideRoutes");
const teacherGuideFeedBackRoutes = require("./src/routes/teacherGuideFeedBackRoutes");
const mathsVideoLectureRoutes = require("./src/routes/mathsVideoLectureRoutes");
const mathsPapersRoutes = require("./src/routes/mathsPapersRoutes");
const mathsQandARoutes = require("./src/routes/mathsQandARoutes");
const completedLectureRoutes = require("./src/routes/completedLectureRoutes");


app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/user-roles", userRoleRoutes);
app.use("/api/student-performance", studentPerformanceRoutes);
app.use("/api/student-performance-history", studentPerformanceHistoryRoutes);
app.use("/api/video-lectures", videoLectureRoutes);

app.use("/api/starting-paper-titles", startingPaperTitleRoutes);
app.use("/api/starting-paper-questions", startingPaperQuestionRoutes);
app.use("/api/teacher-guides", teacherGuideRoutes);
app.use("/api/teacher-guide-feedbacks", teacherGuideFeedBackRoutes);
app.use("/api/maths/video-lectures", mathsVideoLectureRoutes);
app.use("/api/maths/papers", mathsPapersRoutes);
app.use("/api/maths/qanda", mathsQandARoutes);
app.use("/api/completed-lectures", completedLectureRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
