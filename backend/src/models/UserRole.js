const mongoose = require("mongoose");

const userRoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    status: { type: Number, enum: [0, 1], default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("UserRole", userRoleSchema);
