const mongoose = require("mongoose");

const Attendance = require("../models/Attendance_model");
const Assignment = require("../models/Assignment_model");
const Faculty = require("../models/Faculty_model");
const Student = require("../models/Student_model");
const Subject = require("../models/Subject_model");
const Section = require("../models/Section_model");
const AttendanceAudit = require("../models/AttendanceAudit_model");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeDate = (value) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const getFacultyForUser = async (userId) => Faculty.findOne({ userId }).select("_id");

const getAssignedClass = async (facultyId, subjectId, sectionId) => Assignment.findOne({
	faculty: facultyId,
	subject: subjectId,
	section: sectionId,
}).select("_id");

const buildAttendanceSummary = (records) => {
	const totalClasses = records.length;
	const present = records.filter((record) => record.status === "present").length;
	const absent = records.filter((record) => record.status === "absent").length;
	const percentage = totalClasses === 0 ? "0.00" : ((present / totalClasses) * 100).toFixed(2);

	return { totalClasses, present, absent, percentage };
};

const getAttendanceSummary = async (filter) => {
	const counts = await Attendance.aggregate([
		{ $match: filter },
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);
	const present = counts.find((item) => item._id === "present")?.count || 0;
	const absent = counts.find((item) => item._id === "absent")?.count || 0;
	const totalClasses = present + absent;
	const percentage = totalClasses === 0 ? "0.00" : ((present / totalClasses) * 100).toFixed(2);

	return { totalClasses, present, absent, percentage };
};

const getStudentForRequest = async (req, res) => {
	if (!isValidId(req.params.studentId)) {
		res.status(400).json({ message: "Invalid student ID" });
		return null;
	}

	const student = await Student.findById(req.params.studentId).select("_id userId rollNumber");
	if (!student) {
		res.status(404).json({ message: "Student not found" });
		return null;
	}

	if (req.user.role === "student" && String(student.userId) !== String(req.user.userId)) {
		res.status(403).json({ message: "Insufficient permissions" });
		return null;
	}

	return student;
};

const getStudentAttendance = async (req, res) => {
	try {
		const student = await getStudentForRequest(req, res);
		if (!student) return;

		const records = await Attendance.find({ student: student._id })
			.select("subject faculty section date status")
			.populate("subject", "name code")
			.populate("faculty", "employeeId")
			.populate("section", "name academicYear")
			.sort({ date: -1 });

		return res.status(200).json({
			student,
			attendance: records,
			summary: buildAttendanceSummary(records),
		});
	} catch (error) {
		console.error("Unable to calculate student attendance:", error.message);
		return res.status(500).json({ message: "Unable to calculate student attendance" });
	}
};

const getStudentAttendanceSummary = async (req, res) => {
	try {
		const student = await getStudentForRequest(req, res);
		if (!student) return;

		const summary = await getAttendanceSummary({ student: student._id });
		return res.status(200).json({
			student: { id: student._id, rollNumber: student.rollNumber },
			summary,
		});
	} catch (error) {
		console.error("Unable to calculate student attendance summary:", error.message);
		return res.status(500).json({ message: "Unable to calculate student attendance summary" });
	}
};

const getSubjectAttendanceSummary = async (req, res) => {
	try {
		if (!isValidId(req.params.subjectId)) {
			return res.status(400).json({ message: "Invalid subject ID" });
		}

		const subject = await Subject.findById(req.params.subjectId).select("_id name code");
		if (!subject) {
			return res.status(404).json({ message: "Subject not found" });
		}

		const summary = await getAttendanceSummary({ subject: subject._id });
		return res.status(200).json({ subject, summary });
	} catch (error) {
		console.error("Unable to calculate subject attendance summary:", error.message);
		return res.status(500).json({ message: "Unable to calculate subject attendance summary" });
	}
};

const getAttendanceHistory = async (req, res) => {
	try {
		const { subject, section, date, student } = req.query;
		const filter = {};

		if (subject) {
			if (!isValidId(subject)) return res.status(400).json({ message: "Invalid subject filter" });
			filter.subject = subject;
		}
		if (section) {
			if (!isValidId(section)) return res.status(400).json({ message: "Invalid section filter" });
			filter.section = section;
		}
		if (student) {
			if (!isValidId(student)) return res.status(400).json({ message: "Invalid student filter" });
			filter.student = student;
		}
		if (date) {
			const normalizedDate = normalizeDate(date);
			if (!normalizedDate) return res.status(400).json({ message: "Invalid date filter" });
			filter.date = normalizedDate;
		}

		if (req.user.role === "admin") {
			// Admins may review all records, subject to the supplied filters.
		} else if (req.user.role === "faculty") {
			const faculty = await getFacultyForUser(req.user.userId);
			if (!faculty) return res.status(403).json({ message: "Faculty profile not found" });
			filter.faculty = faculty._id;

			const assignments = await Assignment.find({ faculty: faculty._id }).select("subject section");
			const assignedSubjects = new Set(assignments.map((item) => String(item.subject)));
			const assignedSections = new Set(assignments.map((item) => String(item.section)));
			if (subject && !assignedSubjects.has(String(subject))) return res.status(403).json({ message: "You are not assigned to this subject" });
			if (section && !assignedSections.has(String(section))) return res.status(403).json({ message: "You are not assigned to this section" });
		} else if (req.user.role === "student") {
			const currentStudent = await Student.findOne({ userId: req.user.userId }).select("_id");
			if (!currentStudent) return res.status(404).json({ message: "Student profile not found" });
			if (student && String(student) !== String(currentStudent._id)) return res.status(403).json({ message: "You can only view your own attendance" });
			filter.student = currentStudent._id;
		} else {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		const records = await Attendance.find(filter)
			.select("student subject faculty section date status")
			.populate("student", "rollNumber userId")
			.populate("subject", "name code")
			.populate({ path: "faculty", select: "employeeId userId", populate: { path: "userId", select: "name" } })
			.populate("section", "name academicYear")
			.sort({ date: -1, createdAt: -1 });

		return res.status(200).json({ records });
	} catch (error) {
		console.error("Unable to fetch attendance history:", error.message);
		return res.status(500).json({ message: "Unable to fetch attendance history" });
	}
};

const updateAttendance = async (req, res) => {
	try {
		if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid attendance ID" });
		const { status, reason } = req.body;
		if (!["present", "absent"].includes(status)) return res.status(400).json({ message: "Status must be present or absent" });
		if (typeof reason !== "string" || reason.trim().length < 3) return res.status(400).json({ message: "A correction reason of at least 3 characters is required" });

		const attendance = await Attendance.findById(req.params.id).select("student subject section faculty date status");
		if (!attendance) return res.status(404).json({ message: "Attendance record not found" });
		if (attendance.status === status) return res.status(400).json({ message: "New status must be different from the current status" });

		const faculty = await getFacultyForUser(req.user.userId);
		if (!faculty) return res.status(403).json({ message: "Faculty profile not found" });
		const assignment = await getAssignedClass(faculty._id, attendance.subject, attendance.section);
		if (!assignment) return res.status(403).json({ message: "You are not assigned to this subject and section" });

		const oldStatus = attendance.status;
		attendance.status = status;
		await attendance.save();
		try {
			await AttendanceAudit.create({
				attendanceId: attendance._id,
				changedBy: req.user.userId,
				oldStatus,
				newStatus: status,
				reason: reason.trim(),
			});
		} catch (auditError) {
			attendance.status = oldStatus;
			await attendance.save();
			throw auditError;
		}

		const updatedAttendance = await Attendance.findById(attendance._id)
			.populate("student", "rollNumber userId")
			.populate("subject", "name code")
			.populate("section", "name academicYear")
			.populate("faculty", "employeeId");
		return res.status(200).json({ message: "Attendance corrected successfully", attendance: updatedAttendance });
	} catch (error) {
		if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: "Attendance correction contains invalid data" });
		console.error("Unable to correct attendance:", error.message);
		return res.status(500).json({ message: "Unable to correct attendance" });
	}
};

const getAttendanceAuditHistory = async (req, res) => {
	try {
		let filter = {};
		if (req.user.role === "faculty") {
			const faculty = await getFacultyForUser(req.user.userId);
			if (!faculty) return res.status(403).json({ message: "Faculty profile not found" });
			const assignments = await Assignment.find({ faculty: faculty._id }).select("subject section");
			filter.attendanceId = { $in: await Attendance.find({ faculty: faculty._id, $or: assignments.map((item) => ({ subject: item.subject, section: item.section })) }).distinct("_id") };
		} else if (req.user.role !== "admin") {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		const audits = await AttendanceAudit.find(filter)
			.populate({ path: "attendanceId", select: "student subject section date" , populate: [{ path: "student", select: "rollNumber userId", populate: { path: "userId", select: "name" } }, { path: "subject", select: "name code" }, { path: "section", select: "name" }] })
			.populate("changedBy", "name email")
			.sort({ changedAt: -1 });
		return res.status(200).json({ audits });
	} catch (error) {
		console.error("Unable to fetch attendance audit history:", error.message);
		return res.status(500).json({ message: "Unable to fetch attendance audit history" });
	}
};

const getClassContext = async (req, res) => {
	const { subject: subjectId, section: sectionId } = req.query;
	if (!isValidId(subjectId) || !isValidId(sectionId)) {
		res.status(400).json({ message: "Valid subject and section IDs are required" });
		return null;
	}

	const faculty = await getFacultyForUser(req.user.userId);
	if (!faculty) {
		res.status(403).json({ message: "Faculty profile not found" });
		return null;
	}

	const assignment = await getAssignedClass(faculty._id, subjectId, sectionId);
	if (!assignment) {
		res.status(403).json({ message: "You are not assigned to this subject and section" });
		return null;
	}

	const [subject, section] = await Promise.all([
		Subject.findById(subjectId).select("_id department semester"),
		Section.findById(sectionId).select("_id department name semester"),
	]);
	if (!subject || !section) {
		res.status(404).json({ message: "Subject or section not found" });
		return null;
	}

	return { faculty, subject, section };
};

const getStudentsForAttendance = async (req, res) => {
	try {
		const context = await getClassContext(req, res);
		if (!context) return;

		const students = await Student.find({
			department: context.section.department,
			section: context.section.name,
		})
			.select("_id rollNumber userId department section")
			.populate("userId", "name email")
			.sort({ rollNumber: 1 });

		return res.status(200).json({ students });
	} catch (error) {
		console.error("Unable to fetch attendance students:", error.message);
		return res.status(500).json({ message: "Unable to fetch attendance students" });
	}
};

const createAttendance = async (req, res) => {
	try {
		const { subject: subjectId, section: sectionId, date, attendance } = req.body;
		if (!isValidId(subjectId) || !isValidId(sectionId) || !date || !Array.isArray(attendance) || attendance.length === 0) {
			return res.status(400).json({ message: "Subject, section, date, and attendance records are required" });
		}

		const normalizedDate = normalizeDate(date);
		if (!normalizedDate) {
			return res.status(400).json({ message: "Attendance date is invalid" });
		}

		const faculty = await getFacultyForUser(req.user.userId);
		if (!faculty) {
			return res.status(403).json({ message: "Faculty profile not found" });
		}

		const assignment = await getAssignedClass(faculty._id, subjectId, sectionId);
		if (!assignment) {
			return res.status(403).json({ message: "You are not assigned to this subject and section" });
		}

		const [subject, section] = await Promise.all([
			Subject.findById(subjectId).select("department semester"),
			Section.findById(sectionId).select("department name semester"),
		]);
		if (!subject || !section) {
			return res.status(404).json({ message: "Subject or section not found" });
		}

		if (subject.semester !== section.semester) {
			return res.status(400).json({ message: "Subject and section semesters do not match" });
		}

		const studentIds = attendance.map((record) => record.student);
		if (studentIds.some((studentId) => !isValidId(studentId)) || new Set(studentIds.map(String)).size !== studentIds.length) {
			return res.status(400).json({ message: "Attendance contains invalid or duplicate students" });
		}
		if (attendance.some((record) => !["present", "absent"].includes(record.status))) {
			return res.status(400).json({ message: "Each attendance status must be present or absent" });
		}

		const students = await Student.find({
			_id: { $in: studentIds },
			department: section.department,
			section: section.name,
		}).select("_id");
		if (students.length !== studentIds.length) {
			return res.status(400).json({ message: "All students must belong to the selected section" });
		}

		const existingRecords = await Attendance.find({
			student: { $in: studentIds },
			subject: subjectId,
			date: normalizedDate,
		}).select("student");
		if (existingRecords.length > 0) {
			return res.status(409).json({ message: "Attendance already exists for one or more students on this date" });
		}

		const records = attendance.map((record) => ({
			student: record.student,
			subject: subjectId,
			faculty: faculty._id,
			section: sectionId,
			date: normalizedDate,
			status: record.status,
		}));
		const createdRecords = await Attendance.insertMany(records);

		return res.status(201).json({
			message: "Attendance submitted successfully",
			count: createdRecords.length,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "Attendance already exists for one or more students on this date" });
		}
		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: "Attendance contains invalid data" });
		}

		console.error("Unable to submit attendance:", error.message);
		return res.status(500).json({ message: "Unable to submit attendance" });
	}
};

module.exports = {
	getStudentsForAttendance,
	createAttendance,
	getStudentAttendance,
	getStudentAttendanceSummary,
	getSubjectAttendanceSummary,
	getAttendanceHistory,
	updateAttendance,
	getAttendanceAuditHistory,
};
