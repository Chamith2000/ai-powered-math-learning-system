const express = require("express");
const router = express.Router();
const paperLogController = require("../controllers/paperLogController");

router.post("/", paperLogController.createLog);
router.get("/", paperLogController.getAllLogs);
router.get("/:id", paperLogController.getLogById);
router.delete("/:id", paperLogController.deleteLog);

module.exports = router;
