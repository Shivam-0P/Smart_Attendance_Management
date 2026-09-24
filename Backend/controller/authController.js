const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User_model");
const Student = require("../models/Student_model");
const Department = require("../models/Department_model");

const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				message: "Email and password are required",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		return res.status(200).json({
			message: "Login successful",
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("User login failed:", error.message);
		return res.status(500).json({ message: "Unable to log in" });
	}
};

const registerUser = async (req, res) => {
	try {
		const {
			name,
			email,
			password,
			role,
			rollNumber,
			department,
			section,
			semester,
			admissionYear,
		} = req.body;

		if (!name || !email || !password || !role) {
			return res.status(400).json({
				message: "Name, email, password, and role are required",
			});
		}

		if (!['admin', 'faculty', 'student'].includes(role)) {
			return res.status(400).json({
				message: "Role must be one of: admin, faculty, or student",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();
		const existingUser = await User.findOne({ email: normalizedEmail });

		if (existingUser) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({
			name: name.trim(),
			email: normalizedEmail,
			password: hashedPassword,
			role,
		});

		if (role === "student") {
			const hasStudentProfile = [rollNumber, department, section, semester, admissionYear].every((value) => value !== undefined && value !== null && value !== "");
			if (hasStudentProfile) {
				if (!mongoose.Types.ObjectId.isValid(department) || !(await Department.exists({ _id: department }))) {
					return res.status(400).json({ message: "Referenced department must exist" });
				}

				await Student.create({
					userId: user._id,
					rollNumber: String(rollNumber).trim(),
					department,
					section: String(section).trim(),
					semester: Number(semester),
					admissionYear: Number(admissionYear),
				});
			}
		}

		return res.status(201).json({
			message: role === "student" && !(rollNumber || department || section || semester || admissionYear)
				? "User registered successfully. Please contact the administrator to create your student profile."
				: "User registered successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({ message: error.message || "Invalid student profile data" });
		}

		console.error("User registration failed:", error.message);
		return res.status(500).json({ message: "Unable to register user" });
	}
};

module.exports = { loginUser, registerUser };
