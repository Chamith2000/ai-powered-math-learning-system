const TeacherGuideFeedBack = require("../models/TeacherGuideFeedBack");
const mongoose = require("mongoose");

const toNonNegNumber = (v, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n < 0 ? 0 : n;
};

exports.create = async (req, res) => {
  try {
    const doc = await TeacherGuideFeedBack.create({
      teacherGuideId: req.body.teacherGuideId,
      studentId: req.user?.userId || req.body.studentId,
      studentFeedback: req.body.studentFeedback,
      contentTitle: req.body.contentTitle,
      marks: toNonNegNumber(req.body?.marks, 0),
      studytime: toNonNegNumber(req.body?.studytime, 0),
      lectureId: req.body.lectureId || null,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const doc = await TeacherGuideFeedBack.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.getAll = async (_req, res) => {
  try {
    const docs = await TeacherGuideFeedBack.find()
      .populate("teacherGuideId", "coureInfo studytime")
      .populate("studentId", "username email age grade")
      .populate("lectureId", "lectureTytle description grade");
    res.json(docs);
  } catch (e) { res.status(500).json({ message: "Fetch failed", error: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const doc = await TeacherGuideFeedBack.findById(req.params.id)
      .populate("teacherGuideId", "coureInfo studytime")
      .populate("studentId", "username email age grade")
      .populate("lectureId", "lectureTytle description grade");
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) { res.status(500).json({ message: "Fetch failed", error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const doc = await TeacherGuideFeedBack.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: "Delete failed", error: e.message }); }
};


exports.getByTeacherGuideId = async (req, res) => {
  const { teacherGuideId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teacherGuideId)) {
    return res.status(400).json({ message: "Invalid teacherGuideId" });
  }

  try {
    const docs = await TeacherGuideFeedBack.find({ teacherGuideId })
      .populate("teacherGuideId")
      .populate("studentId", "username email age grade")
      .populate("lectureId", "lectureTytle description grade")
      .sort({ createdAt: -1 });

    // Return an array (possibly empty) for consistency with getAll
    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: "Fetch failed", error: e.message });
  }
};

exports.getDistributionStats = async (req, res) => {
  try {
    const stats = await TeacherGuideFeedBack.aggregate([
      {
        $group: {
          _id: "$teacherGuideId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "teacherguides",
          localField: "_id",
          foreignField: "_id",
          as: "guideInfo"
        }
      },
      {
        $unwind: "$guideInfo"
      },
      {
        $project: {
          _id: 1,
          count: 1,
          title: "$guideInfo.coureInfo"
        }
      }
    ]);

    res.json(stats);
  } catch (e) {
    res.status(500).json({ message: "Aggregation failed", error: e.message });
  }
};

exports.getByLectureId = async (req, res) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({ message: "Invalid lectureId" });
  }

  try {
    const docs = await TeacherGuideFeedBack.find({ lectureId })
      .populate("teacherGuideId")
      .populate("studentId", "username email age grade")
      .populate("lectureId", "lectureTytle description grade")
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: "Fetch failed", error: e.message });
  }
};

