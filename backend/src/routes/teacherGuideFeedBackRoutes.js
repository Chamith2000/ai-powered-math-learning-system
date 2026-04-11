const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/teacherGuideFeedBackController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, ctrl.create);
router.get("/", auth, ctrl.getAll);
router.get("/:id", auth, ctrl.getById);
router.delete("/:id", auth, ctrl.remove);
router.get("/guideId/:teacherGuideId", auth, ctrl.getByTeacherGuideId);
router.get("/lectureId/:lectureId", auth, ctrl.getByLectureId);
router.get("/analytics/distribution", auth, ctrl.getDistributionStats);
router.put("/:id", auth, ctrl.update);


module.exports = router;
