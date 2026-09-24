const mongoose = require("mongoose");

const Assignment = require("../models/Assignment_model");
const Faculty = require("../models/Faculty_model");
const Subject = require("../models/Subject_model");
const Section = require("../models/Section_model");

const assignmentFields = "faculty subject section academicYear semester";

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid assignment data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateAssignment = (query) => query
	.select(assignmentFields)
	.populate({ path: "faculty", select: "userId employeeId department", populate: { path: "userId", select: "name email" } })
	.populate("subject", "name code department semester")
	.populate("section", "name department semester academicYear");

const validateAssignmentReferences = async (body) => {
	if (![body.faculty, body.subject, body.section].every(isValidId)) {
		return "Faculty, subject, and section IDs must be valid";
	}

	const [faculty, subject, section] = await Promise.all([
		Faculty.findById(body.faculty).select("department"),
		Subject.findById(body.subject).select("department semester"),
		Section.findById(body.section).select("department semester"),
	]);

	if (!faculty || !subject || !section) {
		return "Referenced faculty, subject, and section must exist";
	}

	const facultyDepartment = String(faculty.department);
	if (facultyDepartment !== String(subject.department) || facultyDepartment !== String(section.department)) {
		return "Faculty, subject, and section must belong to the same department";
	}

	if (Number(body.semester) !== subject.semester || Number(body.semester) !== section.semester) {
		return "Assignment semester must match the subject and section semester";
	}

	return null;
};

const getAssignments = async (req, res) => {
	try {
		let query = {};
		if (req.user.role === "faculty") {
			const faculty = await Faculty.findOne({ userId: req.user.userId }).select("_id");
			if (!faculty) {
				return res.status(200).json({ assignments: [] });
			}
			query.faculty = faculty._id;
		} else if (req.user.role !== "admin") {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		const assignments = await populateAssignment(Assignment.find(query).sort({ academicYear: -1, semester: 1 }));
		return res.status(200).json({ assignments });
	} catch (error) {
		console.error("Unable to fetch assignments:", error.message);
		return res.status(500).json({ message: "Unable to fetch assignments" });
	}
};

const getAssignmentById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assignment ID" });
		}

		const assignment = await populateAssignment(Assignment.findById(req.params.id));
		if (!assignment) {
			return res.status(404).json({ message: "Assignment not found" });
		}

		if (req.user.role === "faculty" && String(assignment.faculty?.userId?._id) !== String(req.user.userId)) {
			return res.status(403).json({ message: "Insufficient permissions" });
		}
		if (req.user.role !== "admin" && req.user.role !== "faculty") {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		return res.status(200).json({ assignment });
	} catch (error) {
		console.error("Unable to fetch assignment:", error.message);
		return res.status(500).json({ message: "Unable to fetch assignment" });
	}
};

const createAssignment = async (req, res) => {
	try {
		const referenceError = await validateAssignmentReferences(req.body);
		if (referenceError) {
			return res.status(400).json({ message: referenceError });
		}

		const assignment = await Assignment.create(req.body);
		const populatedAssignment = await populateAssignment(Assignment.findById(assignment._id));
		return res.status(201).json({ message: "Assignment created successfully", assignment: populatedAssignment });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This faculty assignment already exists" });
		}
		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}
		console.error("Unable to create assignment:", error.message);
		return res.status(500).json({ message: "Unable to create assignment" });
	}
};

const updateAssignment = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assignment ID" });
		}

		const currentAssignment = await Assignment.findById(req.params.id).select("faculty subject section academicYear semester");
		if (!currentAssignment) {
			return res.status(404).json({ message: "Assignment not found" });
		}

		const nextAssignment = { ...currentAssignment.toObject(), ...req.body };
		const referenceError = await validateAssignmentReferences(nextAssignment);
		if (referenceError) {
			return res.status(400).json({ message: referenceError });
		}

		const assignment = await populateAssignment(Assignment.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}));
		return res.status(200).json({ message: "Assignment updated successfully", assignment });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "This faculty assignment already exists" });
		}
		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}
		console.error("Unable to update assignment:", error.message);
		return res.status(500).json({ message: "Unable to update assignment" });
	}
};

const deleteAssignment = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assignment ID" });
		}
		const assignment = await Assignment.findByIdAndDelete(req.params.id);
		if (!assignment) {
			return res.status(404).json({ message: "Assignment not found" });
		}
		return res.status(200).json({ message: "Assignment removed successfully" });
	} catch (error) {
		console.error("Unable to remove assignment:", error.message);
		return res.status(500).json({ message: "Unable to remove assignment" });
	}
};

module.exports = {
	getAssignments,
	getAssignmentById,
	createAssignment,
	updateAssignment,
	deleteAssignment,
};
