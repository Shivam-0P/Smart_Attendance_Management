const mongoose = require("mongoose");

const attendanceAuditSchema = new mongoose.Schema(
	{
		attendanceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Attendance",
			required: [true, "Attendance ID is required"],
			index: true,
		},
		changedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Changed by user is required"],
			index: true,
		},
		oldStatus: {
			type: String,
			enum: ["present", "absent"],
			required: true,
		},
		newStatus: {
			type: String,
			enum: ["present", "absent"],
			required: true,
		},
		reason: {
			type: String,
			required: [true, "Correction reason is required"],
			trim: true,
			minlength: [3, "Correction reason must be at least 3 characters"],
		},
		changedAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
	},
	{ timestamps: false }
);

attendanceAuditSchema.index({ attendanceId: 1, changedAt: -1 });

module.exports = mongoose.model("AttendanceAudit", attendanceAuditSchema);
