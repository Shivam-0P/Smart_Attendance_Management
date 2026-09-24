const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User ID is required"],
			unique: true,
		},
		rollNumber: {
			type: String,
			required: [true, "Roll number is required"],
			unique: true,
			trim: true,
		},
		department: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department",
			required: [true, "Department is required"],
		},
		section: {
			type: String,
			required: [true, "Section is required"],
			trim: true,
		},
		semester: {
			type: Number,
			required: [true, "Semester is required"],
			min: [1, "Semester must be between 1 and 8"],
			max: [8, "Semester must be between 1 and 8"],
		},
		admissionYear: {
			type: Number,
			required: [true, "Admission year is required"],
			min: [1900, "Admission year is invalid"],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
