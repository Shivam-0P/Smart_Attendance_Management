const mongoose = require("mongoose");

const Faculty = require("../models/Faculty_model");
const User = require("../models/User_model");
const Department = require("../models/Department_model");

const facultyFields = "userId employeeId department";

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid faculty data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateFacultyUser = async (userId) => {
	if (!isValidId(userId)) {
		return "Invalid user ID";
	}

	const user = await User.findOne({ _id: userId, role: "faculty" }).select("_id");
	return user ? null : "Referenced user must exist and have the faculty role";
};

const validateDepartment = async (departmentId) => {
	if (!isValidId(departmentId)) {
		return "Invalid department ID";
	}

	const department = await Department.exists({ _id: departmentId });
	return department ? null : "Referenced department must exist";
};

const normalizeFaculty = (body) => ({
	userId: body.userId,
	employeeId: typeof body.employeeId === "string" ? body.employeeId.trim() : body.employeeId,
	department: body.department,
});

const populateFaculty = (query) => query
	.select(facultyFields)
	.populate("userId", "name email")
	.populate("department", "name code");

const getFaculties = async (req, res) => {
	try {
		const faculties = await populateFaculty(Faculty.find().sort({ employeeId: 1 }));
		return res.status(200).json({ faculties });
	} catch (error) {
		console.error("Unable to fetch faculty:", error.message);
		return res.status(500).json({ message: "Unable to fetch faculty" });
	}
};

const getFacultyById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid faculty ID" });
		}

		const faculty = await populateFaculty(Faculty.findById(req.params.id));
		if (!faculty) {
			return res.status(404).json({ message: "Faculty not found" });
		}

		return res.status(200).json({ faculty });
	} catch (error) {
		console.error("Unable to fetch faculty member:", error.message);
		return res.status(500).json({ message: "Unable to fetch faculty member" });
	}
};

const createFaculty = async (req, res) => {
	try {
		const userError = await validateFacultyUser(req.body.userId);
		if (userError) {
			return res.status(400).json({ message: userError });
		}

		const departmentError = await validateDepartment(req.body.department);
		if (departmentError) {
			return res.status(400).json({ message: departmentError });
		}

		const faculty = await Faculty.create(normalizeFaculty(req.body));
		const populatedFaculty = await populateFaculty(Faculty.findById(faculty._id));
		return res.status(201).json({
			message: "Faculty created successfully",
			faculty: populatedFaculty,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({ message: `${duplicateField || "Faculty"} is already registered` });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to create faculty:", error.message);
		return res.status(500).json({ message: "Unable to create faculty" });
	}
};

const updateFaculty = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid faculty ID" });
		}

		if (req.body.userId) {
			const userError = await validateFacultyUser(req.body.userId);
			if (userError) {
				return res.status(400).json({ message: userError });
			}
		}

		if (req.body.department) {
			const departmentError = await validateDepartment(req.body.department);
			if (departmentError) {
				return res.status(400).json({ message: departmentError });
			}
		}

		const faculty = await populateFaculty(Faculty.findByIdAndUpdate(req.params.id, normalizeFaculty(req.body), {
			new: true,
			runValidators: true,
		}));

		if (!faculty) {
			return res.status(404).json({ message: "Faculty not found" });
		}

		return res.status(200).json({
			message: "Faculty updated successfully",
			faculty,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({ message: `${duplicateField || "Faculty"} is already registered` });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to update faculty:", error.message);
		return res.status(500).json({ message: "Unable to update faculty" });
	}
};

const deleteFaculty = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid faculty ID" });
		}

		const faculty = await Faculty.findByIdAndDelete(req.params.id);
		if (!faculty) {
			return res.status(404).json({ message: "Faculty not found" });
		}

		return res.status(200).json({ message: "Faculty deleted successfully" });
	} catch (error) {
		console.error("Unable to delete faculty:", error.message);
		return res.status(500).json({ message: "Unable to delete faculty" });
	}
};

module.exports = {
	createFaculty,
	getFaculties,
	getFacultyById,
	updateFaculty,
	deleteFaculty,
};
