const mongoose = require("mongoose");

const normalizeDate = (value) => {
	if (!value) {
		return value;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const attendanceSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: [true, "Student is required"],
			index: true,
		},
		subject: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Subject",
			required: [true, "Subject is required"],
			index: true,
		},
		faculty: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Faculty",
			required: [true, "Faculty is required"],
			index: true,
		},
		section: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Section",
			required: [true, "Section is required"],
			index: true,
		},
		date: {
			type: Date,
			required: [true, "Attendance date is required"],
			set: normalizeDate,
			index: true,
		},
		status: {
			type: String,
			enum: {
				values: ["present", "absent"],
				message: "Attendance status must be present or absent",
			},
			required: [true, "Attendance status is required"],
		},
	},
	{ timestamps: true }
);

// One attendance result per student, subject, and UTC calendar date.
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ section: 1, date: 1 });
attendanceSchema.index({ faculty: 1, date: 1 });
attendanceSchema.index({ subject: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
