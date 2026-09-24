const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User ID is required"],
			unique: true,
		},
		employeeId: {
			type: String,
			required: [true, "Employee ID is required"],
			unique: true,
			trim: true,
		},
		department: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department",
			required: [true, "Department is required"],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
