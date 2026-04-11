const StudentPerformanceHistory = require("../models/StudentPerformanceHistory");
const StudentPerformance = require("../models/StudentPerformance");
const mongoose = require("mongoose");
const {
    buildCurrentPerformancePayload,
    buildForecastPayload,
    clampWaitTime,
    clampResourceScore,
} = require("../utils/studentTracker");

/**
 * POST /api/student-performance-history
 *
 * Records ONE session (quiz submission OR lecture completion).
 * Each call creates exactly ONE new document — no more "today-only" merging.
 *
 * Body:
 *   userId          {string}  MongoDB user ID
 *   sessionScore    {number}  Score 0-100
 *   timeSpent       {number}  Minutes actively working (quiz: submit-start, lecture: watch time)
 *   waitTime        {number}  Minutes from resource-available to student-started (quiz only)
 *   resourceScore   {number}  Engagement ratio [0.055, 1.0]
 *   difficulty      {number}  1=Easy, 2=Medium, 3=Hard, 4=Very Hard, 5=Expert
 *   sessionType     {string}  "paper" | "lecture"
 *   quizAvailableAt {string?} ISO date string of when the quiz was published (optional, for audit)
 */
exports.createStudentPerformanceHistory = async (req, res) => {
    try {
        const {
            userId,
            sessionScore,
            timeSpent,
            waitTime,
            resourceScore,
            difficulty,
            sessionType,
            quizAvailableAt,
        } = req.body;

        if (!userId) return res.status(400).json({ message: "userId is required" });

        const score = Number(sessionScore || 0);
        const timeSpentMin = Math.max(0, Number(timeSpent || 0));
        const waitTimeMin = clampWaitTime(Number(waitTime || 0));
        const resourceScoreClamped = clampResourceScore(Number(resourceScore || 0.055));
        const diffNum = Number(difficulty || 1);

        // 1. Create the history record
        const newHistory = await StudentPerformanceHistory.create({
            userId,
            sessionScore:    score,
            score:           score,
            timeSpent:       timeSpentMin,
            waitTime:        waitTimeMin,
            resourceScore:   resourceScoreClamped,
            difficulty:      diffNum,
            sessionType:     sessionType || "paper",
            sessionAt:       new Date(),
            quizAvailableAt: quizAvailableAt ? new Date(quizAvailableAt) : null,
        });

        // 2. Update the aggregate (StudentPerformance) — running mean & lastSessionAt
        let aggregate = await StudentPerformance.findOne({ userId });
        if (!aggregate) {
            aggregate = new StudentPerformance({ userId });
        }

        const oldN    = aggregate.cumInteractions || 0;
        const oldMean = aggregate.cumScoreMean || 0;
        const newN    = oldN + 1;
        const newMean = (oldMean * oldN + score) / newN;

        aggregate.cumInteractions = newN;
        aggregate.cumScoreMean    = newMean;
        aggregate.totalStudyTime  = (aggregate.totalStudyTime || 0) + timeSpentMin;
        aggregate.resourceScore   = resourceScoreClamped; // keep the latest value
        aggregate.lastSessionAt   = new Date();

        await aggregate.save();

        res.status(201).json({
            message:   "Session recorded successfully!",
            session:   newHistory,
            aggregate,
        });
    } catch (error) {
        console.error("Error creating session history:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


/**
 * GET /api/student-performance-history/ml-payload/:userId
 *
 * Builds the { rows } payload for POST /current-performance.
 * Uses studentTracker.js to compute all 15 ML features.
 */
exports.getMLPayloadByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId))
            return res.status(400).json({ message: "Invalid userId" });

        // Fetch all sessions for this user, sorted chronologically
        const sessions = await StudentPerformanceHistory.find({ userId })
            .sort({ sessionAt: 1 })
            .lean();

        if (sessions.length === 0)
            return res.status(404).json({ message: "No sessions found for this user" });

        const payload = buildCurrentPerformancePayload(sessions);

        // --> LOGGING ADDED HERE FOR TESTING <--
        console.log("=========================================");
        console.log(`[ML] Generated Payload for Flask (/current-performance) | User: ${userId}`);
        console.log(JSON.stringify(payload, null, 2));
        console.log("=========================================");

        return res.json(payload);
    } catch (error) {
        return res.status(500).json({ message: "Error building ML payload", error: error.message });
    }
};


/**
 * Internal helper (called from studentPerformanceController.js directly).
 *
 * Returns the { rows } payload for /future-forecast, or null if not enough data.
 * Does NOT send an HTTP response — caller handles that.
 */
exports.buildForecastPayloadForUser = async (userId) => {
    const sessions = await StudentPerformanceHistory.find({ userId })
        .sort({ sessionAt: 1 })
        .lean();

    if (sessions.length < 10) return null;

    return buildForecastPayload(sessions, userId);
};


/**
 * GET /api/student-performance-history/forecast-payload/:userId
 *
 * HTTP-facing version of the above — useful for debugging.
 */
exports.getForecastPayloadByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId))
            return res.status(400).json({ message: "Invalid userId" });

        const payload = await exports.buildForecastPayloadForUser(userId);

        if (!payload)
            return res.status(400).json({
                message: "Not enough interaction history to generate a forecast (need at least 10 sessions)."
            });

        return res.json(payload);
    } catch (error) {
        return res.status(500).json({ message: "Error building forecast payload", error: error.message });
    }
};


// ─── Standard CRUD ──────────────────────────────────────────────────────────

exports.getStudentPerformanceHistories = async (req, res) => {
    try {
        const histories = await StudentPerformanceHistory.find()
            .populate("userId", "username email firstName lastName")
            .sort({ sessionAt: -1 });
        res.status(200).json(histories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching records", error: error.message });
    }
};

exports.getStudentPerformanceHistoryByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const histories = await StudentPerformanceHistory.find({ userId })
            .sort({ sessionAt: -1 });
        res.status(200).json(histories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user records", error: error.message });
    }
};

/**
 * PUT /api/student-performance-history/:id
 *
 * Allows incremental time sync for lecture sessions (addTimeSpent).
 */
exports.updateStudentPerformanceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { timeSpent, addTimeSpent, sessionScore, resourceScore, difficulty } = req.body;

        const history = await StudentPerformanceHistory.findById(id);
        if (!history) return res.status(404).json({ message: "History record not found" });

        const userId = history.userId;
        let aggregate = await StudentPerformance.findOne({ userId });
        if (!aggregate) aggregate = new StudentPerformance({ userId });

        // Incremental time add (lecture heartbeat)
        if (addTimeSpent !== undefined) {
            const delta = Math.max(0, Number(addTimeSpent));
            history.timeSpent += delta;
            aggregate.totalStudyTime = (aggregate.totalStudyTime || 0) + delta;
        } else if (timeSpent !== undefined) {
            const oldTime = history.timeSpent;
            const newTime = Math.max(0, Number(timeSpent));
            aggregate.totalStudyTime = (aggregate.totalStudyTime || 0) + (newTime - oldTime);
            history.timeSpent = newTime;
        }

        // Score update (recalculate running mean on aggregate)
        if (sessionScore !== undefined && sessionScore !== history.sessionScore) {
            const oldScore = history.sessionScore;
            const newScore = Number(sessionScore);
            const n = aggregate.cumInteractions || 1;
            aggregate.cumScoreMean = ((aggregate.cumScoreMean || 0) * n - oldScore + newScore) / n;
            history.sessionScore = newScore;
            history.score = newScore;
        }

        if (resourceScore !== undefined) {
            history.resourceScore = clampResourceScore(Number(resourceScore));
            aggregate.resourceScore = history.resourceScore;
        }
        if (difficulty !== undefined) history.difficulty = Number(difficulty);

        await history.save();
        await aggregate.save();

        res.status(200).json({
            message:   "Session history updated!",
            session:   history,
            aggregate,
        });
    } catch (error) {
        console.error("Error updating session history:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.deleteStudentPerformanceHistory = async (req, res) => {
    try {
        await StudentPerformanceHistory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Record deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting", error: error.message });
    }
};
