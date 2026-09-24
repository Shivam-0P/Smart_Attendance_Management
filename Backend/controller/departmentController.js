const mongoose = require("mongoose");

const Department = require("../models/Department_model");
const Student = require("../models/Student_model");

const formatValidationError = (error) => {
	if (error.name === "ValidationError") {
		return Object.values(error.errors).map((item) => item.message).join(", ");
	}

	return "Invalid department data";
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeDepartment = (body) => ({
	name: typeof body.name === "string" ? body.name.trim() : body.name,
	code: typeof body.code === "string" ? body.code.trim().toUpperCase() : body.code,
});

const getDepartments = async (req, res) => {
	try {
		const departments = await Department.find().sort({ name: 1 });
		return res.status(200).json({ departments });
	} catch (error) {
		console.error("Unable to fetch departments:", error.message);
		return res.status(500).json({ message: "Unable to fetch departments" });
	}
};

const getDepartmentById = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid department ID" });
		}

		const department = await Department.findById(req.params.id);
		if (!department) {
			return res.status(404).json({ message: "Department not found" });
		}

		return res.status(200).json({ department });
	} catch (error) {
		console.error("Unable to fetch department:", error.message);
		return res.status(500).json({ message: "Unable to fetch department" });
	}
};

const createDepartment = async (req, res) => {
	try {
		const department = await Department.create(normalizeDepartment(req.body));
		return res.status(201).json({
			message: "Department created successfully",
			department,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({ message: `${duplicateField || "Department"} is already registered` });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to create department:", error.message);
		return res.status(500).json({ message: "Unable to create department" });
	}
};

const updateDepartment = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid department ID" });
		}

		const department = await Department.findByIdAndUpdate(
			req.params.id,
		normalizeDepartment(req.body),
			{ new: true, runValidators: true }
		);

		if (!department) {
			return res.status(404).json({ message: "Department not found" });
		}

		return res.status(200).json({
			message: "Department updated successfully",
			department,
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyPattern || {})[0];
			return res.status(409).json({ message: `${duplicateField || "Department"} is already registered` });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: formatValidationError(error) });
		}

		console.error("Unable to update department:", error.message);
		return res.status(500).json({ message: "Unable to update department" });
	}
};

const deleteDepartment = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({ message: "Invalid department ID" });
		}

		const department = await Department.findById(req.params.id).select("_id");
		if (!department) {
			return res.status(404).json({ message: "Department not found" });
		}

		const assignedStudent = await Student.exists({ department: req.params.id });
		if (assignedStudent) {
			return res.status(409).json({
				message: "Department cannot be deleted while students are assigned to it",
			});
		}

		await Department.findByIdAndDelete(req.params.id);
		return res.status(200).json({ message: "Department deleted successfully" });
	} catch (error) {
		console.error("Unable to delete department:", error.message);
		return res.status(500).json({ message: "Unable to delete department" });
	}
};

module.exports = {
	createDepartment,
	getDepartments,
	getDepartmentById,
	updateDepartment,
	deleteDepartment,
};
