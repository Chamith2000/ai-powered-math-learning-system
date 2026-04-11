const mongoose = require("mongoose");

// Aggregate snapshot for a student – updated every time a session is recorded.
const studentPerformanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // ── Cumulative totals ────────────────────────────────────────────────────
    cumInteractions: { type: Number, default: 0, min: 0 },  // total sessions ever
    cumScoreMean: { type: Number, default: 0, min: 0 },  // running mean of all session scores
    totalStudyTime: { type: Number, default: 0, min: 0 },  // total seconds studied
    resourceScore: { type: Number, default: 0, min: 0 },  // latest resource score (updated per session)

    // ── Legacy / convenience ─────────────────────────────────────────────────
    totalScore: { type: Number, default: 0, min: 0 },  // sum of all session scores
    paperCount: { type: Number, default: 0, min: 0 },
    lectureCount: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0 },

    // ── ML helpers ───────────────────────────────────────────────────────────
    lastSessionAt: { type: Date, default: null },          // timestamp of the most recent session


}, { timestamps: true });

module.exports = mongoose.model("StudentPerformance", studentPerformanceSchema);
