const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
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
});

const ClubAdminSchema = new mongoose.Schema(
  {
    sports: {
      type: String,
      required: true,
    },
    noOfPlayers: {
      type: Number,
      required: true,
    },
    timeToOpen: {
      type: String,
      required: true,
    },
    timeToClose: {
      type: String,
      required: true,
    },
    contacts: [ContactSchema],
    locations: {
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

const ClubAdmin = mongoose.model("ClubAdmin", ClubAdminSchema);

module.exports = ClubAdmin;
