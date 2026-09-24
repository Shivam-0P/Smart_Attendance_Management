const express = require("express")
const cors = require("cors")
require("dotenv").config();

const connectDB = require("./config/Db")
const authRouter = require("./router/authRouter")
const studentRoutes = require("./router/studentRoutes")
const departmentRoutes = require("./router/departmentRoutes")
const sectionRoutes = require("./router/sectionRoutes")
const subjectRoutes = require("./router/subjectRoutes")
const facultyRoutes = require("./router/facultyRoutes")
const assignmentRoutes = require("./router/assignmentRoutes")
const attendanceRoutes = require("./router/attendanceRoutes")
const reportRoutes = require("./router/reportRoutes")
const aiRoutes = require("./routes/aiRoutes")

const app = express();

connectDB()
app.use(cors())

app.use(express.json())
app.use("/api/auth", authRouter)
app.use("/api/students", studentRoutes)
app.use("/api/departments", departmentRoutes)
app.use("/api/sections", sectionRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/faculty", facultyRoutes)
app.use("/api/assignments", assignmentRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/ai", aiRoutes)

app.get('/',(req,res)=>{
	res.send("Smart Attendance API is running")
})

const PORT = process.env.PORT

app.listen(PORT,()=>{
	console.log(`app is listning port: ${PORT}`)
})