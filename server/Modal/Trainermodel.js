const mongoose = require("mongoose");

const TrainermodelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming "User" is the name of your user model
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  sex: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"], 
  },
  sports: {
    type: String,
    required: true,
  },
  clubNames: [{
    type :String ,
    required: true,
  }],
  contactNumber: {
    type: String,
    required: true,
  },
  emergencyContactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
 
  address: {
    type: String,
    required: true,
  },
  rankLocal: {
    type: String,
  },
  rankDistrict: {
    type: String,
  },
  rankState: {
    type: String,
  },
  rankNational: {
    type: String,
  },
  certificates: {
    type: String, // URL or file path
  },
  achievements: {
    type: String,
  },
  identityCardType: {
    type: String,
  },
  identityID: {
    type: String,
  },
  locations: [{
    type: String,
    required: true,
  }],
}, { timestamps: true });

const Trainermodel = mongoose.model("Trainermodel", TrainermodelSchema);

module.exports = Trainermodel;
