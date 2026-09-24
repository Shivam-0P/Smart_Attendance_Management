const express = require("express");

const {
	createFaculty,
	getFaculties,
	getFacultyById,
	updateFaculty,
	deleteFaculty,
} = require("../controller/facultyController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getFaculties);
router.get("/:id", getFacultyById);
router.post("/", authorize("admin"), createFaculty);
router.put("/:id", authorize("admin"), updateFaculty);
router.delete("/:id", authorize("admin"), deleteFaculty);

module.exports = router;
