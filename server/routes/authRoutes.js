const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../Modal/User");
const Superadminmodel = require("../Modal/Superadminmodel");
const { Manager, Group, Team, Player } = require("../Modal/Manager");
require("dotenv").config();
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "aakash7536@gmail.com",
    pass: "tmcj fbnn lffr cspa",
  },
});

// login user
router.post("/register", async (req, res) => {
  const { name, email, mobile, password, role, age, website, members } =
    req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({
      name,
      email,
      mobile,
      password,
      role,
      age,
      website,
      members,
      isApproved: role === "Club" || role === "Organization" ? false : true,
    });

    await user.save();

    if (user.isApproved) {
      const payload = { userId: user.id };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({ token, message: "Registration successful" });
        }
      );
    } else {
      res.json({ message: "Registration successful, waiting for approval" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});
//login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "User not approved yet" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
});

//superadmin login
router.post("/superadminlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Superadminmodel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ success: true, token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route to create a new manager
router.post("/managers", async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Check if a manager with the given email already exists
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    // If no existing manager, proceed with creating the new one
    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new Manager({ name, email, password: hashedPassword });

    await newManager.save();

    // Update login link for development environment using Expo deep link
    const loginLink = `exp://192.168.0.173:8081/--/manager-login`;

    // Sending the email with credentials
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // Use the email variable defined above
      subject: "Your Manager Login Link and Credentials",
      text: `Hello ${name},\n\nYour account has been created as a manager. You can log in using the following credentials:\n\nEmail: ${email}\nPassword: ${password}\n\nClick the link below to log in:\n${loginLink}\n\nThank you,\nSportszz Team`, // Format the email text to include login credentials and the link
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "Manager added and email sent with credentials!" });
  } catch (error) {
    console.error("Error adding manager or sending email:", error);
    res.status(500).json({
      error: "An error occurred while adding the manager or sending the email.",
    });
  }
});

// GET
// Get currently logged in manager
router.get("/managers/me", async (req, res) => {
  try {
    // Get the manager ID from the request headers
    const managerId = req.headers["manager-id"]; // Expecting manager ID in headers

    // Check if managerId is provided
    if (!managerId) {
      return res.status(401).json({ message: "No manager logged in." });
    }

    // Find the manager using the provided ID
    const manager = await Manager.findById(managerId)
      .select("_id") // Only select the _id field, or add more fields if needed
      .lean(); // Convert to plain JavaScript object

    // If no manager is found, return a 404 response
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Return the manager ID in the response
    res.json({ _id: manager._id });
  } catch (error) {
    console.error("Error fetching current manager:", error);
    // Return a 500 status with error message
    res.status(500).json({
      message: "Error fetching manager ID",
      error: error.message,
    });
  }
});

// Fetching all managers
router.get("/club-admin/managers", async (req, res) => {
  try {
    const managers = await Manager.find();
    res.status(200).json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error); // Log the error
    res.status(500).json({ message: "Error fetching managers", error });
  }
});

{
  /* Manager section*/
}

// Login endpoint
// Login endpoint
router.post("/manager-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the manager by email
    const manager = await Manager.findOne({ email });

    // Check if the manager exists
    if (!manager) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the manager is active
    if (!manager.isActive) {
      return res.status(403).json({ message: "Manager is not active" });
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Login successful
    res.status(200).json({
      message: "Login successful",
      _id: manager._id, // Return the manager ID here
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// Activate or Deactivate Manager
router.put("/managers/:id/activate", async (req, res) => {
  const { isActive } = req.body;

  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: "Manager not found" });
    }

    manager.isActive = isActive; // Update the isActive status
    await manager.save(); // Save changes to the database

    res.status(200).json({
      message: `Manager ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error activating/deactivating manager:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Delete Manager Endpoint
router.delete("/managers/:id", async (req, res) => {
  try {
    const managerId = req.params.id;

    // Find the manager by ID and delete it
    const deletedManager = await Manager.findByIdAndDelete(managerId);

    // Check if the manager was found and deleted
    if (!deletedManager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Return a success message
    res.status(200).json({ message: "Manager deleted successfully" });
  } catch (error) {
    console.error("Error deleting manager:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the manager" });
  }
});

{
  /*Team Management Section */
}

// Group Routes
router.post("/managers/:managerId/groups", async (req, res) => {
  try {
    const { managerId } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ message: "Invalid manager ID" });
    }

    const group = new Group({ name });
    await group.save();

    await Manager.findByIdAndUpdate(managerId, {
      $push: { groups: group },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error(`Error creating group: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred while creating a group." });
  }
});

// Delete Group
router.delete("/managers/:managerId/groups/:groupId", async (req, res) => {
  try {
    const { managerId, groupId } = req.params;

    console.log(
      `Received request to delete group: ${groupId} for manager: ${managerId}`
    );

    const manager = await Manager.findById(managerId);
    if (!manager) {
      console.log("Manager not found");
      return res.status(404).json({ message: "Manager not found" });
    }

    const groupIndex = manager.groups.findIndex(
      (group) => group._id.toString() === groupId
    );
    if (groupIndex === -1) {
      console.log("Group not found");
      return res.status(404).json({ message: "Group not found" });
    }

    // Remove the group using its index
    manager.groups.splice(groupIndex, 1);
    await manager.save();

    console.log("Group deleted successfully:", groupId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: error.message });
  }
});

// Edit Group Route
router.put("/managers/:managerId/groups/:groupId", async (req, res) => {
  try {
    const { managerId, groupId } = req.params;
    const { name } = req.body;

    console.log(
      `Received request to update group: ${groupId} for manager: ${managerId}, new name: ${name}`
    );

    const manager = await Manager.findById(managerId);
    if (!manager) {
      console.log("Manager not found");
      return res.status(404).json({ message: "Manager not found" });
    }

    const group = manager.groups.id(groupId);
    if (!group) {
      console.log("Group not found");
      return res.status(404).json({ message: "Group not found" });
    }

    group.name = name;
    await manager.save();

    console.log("Group updated successfully:", group);
    res.status(200).json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: error.message });
  }
});

// Team Routes
// Create Team
router.post("/managers/:managerId/groups/:groupId/teams", async (req, res) => {
  try {
    const { managerId, groupId } = req.params;
    const { name } = req.body;

    console.log(
      `Received request to create team for manager: ${managerId}, group: ${groupId}, team name: ${name}`
    );

    const manager = await Manager.findById(managerId);
    if (!manager) {
      console.log("Manager not found");
      return res.status(404).json({ message: "Manager not found" });
    }

    const group = manager.groups.id(groupId);
    if (!group) {
      console.log("Group not found");
      return res.status(404).json({ message: "Group not found" });
    }

    const team = new Team({ name });
    group.teams.push(team);
    await manager.save();

    console.log("Team created successfully:", team);
    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Team
router.put(
  "/managers/:managerId/groups/:groupId/teams/:teamId",
  async (req, res) => {
    try {
      const { managerId, groupId, teamId } = req.params;
      const { name } = req.body;

      console.log(
        `Received request to update team: ${teamId} for manager: ${managerId}, group: ${groupId}, new name: ${name}`
      );

      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).json({ message: "Manager not found" });
      }

      const group = manager.groups.id(groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ message: "Group not found" });
      }

      const team = group.teams.id(teamId);
      if (!team) {
        console.log("Team not found");
        return res.status(404).json({ message: "Team not found" });
      }

      team.name = name;
      await manager.save();

      console.log("Team updated successfully:", team);
      res.status(200).json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Team
router.delete(
  "/managers/:managerId/groups/:groupId/teams/:teamId",
  async (req, res) => {
    try {
      const { managerId, groupId, teamId } = req.params;

      console.log(
        `Received request to delete team: ${teamId} for manager: ${managerId}, group: ${groupId}`
      );

      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).json({ message: "Manager not found" });
      }

      const group = manager.groups.id(groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ message: "Group not found" });
      }

      const teamIndex = group.teams.findIndex(
        (team) => team._id.toString() === teamId
      );
      if (teamIndex === -1) {
        console.log("Team not found");
        return res.status(404).json({ message: "Team not found" });
      }

      // Remove the team using its index
      group.teams.splice(teamIndex, 1);
      await manager.save();

      console.log("Team deleted successfully:", teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Player Routes
// Create Player
router.post(
  "/managers/:managerId/groups/:groupId/teams/:teamId/players",
  async (req, res) => {
    try {
      const { managerId, groupId, teamId } = req.params;
      const { name, position } = req.body;

      console.log(
        `Received request to create player for manager: ${managerId}, group: ${groupId}, team: ${teamId}, player name: ${name}`
      );

      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).json({ message: "Manager not found" });
      }

      const group = manager.groups.id(groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ message: "Group not found" });
      }

      const team = group.teams.id(teamId);
      if (!team) {
        console.log("Team not found");
        return res.status(404).json({ message: "Team not found" });
      }

      const player = new Player({ name, position });
      team.players.push(player);
      await manager.save();

      console.log("Player created successfully:", player);
      res.status(201).json(player);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Update Player
router.put(
  "/managers/:managerId/groups/:groupId/teams/:teamId/players/:playerId",
  async (req, res) => {
    try {
      const { managerId, groupId, teamId, playerId } = req.params;
      const { name, position } = req.body;

      console.log(
        `Received request to update player: ${playerId} for manager: ${managerId}, group: ${groupId}, team: ${teamId}, new name: ${name}, new position: ${position}`
      );

      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).json({ message: "Manager not found" });
      }

      const group = manager.groups.id(groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ message: "Group not found" });
      }

      const team = group.teams.id(teamId);
      if (!team) {
        console.log("Team not found");
        return res.status(404).json({ message: "Team not found" });
      }

      const player = team.players.id(playerId);
      if (!player) {
        console.log("Player not found");
        return res.status(404).json({ message: "Player not found" });
      }

      player.name = name;
      player.position = position;
      await manager.save();

      console.log("Player updated successfully:", player);
      res.status(200).json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Player
router.delete(
  "/managers/:managerId/groups/:groupId/teams/:teamId/players/:playerId",
  async (req, res) => {
    try {
      const { managerId, groupId, teamId, playerId } = req.params;

      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).json({ message: "Manager not found" });
      }

      const group = manager.groups.id(groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ message: "Group not found" });
      }

      const team = group.teams.id(teamId);
      if (!team) {
        console.log("Team not found");
        return res.status(404).json({ message: "Team not found" });
      }

      // Instead of using player.remove(), filter out the player
      const initialPlayerCount = team.players.length; // Store initial count for logging
      team.players = team.players.filter(
        (player) => player._id.toString() !== playerId
      );

      // Check if the player was found and removed
      if (team.players.length === initialPlayerCount) {
        console.log("Player not found in the team");
        return res.status(404).json({ message: "Player not found" });
      }

      await manager.save(); // Save the manager to persist changes

      console.log("Player deleted successfully:", playerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Fetch Groups
// Fetch Groups for a manager
router.get("/managers/:managerId/groups", async (req, res) => {
  try {
    const { managerId } = req.params;

    // Log the received managerId
    console.log(`Received request to fetch groups for manager: ${managerId}`);

    // Check if the managerId is valid
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ message: "Invalid manager ID" });
    }

    // Fetch the manager and check for existence
    const manager = await Manager.findById(managerId).select("groups");
    if (!manager) {
      return res.status(404).json({ message: "Manager not found." });
    }

    // Log the manager object for debugging
    console.log("Manager fetched:", manager);

    // Check if the manager has groups
    if (!manager.groups || manager.groups.length === 0) {
      return res.status(200).json([]); // Return an empty array if no groups found
    }

    // Respond with groups
    res.status(200).json(manager.groups);
  } catch (error) {
    console.error(`Error fetching groups: ${error.message}`);
    res.status(500).json({
      message: "An error occurred while fetching groups.",
      error: error.message,
    });
  }
});

// Fetch Teams in a Group
router.get("/managers/:managerId/groups/:groupId/teams", async (req, res) => {
  try {
    console.log(
      `Received request to fetch teams for manager: ${req.params.managerId}, group: ${req.params.groupId}`
    );

    const manager = await Manager.findById(req.params.managerId).select(
      "groups"
    );
    if (!manager) {
      console.log("Manager not found");
      return res.status(404).send("Manager not found.");
    }

    const group = manager.groups.id(req.params.groupId);
    if (!group) {
      console.log("Group not found");
      return res.status(404).send("Group not found.");
    }

    console.log("Teams fetched successfully:", group.teams);
    res.send(group.teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).send(error.message);
  }
});

// Fetch Players in a Team
router.get(
  "/managers/:managerId/groups/:groupId/teams/:teamId/players",
  async (req, res) => {
    try {
      console.log(
        `Received request to fetch players for manager: ${req.params.managerId}, group: ${req.params.groupId}, team: ${req.params.teamId}`
      );

      const manager = await Manager.findById(req.params.managerId).select(
        "groups"
      );
      if (!manager) {
        console.log("Manager not found");
        return res.status(404).send("Manager not found.");
      }

      const group = manager.groups.id(req.params.groupId);
      if (!group) {
        console.log("Group not found");
        return res.status(404).send("Group not found.");
      }

      const team = group.teams.id(req.params.teamId);
      if (!team) {
        console.log("Team not found");
        return res.status(404).send("Team not found.");
      }

      console.log("Players fetched successfully:", team.players);
      res.send(team.players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).send(error.message);
    }
  }
);

module.exports = router;
