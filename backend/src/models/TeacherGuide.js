const mongoose = require("mongoose");

const teacherGuideSchema = new mongoose.Schema({
  coureInfo: { type: String, required: true },               // course info (kept your spelling)
  originalTeacherGuide: { type: String, required: true },    // could be large text
  createBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studytime: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("TeacherGuide", teacherGuideSchema);
