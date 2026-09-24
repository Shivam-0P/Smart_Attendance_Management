const mongoose = require("mongoose");

const Subject = require("../models/Subject_model");
const Department = require("../models/Department_model");

const subjectFields = "name code department semester";

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid subject data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateDepartment = async (departmentId) => {
	if (!isValidId(departmentId)) {
		return "Invalid department ID";
	}

	const department = await Department.exists({ _id: departmentId });
	return department ? null : "Referenced department must exist";
};

const normalizeSubject = (body) => ({
	name: typeof body.name === "string" ? body.name.trim() : body.name,
	code: typeof body.code === "string" ? body.code.trim().toUpperCase() : body.code,
	department: body.department,
	semester: body.semester,
});

const populateSubject = (query) => query
	.select(subjectFields)
	.populate("department", "name code");

const getSubjects = async (req, res) => {
	try {
		const subjects = await populateSubject(Subject.find().sort({ code: 1, name: 1 }));
		return res.status(200).json({ subjects });
	} catch (error) {
		console.error("Unable to fetch subjects:", error.message);
		return res.status(500).json({ message: "Unable to fetch subjects" });
	}
};

const getSubjectById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid subject ID" });
		}

		const subject = await populateSubject(Subject.findById(req.params.id));
		if (!subject) {
			return res.status(404).json({ message: "Subject not found" });
		}

		return res.status(200).json({ subject });
	} catch (error) {
		console.error("Unable to fetch subject:", error.message);
		return res.status(500).json({ message: "Unable to fetch subject" });
	}
};

const createSubject = async (req, res) => {
	try {
		const departmentError = await validateDepartment(req.body.department);
		if (departmentError) {
			return res.status(400).json({ message: departmentError });
		}

		const subject = await Subject.create(normalizeSubject(req.body));
		const populatedSubject = await populateSubject(Subject.findById(subject._id));
		return res.status(201).json({
			message: "Subject created successfully",
			subject: populatedSubject,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This subject code already exists for the department and semester" });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to create subject:", error.message);
		return res.status(500).json({ message: "Unable to create subject" });
	}
};

const updateSubject = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid subject ID" });
		}

		if (req.body.department) {
			const departmentError = await validateDepartment(req.body.department);
			if (departmentError) {
				return res.status(400).json({ message: departmentError });
			}
		}

		const subject = await populateSubject(Subject.findByIdAndUpdate(req.params.id, normalizeSubject(req.body), {
			new: true,
			runValidators: true,
		}));

		if (!subject) {
			return res.status(404).json({ message: "Subject not found" });
		}

		return res.status(200).json({
			message: "Subject updated successfully",
			subject,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This subject code already exists for the department and semester" });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to update subject:", error.message);
		return res.status(500).json({ message: "Unable to update subject" });
	}
};

const deleteSubject = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid subject ID" });
		}

		const subject = await Subject.findByIdAndDelete(req.params.id);
		if (!subject) {
			return res.status(404).json({ message: "Subject not found" });
		}

		return res.status(200).json({ message: "Subject deleted successfully" });
	} catch (error) {
		console.error("Unable to delete subject:", error.message);
		return res.status(500).json({ message: "Unable to delete subject" });
	}
};

module.exports = {
	createSubject,
	getSubjects,
	getSubjectById,
	updateSubject,
	deleteSubject,
};
