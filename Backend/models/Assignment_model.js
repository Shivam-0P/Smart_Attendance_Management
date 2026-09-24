const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
	{
		faculty: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Faculty",
			required: [true, "Faculty is required"],
		},
		subject: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Subject",
			required: [true, "Subject is required"],
		},
		section: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Section",
			required: [true, "Section is required"],
		},
		academicYear: {
			type: String,
			required: [true, "Academic year is required"],
			trim: true,
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

assignmentSchema.index(
	{ faculty: 1, subject: 1, section: 1, academicYear: 1, semester: 1 },
	{ unique: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
