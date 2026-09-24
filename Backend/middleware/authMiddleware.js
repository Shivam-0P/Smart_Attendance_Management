const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	const authorizationHeader = req.headers.authorization;

	if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Authentication token is required" });
	}

	const token = authorizationHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Authentication token is required" });
	}

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

module.exports = authMiddleware;
