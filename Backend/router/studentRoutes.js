const express = require("express");

const {
	createStudent,
	getStudents,
	getCurrentStudent,
	getStudentById,
	updateStudent,
	deleteStudent,
} = require("../controller/studentController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getStudents);
router.get("/me", getCurrentStudent);
router.get("/:id", getStudentById);
router.post("/", authorize("admin"), createStudent);
router.put("/:id", authorize("admin"), updateStudent);
router.delete("/:id", authorize("admin"), deleteStudent);

module.exports = router;
