const express = require("express");

const {
	createSection,
	getSections,
	getSectionById,
	updateSection,
	deleteSection,
} = require("../controller/sectionController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getSections);
router.get("/:id", getSectionById);
router.post("/", authorize("admin"), createSection);
router.put("/:id", authorize("admin"), updateSection);
router.delete("/:id", authorize("admin"), deleteSection);

module.exports = router;
