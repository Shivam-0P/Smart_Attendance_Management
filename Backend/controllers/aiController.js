const Attendance = require("../models/Attendance_model");
const Faculty = require("../models/Faculty_model");
const Student = require("../models/Student_model");
const { askAttendanceQuestion, askAttendanceInsights, generateAttendanceReport } = require("../services/aiService");

const buildSummary = (records) => {
	const present = records.filter((record) => record.status === "present").length;
	const total = records.length;
	const absent = total - present;
	return {
		present,
		absent,
		total,
		percentage: total === 0 ? "0.00" : ((present / total) * 100).toFixed(2),
	};
};

const buildSubjectStats = (records) => {
	const grouped = new Map();

	for (const record of records) {
		const studentId = String(record.student?._id || record.student);
		const subjectId = String(record.subject?._id || record.subject);
		const key = `${studentId}:${subjectId}`;
		if (!grouped.has(key)) {
			grouped.set(key, {
				studentName: record.student?.userId?.name || "Unknown student",
				rollNumber: record.student?.rollNumber || "Unknown roll number",
				subject: record.subject?.name || "Unknown subject",
				subjectCode: record.subject?.code || "",
				present: 0,
				total: 0,
			});
		}

		const item = grouped.get(key);
		item.total += 1;
		if (record.status === "present") item.present += 1;
	}

	return [...grouped.values()].map((item) => ({
		...item,
		absent: item.total - item.present,
		percentage: item.total === 0 ? "0.00" : ((item.present / item.total) * 100).toFixed(2),
	}));
};

const getAuthorizedFilter = async (req) => {
	if (req.user.role === "admin") return {};
	if (req.user.role === "faculty") {
		const faculty = await Faculty.findOne({ userId: req.user.userId }).select("_id");
		return { faculty: faculty?._id || null };
	}
	if (req.user.role === "student") {
		const student = await Student.findOne({ userId: req.user.userId }).select("_id");
		return { student: student?._id || null };
	}
	return null;
};

const calculateAdministrativeStatistics = async () => {
	const [totalStudents, records] = await Promise.all([
		Student.countDocuments(),
		Attendance.find()
			.select("student subject status")
			.populate({ path: "student", select: "department", populate: { path: "department", select: "name code" } })
			.populate("subject", "name code")
			.lean(),
	]);
	const present = records.filter((record) => record.status === "present").length;
	const absent = records.length - present;
	const totalClasses = records.length;
	const groups = { students: new Map(), subjects: new Map(), departments: new Map() };
	for (const record of records) {
		const keys = {
			students: [String(record.student?._id || record.student), String(record.student?._id || record.student)],
			subjects: [String(record.subject?._id || record.subject), record.subject?.name || "Unknown subject"],
			departments: [String(record.student?.department?._id || "unknown"), record.student?.department?.name || "Unknown department"],
		};
		for (const [type, [key, name]] of Object.entries(keys)) {
			if (!groups[type].has(key)) groups[type].set(key, { name, present: 0, total: 0 });
			const group = groups[type].get(key);
			group.total += 1;
			if (record.status === "present") group.present += 1;
		}
	}
	const withPercentage = (group) => ({ ...group, absent: group.total - group.present, percentage: group.total === 0 ? "0.00" : ((group.present / group.total) * 100).toFixed(2) });
	const studentAttendance = [...groups.students.values()].map(withPercentage);
	return {
		totalStudents,
		averageAttendance: totalClasses === 0 ? "0.00" : ((present / totalClasses) * 100).toFixed(2),
		studentsBelow75: studentAttendance.filter((item) => Number(item.percentage) < 75).length,
		departmentWiseAttendance: [...groups.departments.values()].map(withPercentage),
		subjectWiseAttendance: [...groups.subjects.values()].map(withPercentage),
		present,
		absent,
		totalClasses,
		threshold: 75,
	};
};

const attendanceQuery = async (req, res) => {
	try {
		if (!["admin", "faculty", "student"].includes(req.user.role)) {
			return res.status(403).json({ message: "This role cannot use attendance queries" });
		}
		if (typeof req.body.question !== "string" || !req.body.question.trim()) {
			return res.status(400).json({ message: "A question is required" });
		}

		const filter = await getAuthorizedFilter(req);
		if (!filter || Object.values(filter).some((value) => value === null)) {
			return res.status(403).json({ message: "Attendance profile not found" });
		}

		const records = await Attendance.find(filter)
			.select("student subject status date")
			.populate({ path: "student", select: "rollNumber userId", populate: { path: "userId", select: "name" } })
			.populate("subject", "name code")
			.lean();
		const subjectStats = buildSubjectStats(records);
		const question = req.body.question.trim();
		const asksForLowAttendance = /below|low|threshold|less than|under 75/i.test(question);
		const data = {
			scope: req.user.role,
			note: "This data was calculated by the backend from authorized attendance records.",
			summary: buildSummary(records),
			...(asksForLowAttendance
				? { threshold: 75, studentsBelowThreshold: subjectStats.filter((item) => Number(item.percentage) < 75) }
				: { subjectAttendance: subjectStats }),
		};

		if (records.length === 0) data.note = "No attendance records were available for this authorized scope.";
		const answer = await askAttendanceQuestion(question, data);
		return res.status(200).json({ answer });
	} catch (error) {
		if (error.code === "AI_NOT_CONFIGURED") return res.status(503).json({ message: "AI provider is not configured" });
		if (error.code === "AI_PROVIDER_ERROR" || error.code === "AI_EMPTY_RESPONSE") return res.status(502).json({ message: "AI provider is unavailable" });
		console.error("Unable to answer attendance query:", error.message);
		return res.status(500).json({ message: "Unable to answer attendance query" });
	}
};

const attendanceInsights = async (req, res) => {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json({ message: "Only admins can request administrative insights" });
		}

		const [totalStudents, records] = await Promise.all([
			Student.countDocuments(),
			Attendance.find()
				.select("student subject status")
				.populate({ path: "student", select: "department", populate: { path: "department", select: "name code" } })
				.populate("subject", "name code")
				.lean(),
		]);

		const present = records.filter((record) => record.status === "present").length;
		const absent = records.filter((record) => record.status === "absent").length;
		const totalClasses = records.length;
		const averageAttendance = totalClasses === 0 ? "0.00" : ((present / totalClasses) * 100).toFixed(2);
		const studentGroups = new Map();
		const subjectGroups = new Map();
		const departmentGroups = new Map();

		for (const record of records) {
			const studentKey = String(record.student?._id || record.student);
			const subjectKey = String(record.subject?._id || record.subject);
			const departmentKey = String(record.student?.department?._id || "unknown");
			const addRecord = (map, key, label) => {
				if (!map.has(key)) map.set(key, { name: label, present: 0, total: 0 });
				const group = map.get(key);
				group.total += 1;
				if (record.status === "present") group.present += 1;
			};

			addRecord(studentGroups, studentKey, studentKey);
			addRecord(subjectGroups, subjectKey, record.subject?.name || "Unknown subject");
			addRecord(departmentGroups, departmentKey, record.student?.department?.name || "Unknown department");
		}

		const withPercentage = (group) => ({ ...group, absent: group.total - group.present, percentage: group.total === 0 ? "0.00" : ((group.present / group.total) * 100).toFixed(2) });
		const studentAttendance = [...studentGroups.values()].map(withPercentage);
		const statistics = {
			totalStudents,
			averageAttendance,
			studentsBelow75: studentAttendance.filter((item) => Number(item.percentage) < 75).length,
			subjectWiseAttendance: [...subjectGroups.values()].map(withPercentage),
			departmentWiseAttendance: [...departmentGroups.values()].map(withPercentage),
			present,
			absent,
			totalClasses,
			threshold: 75,
		};

		const insight = await askAttendanceInsights(statistics);
		return res.status(200).json({ insight, statistics });
	} catch (error) {
		if (error.code === "AI_NOT_CONFIGURED") return res.status(503).json({ message: "AI provider is not configured" });
		if (error.code === "AI_PROVIDER_ERROR" || error.code === "AI_EMPTY_RESPONSE") return res.status(502).json({ message: "AI provider is unavailable" });
		console.error("Unable to generate attendance insights:", error.message);
		return res.status(500).json({ message: "Unable to generate attendance insights" });
	}
};

const generateReport = async (req, res) => {
	try {
		if (req.user.role !== "admin") return res.status(403).json({ message: "Only admins can generate administrative reports" });
		const statistics = await calculateAdministrativeStatistics();
		const report = await generateAttendanceReport(statistics);
		return res.status(200).json({ report, statistics });
	} catch (error) {
		if (error.code === "AI_NOT_CONFIGURED") return res.status(503).json({ message: "AI provider is not configured" });
		if (error.code === "AI_PROVIDER_ERROR" || error.code === "AI_EMPTY_RESPONSE") return res.status(502).json({ message: "AI provider is unavailable" });
		console.error("Unable to generate attendance report:", error.message);
		return res.status(500).json({ message: "Unable to generate attendance report" });
	}
};

module.exports = { attendanceQuery, attendanceInsights, generateReport };
