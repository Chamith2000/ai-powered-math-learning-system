const mongoose = require("mongoose");

const mathsVideoLectureSchema = new mongoose.Schema({
  lectureType: { type: Number, enum: [1, 2, 3], required: true }, // 1=video, 2=no video, 3=material only
  lectureTytle: { type: String, required: true, trim: true },
  lectureDifficulty: { type: String, trim: true },
  grade: { type: Number, default: 3 },
  score: { type: Number, default: 100 },
  teacherGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherGuide", required: true },
  videoUrl: { type: String, default: null },
  description: { type: String },
  pdfMaterials: { type: [String], default: [] }, // allow multiple PDFs

  createby: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("MathsVideoLecture", mathsVideoLectureSchema);
