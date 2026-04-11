const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    detectionType: {
        type: String, // e.g. "phone"
        required: true,
    },
});

const paperLogSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        paperId: {
            type: mongoose.Schema.Types.ObjectId, // Could ref MathsPapers or StartingPaperTitles
            required: true,
        },
        paperTitle: {
            type: String,
            required: true,
        },
        paperType: {
            type: String, // "Maths" or "Starting"
            required: true,
        },
        marks: {
            type: Number,
            required: true,
            default: 0,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        timeSpent: {
            type: Number, // In seconds
            required: true,
            default: 0,
        },
        cheatIncidents: [incidentSchema],
        suspiciousActivity: {
            type: Boolean,
            default: false,
        },
        dominantEmotion: {
            type: String, // e.g. "Happy", "Sad"
        },
    },
    { timestamps: true }
);

// Pre-save hook to flag suspicious activity automatically based on incidents
paperLogSchema.pre("save", function (next) {
    if (this.cheatIncidents && this.cheatIncidents.length > 0) {
        this.suspiciousActivity = true;
    } else {
        this.suspiciousActivity = false;
    }
    next();
});

module.exports = mongoose.model("PaperLog", paperLogSchema);
