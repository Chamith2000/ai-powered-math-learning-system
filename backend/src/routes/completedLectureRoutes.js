const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/completedLectureController");
const auth = require("../middleware/authMiddleware");

// Create / upsert a completed lecture
router.post("/", auth, ctrl.markCompleted);

// List with optional filters (?userId=...&lectureType=...&lectureId=...)
router.get("/", auth, ctrl.list);

// Quick check if completed (?userId=...&lectureId=...&lectureType=...)
router.get("/is-completed", auth, ctrl.isCompleted);

// Stats breakdown per user
router.get("/stats/:userId", auth, ctrl.statsForUser);

// Get by record id
router.get("/:id", auth, ctrl.getById);

// Delete by record id
router.delete("/:id", auth, ctrl.remove);

module.exports = router;
