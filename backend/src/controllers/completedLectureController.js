const mongoose = require("mongoose");
const CompletedLecture = require("../models/CompletedLecture");

// helper: only pick allowed fields
const pickAllowed = (obj, allowed) =>
  Object.fromEntries(Object.entries(obj).filter(([k, v]) => allowed.includes(k) && v !== undefined));

exports.markCompleted = async (req, res) => {
  try {
    // body: { userId, lectureId, lectureType, completedAt? }
    const allowed = ["userId", "lectureId", "lectureType", "completedAt"];
    const payload = pickAllowed(req.body, allowed);

    if (!payload.userId || !payload.lectureId || !payload.lectureType) {
      return res.status(400).json({ message: "userId, lectureId and lectureType are required" });
    }
    if (!mongoose.isValidObjectId(payload.userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // upsert so repeated requests don't error out; they just update completedAt
    const doc = await CompletedLecture.findOneAndUpdate(
      { userId: payload.userId, lectureId: payload.lectureId, lectureType: payload.lectureType },
      { $set: { completedAt: payload.completedAt || new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).populate("userId", "username email firstName lastName");

    res.status(201).json(doc);
  } catch (error) {
    // handle duplicate key nicely (in case you switch from upsert to create)
    if (error.code === 11000) {
      return res.status(409).json({ message: "Already marked as completed" });
    }
    res.status(500).json({ message: "Error marking lecture completed", error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    // optional filters: userId, lectureType, lectureId
    const { userId, lectureType, lectureId } = req.query;
    const filter = {};
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
      filter.userId = userId;
    }
    if (lectureType) filter.lectureType = lectureType;
    if (lectureId) filter.lectureId = lectureId;

    const results = await CompletedLecture.find(filter)
      .populate("userId", "username email firstName lastName")
      .sort({ completedAt: -1 })
      .lean();

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching completed lectures", error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const item = await CompletedLecture.findById(id)
      .populate("userId", "username email firstName lastName")
      .lean();

    if (!item) return res.status(404).json({ message: "Not found" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const deleted = await CompletedLecture.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};

exports.isCompleted = async (req, res) => {
  try {
    // query: userId, lectureId, lectureType
    const { userId, lectureId, lectureType } = req.query;
    if (!userId || !lectureId || !lectureType)
      return res.status(400).json({ message: "userId, lectureId and lectureType are required" });

    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });

    const exists = await CompletedLecture.exists({ userId, lectureId, lectureType });
    res.status(200).json({ completed: !!exists });
  } catch (error) {
    res.status(500).json({ message: "Error checking completion", error: error.message });
  }
};

exports.statsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });

    const agg = await CompletedLecture.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$lectureType", count: { $sum: 1 } } },
      { $project: { lectureType: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ userId, breakdown: agg });
  } catch (error) {
    res.status(500).json({ message: "Error building stats", error: error.message });
  }
};
