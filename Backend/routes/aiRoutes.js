const express = require("express");

const { attendanceQuery, attendanceInsights, generateReport } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/attendance-query", attendanceQuery);
router.post("/attendance-insights", attendanceInsights);
router.post("/generate-report", generateReport);

module.exports = router;
