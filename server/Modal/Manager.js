const mongoose = require("mongoose");
const { Schema } = mongoose;

// Player Schema
const playerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ["Player", "Substitute", "Captain"],
      required: true,
    },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema); // Export the model

// Team Schema
const teamSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    players: [{ type: playerSchema }], // Embed player schema directly
  },
  { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);

// Group Schema
const groupSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    teams: [{ type: teamSchema }], // Embed team schema directly
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

// Manager Schema
const managerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    groups: [groupSchema], // Embed groups directly
  },
  { timestamps: true }
);

const Manager = mongoose.model("Manager", managerSchema);
module.exports = { Manager, Group, Team, Player };
