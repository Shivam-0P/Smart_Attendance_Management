const express = require("express");

const {
	getAssignments,
	getAssignmentById,
	createAssignment,
	updateAssignment,
	deleteAssignment,
} = require("../controller/assignmentController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.post("/", authorize("admin"), createAssignment);
router.put("/:id", authorize("admin"), updateAssignment);
router.delete("/:id", authorize("admin"), deleteAssignment);

module.exports = router;
