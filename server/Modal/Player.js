// const mongoose = require("mongoose");

// const playerSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     dateOfBirth: {
//       type: Date,
//       required: true,
//     },
//     age: {
//       type: Number,
//       required: true,
//     },
//     sex: {
//       type: String,
//       required: true,
//     },
//     sports: {
//       type: String,
//       required: true,
//     },
//     guardianName: {
//       type: String,
//       required: function () {
//         return this.age < 14;
//       },
//     },
//     relationshipToPlayer: {
//       type: String,
//       required: function () {
//         return this.age < 14;
//       },
//     },
//     schoolCollegeName: {
//       type: String,
//       required: function () {
//         return this.age < 14;
//       },
//     },
//     guardianMobileNumber: {
//       type: String,
//       required: function () {
//         return this.age < 14;
//       },
//     },
//     clubName: {
//       type: String,
//     },
//     contactNumber: {
//       type: String,
//       required: true,
//     },
//     emergencyContactNumber: {
//       type: String,
//     },
//     address: {
//       type: String,
//       required: true,
//     },
//     rank: {
//       type: String,
//     },
//     certificates: {
//       type: String,
//     },
//     achievements: {
//       type: String,
//     },
//     typeOfPlayer: {
//       type: String,
//     },
//     identityCardType: {
//       type: String,
//     },
//     identityID: {
//       type: String,
//     },
//     locations: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const playerSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     position: {
//       type: String,
//       enum: ["Select Position", "Player", "Substitute", "Captain"],
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// const Player = mongoose.model("Player", playerSchema); // Export the model
// module.exports = Player;
