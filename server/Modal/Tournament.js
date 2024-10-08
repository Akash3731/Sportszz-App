const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  tournamentname: {
    type: String,
    required: true,
  },
  organizerName: {
    type: String,
    required: true,
  },
  image: { type: String },
  date: {
    type: String, // Store as 12-hour format string
    required: true,
  },
  enddate: {
    type: String, // Store as 12-hour format string
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  teamsparticipants: {
    type: String,
    required: true,
  },
  sporttype: {
    type: String,
    required: true,
  },
  numberofteams: {
    type: Number,
    required: true,
  },
  tournamenttype: {
    type: String,
    required: true,
  },
  contactinformation: {
    type: String,
    required: true,
  },
  prizes: {
    type: String,
    required: true,
  },
  rules: {
    type: String,
    required: true,
  },
  sponsor: {
    type: String,
    required: true,
  },
  isFavorite: { type: Boolean, default: false },
});

module.exports = mongoose.model('Tournament', TournamentSchema);

