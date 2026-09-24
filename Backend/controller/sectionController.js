const mongoose = require("mongoose");

const Section = require("../models/Section_model");
const Department = require("../models/Department_model");

const sectionFields = "name department semester academicYear";

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid section data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateDepartment = async (departmentId) => {
	if (!isValidId(departmentId)) {
		return "Invalid department ID";
	}

	const department = await Department.exists({ _id: departmentId });
	return department ? null : "Referenced department must exist";
};

const populateSection = (query) => query
	.select(sectionFields)
	.populate("department", "name code");

const getSections = async (req, res) => {
	try {
		const sections = await populateSection(Section.find().sort({ academicYear: -1, name: 1 }));
		return res.status(200).json({ sections });
	} catch (error) {
		console.error("Unable to fetch sections:", error.message);
		return res.status(500).json({ message: "Unable to fetch sections" });
	}
};

const getSectionById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid section ID" });
		}

		const section = await populateSection(Section.findById(req.params.id));
		if (!section) {
			return res.status(404).json({ message: "Section not found" });
		}

		return res.status(200).json({ section });
	} catch (error) {
		console.error("Unable to fetch section:", error.message);
		return res.status(500).json({ message: "Unable to fetch section" });
	}
};

const createSection = async (req, res) => {
	try {
		const departmentError = await validateDepartment(req.body.department);
		if (departmentError) {
			return res.status(400).json({ message: departmentError });
		}

		const section = await Section.create(req.body);
		const populatedSection = await populateSection(Section.findById(section._id));
		return res.status(201).json({
			message: "Section created successfully",
			section: populatedSection,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This section already exists for the department and academic year" });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to create section:", error.message);
		return res.status(500).json({ message: "Unable to create section" });
	}
};

const updateSection = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid section ID" });
		}

		if (req.body.department) {
			const departmentError = await validateDepartment(req.body.department);
			if (departmentError) {
				return res.status(400).json({ message: departmentError });
			}
		}

		const section = await populateSection(Section.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}));

		if (!section) {
			return res.status(404).json({ message: "Section not found" });
		}

		return res.status(200).json({
			message: "Section updated successfully",
			section,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This section already exists for the department and academic year" });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to update section:", error.message);
		return res.status(500).json({ message: "Unable to update section" });
	}
};

const deleteSection = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid section ID" });
		}

		const section = await Section.findByIdAndDelete(req.params.id);
		if (!section) {
			return res.status(404).json({ message: "Section not found" });
		}

		return res.status(200).json({ message: "Section deleted successfully" });
	} catch (error) {
		console.error("Unable to delete section:", error.message);
		return res.status(500).json({ message: "Unable to delete section" });
	}
};

module.exports = {
	createSection,
	getSections,
	getSectionById,
	updateSection,
	deleteSection,
};
