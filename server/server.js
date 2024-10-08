const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const updateRoutes = require("./routes/updateRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
require("dotenv").config();

const app = express();
const path = require("path");
app.use(express.json());
app.use(cors());

const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("MONGO_URI is not defined");
  process.exit(1);
}

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", updateRoutes);
app.use("/api", tournamentRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
