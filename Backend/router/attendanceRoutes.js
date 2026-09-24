const express = require("express");

const {
	getStudentsForAttendance,
	createAttendance,
	getStudentAttendance,
	getStudentAttendanceSummary,
	getSubjectAttendanceSummary,
	getAttendanceHistory,
	updateAttendance,
	getAttendanceAuditHistory,
} = require("../controller/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/students", authorize("faculty"), getStudentsForAttendance);
router.get("/history", getAttendanceHistory);
router.get("/audit", getAttendanceAuditHistory);
router.get("/student/:studentId/summary", getStudentAttendanceSummary);
router.get("/student/:studentId", getStudentAttendance);
router.get("/subject/:subjectId/summary", getSubjectAttendanceSummary);
router.post("/", authorize("faculty"), createAttendance);
router.put("/:id", authorize("faculty"), updateAttendance);

module.exports = router;
