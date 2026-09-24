const mongoose = require("mongoose")

const UserModel = new mongoose.Schema({
	name:{
		type:String,
		required:true,

	},
	email:{
		type:String,
		required:true,
		unique:true,

	},
	password:{
		type:String,
		required:true,

	},
	role:{
		type:String,
		 enum: ["admin", "faculty", "student"],
		required:true,

	}
	
},{
	timestamps:true
})

module.exports = mongoose.model('User',UserModel);