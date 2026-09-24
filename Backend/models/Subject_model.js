const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Subject name is required"],
			trim: true,
		},
		code: {
			type: String,
			required: [true, "Subject code is required"],
			trim: true,
			uppercase: true,
		},
		department: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department",
			required: [true, "Department is required"],
		},
		semester: {
			type: Number,
			required: [true, "Semester is required"],
			min: [1, "Semester must be between 1 and 8"],
			max: [8, "Semester must be between 1 and 8"],
		},
	},
	{ timestamps: true }
);

subjectSchema.index({ code: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
