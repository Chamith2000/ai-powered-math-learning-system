const PaperLog = require("../models/PaperLog");

/**
 * Save a new paper log event
 */
exports.createLog = async (req, res) => {
    try {
        const {
            studentId,
            paperId,
            paperTitle,
            paperType,
            marks,
            totalMarks,
            timeSpent,
            cheatIncidents,
            dominantEmotion,
        } = req.body;

        if (!studentId || !paperId || !paperTitle || !paperType) {
            return res.status(400).json({ message: "Missing required core paper log fields." });
        }

        // if (cheatIncidents && Array.isArray(cheatIncidents)) {
        //     const hasPersonDetection = cheatIncidents.some(
        //         (incident) => incident.detectionType === "person"
        //     );
        //     if (hasPersonDetection) {
        //         return res.status(200).json({
        //             message: "Log not saved: person detected as suspicious activity.",
        //             skipped: true
        //         });
        //     }
        // }

        const newLog = await PaperLog.create({
            studentId,
            paperId,
            paperTitle,
            paperType,
            marks: marks || 0,
            totalMarks: totalMarks || 0,
            timeSpent: timeSpent || 0,
            cheatIncidents: cheatIncidents || [],
            dominantEmotion: dominantEmotion,
        });

        return res.status(201).json(newLog);
    } catch (error) {
        console.error("Error creating PaperLog:", error);
        res.status(500).json({ message: "Server error creating paper log", error: error.message });
    }
};

/**
 * Get all logs (for admin panel)
 */
exports.getAllLogs = async (req, res) => {
    try {
        const logs = await PaperLog.find()
            .populate("studentId", "username email firstName lastName")
            .sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching PaperLogs:", error);
        res.status(500).json({ message: "Server error fetching logs", error: error.message });
    }
};

/**
 * Get specific log by ID
 */
exports.getLogById = async (req, res) => {
    try {
        const log = await PaperLog.findById(req.params.id).populate("studentId", "username email firstName lastName");
        if (!log) return res.status(404).json({ message: "Paper log not found." });

        res.status(200).json(log);
    } catch (error) {
        console.error("Error fetching PaperLog:", error);
        res.status(500).json({ message: "Server error fetching log", error: error.message });
    }
};

/**
 * Delete a log
 */
exports.deleteLog = async (req, res) => {
    try {
        const log = await PaperLog.findByIdAndDelete(req.params.id);
        if (!log) return res.status(404).json({ message: "Paper log not found." });

        res.status(200).json({ message: "Paper log deleted successfully." });
    } catch (error) {
        console.error("Error deleting PaperLog:", error);
        res.status(500).json({ message: "Server error deleting log", error: error.message });
    }
};
