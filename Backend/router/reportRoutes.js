const express = require("express");

const { getLowAttendanceReport } = require("../controller/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, authorize("admin"));
router.get("/low-attendance", getLowAttendanceReport);

module.exports = router;
