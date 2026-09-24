const mongoose = require("mongoose");

const Attendance = require("../models/Attendance_model");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getLowAttendanceReport = async (req, res) => {
	try {
		const { department, section, semester, subject } = req.query;
		const match = {};

		if (department) {
			if (!isValidId(department)) return res.status(400).json({ message: "Invalid department filter" });
			match.department = new mongoose.Types.ObjectId(department);
		}
		if (section) {
			if (!isValidId(section)) return res.status(400).json({ message: "Invalid section filter" });
			match.section = new mongoose.Types.ObjectId(section);
		}
		if (subject) {
			if (!isValidId(subject)) return res.status(400).json({ message: "Invalid subject filter" });
			match.subject = new mongoose.Types.ObjectId(subject);
		}
		if (semester) {
			const semesterNumber = Number(semester);
			if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
				return res.status(400).json({ message: "Semester filter must be between 1 and 8" });
			}
			match.semester = semesterNumber;
		}

		const report = await Attendance.aggregate([
			{ $lookup: { from: "students", localField: "student", foreignField: "_id", as: "studentRecord" } },
			{ $unwind: "$studentRecord" },
			{ $lookup: { from: "subjects", localField: "subject", foreignField: "_id", as: "subjectRecord" } },
			{ $unwind: "$subjectRecord" },
			{ $lookup: { from: "sections", localField: "section", foreignField: "_id", as: "sectionRecord" } },
			{ $unwind: "$sectionRecord" },
			{ $lookup: { from: "users", localField: "studentRecord.userId", foreignField: "_id", as: "userRecord" } },
			{ $unwind: "$userRecord" },
			{ $lookup: { from: "departments", localField: "studentRecord.department", foreignField: "_id", as: "departmentRecord" } },
			{ $unwind: "$departmentRecord" },
			{ $match: {
				...(match.subject ? { subject: match.subject } : {}),
				...(match.section ? { section: match.section } : {}),
				...(match.department ? { "studentRecord.department": match.department } : {}),
				...(match.semester ? { "subjectRecord.semester": match.semester } : {}),
			} },
			{ $group: {
				_id: { student: "$student", subject: "$subject" },
				studentName: { $first: "$userRecord.name" },
				rollNumber: { $first: "$studentRecord.rollNumber" },
				department: { $first: "$departmentRecord.name" },
				section: { $first: "$sectionRecord.name" },
				subject: { $first: "$subjectRecord.name" },
				present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
				total: { $sum: 1 },
			} },
			{ $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] } } },
			{ $match: { percentage: { $lt: 75 } } },
			{ $project: {
				_id: 0,
				studentName: 1,
				rollNumber: 1,
				department: 1,
				section: 1,
				subject: 1,
				present: 1,
				total: 1,
				percentage: 1,
			} },
			{ $sort: { percentage: 1, studentName: 1, subject: 1 } },
		]);

		return res.status(200).json({ threshold: 75, report });
	} catch (error) {
		console.error("Unable to generate low attendance report:", error.message);
		return res.status(500).json({ message: "Unable to generate low attendance report" });
	}
};

module.exports = { getLowAttendanceReport };
