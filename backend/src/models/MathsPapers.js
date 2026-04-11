const mongoose = require("mongoose");

const mathsPapersSchema = new mongoose.Schema({
  paperTytle: { type: String, required: true, trim: true },
  paperDifficulty: { type: String, trim: true },
  grade: { type: Number, default: 3 },
  teacherGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherGuide", required: true }
}, { timestamps: true });

module.exports = mongoose.model("MathsPapers", mathsPapersSchema);
