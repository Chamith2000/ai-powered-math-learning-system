const mongoose = require("mongoose");

// One document per learning session (quiz attempt or lecture completion).
// Raw session fields are enriched into ML features by studentTracker.js.
const studentPerformanceHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Session outcome ──────────────────────────────────────────────────────
    sessionScore:  { type: Number, default: 0, min: 0, max: 100 }, // 0-100 percentage score
    score:         { type: Number, default: 0, min: 0, max: 100 }, // alias of sessionScore for ML compatibility

    // ── Raw ML input fields (in minutes, matching training data) ─────────────
    timeSpent:     { type: Number, default: 0, min: 0 },  // minutes spent working on quiz / watching video
    waitTime:      { type: Number, default: 0, min: 0 },  // minutes from resource available → student started (clamped ≤ 55.9)
    resourceScore: { type: Number, default: 0.055, min: 0, max: 1 }, // engagement ratio [0.055, 1.0]

    // ── Content metadata ─────────────────────────────────────────────────────
    difficulty:    { type: Number, default: 1, min: 1 },  // 1=Easy, 2=Medium, 3=Hard, 4=Very Hard, 5=Expert
    sessionType:   { type: String, enum: ["paper", "lecture", "login"], default: "paper" },

    // ── Timestamps ───────────────────────────────────────────────────────────
    sessionAt:       { type: Date, default: Date.now },   // when the session was completed / recorded
    quizAvailableAt: { type: Date, default: null },        // when the quiz was made available (for wait_time audit)

}, { timestamps: true });

// Fast lookups by user sorted by time
studentPerformanceHistorySchema.index({ userId: 1, sessionAt: 1 });

module.exports = mongoose.model("StudentPerformanceHistory", studentPerformanceHistorySchema);
