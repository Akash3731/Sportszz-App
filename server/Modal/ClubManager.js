const mongoose = require("mongoose");

const clubManagerSchema = new mongoose.Schema(
  {
    sport: {
      type: String,
      required: true,
    },
    contactPersonName: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    emailID: {
      type: String,
      required: true,
    },
    locations: {
      type: String,
      required: true,
    },
    roles: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      
    },
    idendtityname: {
      type: String,
      required: true,
    },
    idCard: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const ClubManager = mongoose.model("ClubManager", clubManagerSchema);

module.exports = ClubManager;
