const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Section name is required"],
			trim: true,
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
		academicYear: {
			type: String,
			required: [true, "Academic year is required"],
			trim: true,
		},
	},
	{ timestamps: true }
);

sectionSchema.index(
	{ name: 1, department: 1, semester: 1, academicYear: 1 },
	{ unique: true }
);

module.exports = mongoose.model("Section", sectionSchema);
