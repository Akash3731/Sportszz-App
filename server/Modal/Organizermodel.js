const mongoose = require("mongoose");

const OrganizerSchema = new mongoose.Schema(
  {
    clubName: {
      type: String,
      required: true,
    },
    organizerName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    registrationID: {
      type: String,
      required: true,
    },
    typeOfRegistration: {
      type: String,
      required: true,
    },
    registrationDate: {
      type: Date,
      required: true,
    },
    sports: {
      type: String,
      required: true,
    },
    noOfPlayers: {
      type: Number,
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

const Organizer = mongoose.model("Organizer", OrganizerSchema);

module.exports = Organizer;
