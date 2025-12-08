const mongoose = require("mongoose");

const teacherGuideFeedBackSchema = new mongoose.Schema({
  teacherGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherGuide", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentFeedback: { type: String, required: true },
  marks: { type: Number, default: 0, min: 0 },
  studytime: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model("TeacherGuideFeedBack", teacherGuideFeedBackSchema);
