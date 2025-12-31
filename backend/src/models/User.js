const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    difficultyLevel: { type: String },
    suitabilityForCoding: { type: Number, enum: [0, 1], default: 0}, 
    suitableMethod: {type: String },
    entranceTest: { type: Number, enum: [0, 1], default: 0 },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "UserRole", required: true },
    status: { type: Number, enum: [0, 1], default: 1 },
    faceImgUrl:{type:String},
    VisualLearningCount:          { type: Number, default: 0, min: 0 },
    VisualLearningTotalMarks:     { type: Number, default: 0, min: 0 },
    AuditoryLearningCount:        { type: Number, default: 0, min: 0 },
    AuditoryLearningTotalMarks:   { type: Number, default: 0, min: 0 },
    KinestheticLearningCount:     { type: Number, default: 0, min: 0 },
    KinestheticLearningTotal:     { type: Number, default: 0, min: 0 },
    ReadWriteLearningCount:       { type: Number, default: 0, min: 0 },
    ReadWriteLearningTotal:       { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
