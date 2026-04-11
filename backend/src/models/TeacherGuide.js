const mongoose = require("mongoose");

const teacherGuideSchema = new mongoose.Schema({
  coureInfo: { type: String, required: true },               // course info (kept your spelling)
  originalTeacherGuide: { type: String, required: true },    // could be large text
  createBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studytime: { type: Number, min: 0, default: 0 },
  timeAllocations: {
    introduction: { type: Number, default: 0 },
    concept_explanation: { type: Number, default: 0 },
    worked_examples: { type: Number, default: 0 },
    practice_questions: { type: Number, default: 0 },
    word_problems: { type: Number, default: 0 },
    pacing: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model("TeacherGuide", teacherGuideSchema);
