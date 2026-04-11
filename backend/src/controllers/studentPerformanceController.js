const StudentPerformance = require("../models/StudentPerformance");
const User = require("../models/User");
const axios = require("axios");
const historyController = require("./studentPerformanceHistoryController");

const FLASK_BASE = "http://localhost:5000";

// ─── ML Prediction: current performance ──────────────────────────────────────

exports.predictStudentPerformance = async (req, res) => {
    try {
        const { userId } = req.params;

        // Build the 15-feature payload via the history controller
        const payloadReq = { params: { userId } };
        const payloadRes = { json: (data) => data, status: () => ({ json: (data) => data }) };
        const payload = await historyController.getMLPayloadByUserId(payloadReq, payloadRes);

        if (payload.message) {
            return res.status(404).json(payload);
        }

        // POST to Flask /current-performance
        const mlResponse = await axios.post(`${FLASK_BASE}/current-performance`, payload);

        console.log("=========================================");
        console.log(`[ML] Flask Prediction Result (/current-performance) | User: ${userId}`);
        console.log(mlResponse.data);
        console.log("=========================================");

        // Response shape: { next_score, next_difficulty, improved_probability }
        res.status(200).json(mlResponse.data);
    } catch (error) {
        console.error("ML Prediction Error:", error.message);
        res.status(500).json({
            message: "Error calling ML Prediction API",
            error: error.message,
        });
    }
};


// ─── ML Forecast: future performance ─────────────────────────────────────────

exports.forecastStudentPerformance = async (req, res) => {
    try {
        const { userId } = req.params;

        // Build the forecast payload (needs ≥10 sessions)
        const payload = await historyController.buildForecastPayloadForUser(userId);

        if (!payload) {
            return res.status(400).json({
                message: "Not enough interaction history to generate a forecast (need at least 10 sessions).",
                predictions: null,
            });
        }

        // POST to Flask /future-forecast with { rows: [...] }
        const mlResponse = await axios.post(`${FLASK_BASE}/future-forecast`, payload);

        // Response shape:
        // {
        //   last_score: 96.19,
        //   predictions: {
        //     interaction_plus_1: { predicted_score, direction, estimated_date },
        //     interaction_plus_2: { ... },
        //     interaction_plus_3: { ... },
        //     interaction_plus_4: { ... },
        //   }
        // }
        res.status(200).json(mlResponse.data);
    } catch (error) {
        console.error("ML Forecasting Error:", error.message);
        res.status(500).json({
            message: "Error calling ML Forecasting API",
            error: error.message,
        });
    }
};


// ─── Risk Status Update ───────────────────────────────────────────────────────

/**
 * Calls the forecast API and updates the student's isRiskStudent field:
 *   0 = Stable / Improving
 *   1 = Moderate Risk (declining < 15 points over 4 interactions)
 *   2 = High Risk    (declining ≥ 15 points over 4 interactions)
 */
exports.updateRiskStatus = async (userId) => {
    try {
        const payload = await historyController.buildForecastPayloadForUser(userId);

        if (!payload) {
            return { success: false, message: "Not enough history for forecast" };
        }

        const mlResponse = await axios.post(`${FLASK_BASE}/future-forecast`, payload);
        const forecast = mlResponse.data;

        // Extract predicted scores from the correct response structure
        const p1 = forecast?.predictions?.interaction_plus_1?.predicted_score;
        const p4 = forecast?.predictions?.interaction_plus_4?.predicted_score;

        let riskLevel = 0;
        if (p1 != null && p4 != null) {
            const drop = p1 - p4; // positive = declining trend
            if (drop >= 15) {
                riskLevel = 2; // High Risk
            } else if (drop > 0) {
                riskLevel = 1; // Moderate Risk
            }
        }

        await User.findByIdAndUpdate(userId, { isRiskStudent: riskLevel });

        return { success: true, isRiskStudent: riskLevel };
    } catch (error) {
        console.error("Error updating risk status:", error.message);
        return { success: false, error: error.message };
    }
};


// ─── Standard CRUD ────────────────────────────────────────────────────────────

exports.createStudentPerformance = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "userId is required" });

        const existing = await StudentPerformance.findOne({ userId });
        if (existing) return res.status(200).json(existing); // already exists, return it

        const newRecord = new StudentPerformance({ userId });
        await newRecord.save();
        res.status(201).json({ message: "Student performance record created!", newRecord });
    } catch (error) {
        res.status(500).json({ message: "Error creating student performance record", error: error.message });
    }
};

exports.getStudentPerformances = async (req, res) => {
    try {
        const records = await StudentPerformance.find()
            .populate("userId", "username email firstName lastName");
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student performances", error: error.message });
    }
};

exports.getStudentPerformanceById = async (req, res) => {
    try {
        const record = await StudentPerformance.findById(req.params.id)
            .populate("userId", "username email firstName lastName");
        if (!record) return res.status(404).json({ message: "Student performance record not found" });
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student performance record", error: error.message });
    }
};

exports.getStudentPerformanceByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const record = await StudentPerformance.findOne({ userId })
            .populate("userId", "username email firstName lastName");
        if (!record) return res.status(200).json(null);
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student performance record", error: error.message });
    }
};

exports.deleteStudentPerformance = async (req, res) => {
    try {
        const deleted = await StudentPerformance.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Student performance record not found" });
        res.status(200).json({ message: "Student performance deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting student performance", error: error.message });
    }
};

// Keep these stubs for backward-compat with any existing routes
exports.updateStudentPerformance = async (req, res) => {
    res.status(200).json({ message: "Use POST /api/student-performance-history to record sessions." });
};

exports.updateStudentPerformanceByUserId = async (req, res) => {
    res.status(200).json({ message: "Use POST /api/student-performance-history to record sessions." });
};
