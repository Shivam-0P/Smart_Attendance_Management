const mongoose = require("mongoose");

const Student = require("../models/Student_model");
const User = require("../models/User_model");
const Department = require("../models/Department_model");

const studentFields = "userId rollNumber department section semester admissionYear";

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid student data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateStudentUser = async (userId) => {
	if (!isValidId(userId)) {
		return "Invalid user ID";
	}

	const user = await User.findOne({ _id: userId, role: "student" }).select("_id");
	return user ? null : "Referenced user must exist and have the student role";
};

const getStudents = async (req, res) => {
	try {
		const students = await Student.find()
			.select(studentFields)
			.populate("userId", "name email")
			.populate("department", "name code")
			.sort({ createdAt: -1 });

		return res.status(200).json({ students });
	} catch (error) {
		console.error("Unable to fetch students:", error.message);
		return res.status(500).json({ message: "Unable to fetch students" });
	}
};

const getStudentById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid student ID" });
		}

		const student = await Student.findById(req.params.id)
			.select(studentFields)
			.populate("userId", "name email")
			.populate("department", "name code");

		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json({ student });
	} catch (error) {
		console.error("Unable to fetch student:", error.message);
		return res.status(500).json({ message: "Unable to fetch student" });
	}
};

const getCurrentStudent = async (req, res) => {
	try {
		const student = await Student.findOne({ userId: req.user.userId })
			.select(studentFields)
			.populate("userId", "name email")
			.populate("department", "name code");

		if (!student) {
			return res.status(404).json({
				message: "Student profile not found. Please contact the administrator to create your student record.",
			});
		}

		return res.status(200).json({ student });
	} catch (error) {
		console.error("Unable to fetch current student:", error.message);
		return res.status(500).json({ message: "Unable to fetch student profile" });
	}
};

const createStudent = async (req, res) => {
	try {
		const userError = await validateStudentUser(req.body.userId);
		if (userError) {
			return res.status(400).json({ message: userError });
		}

		if (!isValidId(req.body.department) || !(await Department.exists({ _id: req.body.department }))) {
			return res.status(400).json({ message: "Referenced department must exist" });
		}

		const student = await Student.create(req.body);
		const populatedStudent = await student.populate([
			{ path: "userId", select: "name email" },
			{ path: "department", select: "name code" },
		]);

		return res.status(201).json({
			message: "Student created successfully",
			student: populatedStudent,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({
				message: `${duplicateField || "Student"} is already registered`,
			});
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to create student:", error.message);
		return res.status(500).json({ message: "Unable to create student" });
	}
};

const updateStudent = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid student ID" });
		}

		if (req.body.userId) {
			const userError = await validateStudentUser(req.body.userId);
			if (userError) {
				return res.status(400).json({ message: userError });
			}
		}

		if (req.body.department && (!isValidId(req.body.department) || !(await Department.exists({ _id: req.body.department })))) {
			return res.status(400).json({ message: "Referenced department must exist" });
		}

		const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
			context: "query",
		})
			.select(studentFields)
			.populate("userId", "name email")
			.populate("department", "name code");

		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json({
			message: "Student updated successfully",
			student,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({
				message: `${duplicateField || "Student"} is already registered`,
			});
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to update student:", error.message);
		return res.status(500).json({ message: "Unable to update student" });
	}
};

const deleteStudent = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid student ID" });
		}

		const student = await Student.findByIdAndDelete(req.params.id);

		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json({ message: "Student deleted successfully" });
	} catch (error) {
		console.error("Unable to delete student:", error.message);
		return res.status(500).json({ message: "Unable to delete student" });
	}
};

module.exports = {
	createStudent,
	getStudents,
	getCurrentStudent,
	getStudentById,
	updateStudent,
	deleteStudent,
};
