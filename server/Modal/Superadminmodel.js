const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SuperadminmodelSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving user
SuperadminmodelSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
SuperadminmodelSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Superadminmodel = mongoose.model(
  "Superadminmodel",
  SuperadminmodelSchema
);

module.exports = Superadminmodel;
