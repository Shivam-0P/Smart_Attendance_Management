const express = require("express");

const {
	createSubject,
	getSubjects,
	getSubjectById,
	updateSubject,
	deleteSubject,
} = require("../controller/subjectController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.post("/", authorize("admin"), createSubject);
router.put("/:id", authorize("admin"), updateSubject);
router.delete("/:id", authorize("admin"), deleteSubject);

module.exports = router;
