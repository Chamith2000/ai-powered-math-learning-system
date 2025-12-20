const mongoose = require("mongoose");

const mathsQandASchema = new mongoose.Schema({
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: "MathsPapers", required: true },
  questionTytle: { type: String, required: true, trim: true },
  questionAnswer: { type: String, required: true },
  topicTag: { type: String, trim: true },
  score: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("MathsQandA", mathsQandASchema);
