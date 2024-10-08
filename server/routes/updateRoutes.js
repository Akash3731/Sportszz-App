const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const Player = require("../Modal/Player");
const ClubManager = require("../Modal/ClubManager");
const ClubAdmin = require("../Modal/ClubAdmin");
const Organizer = require("../Modal/Organizermodel");
const Trainer = require("../Modal/Trainermodel");
const User = require("../Modal/User");

router.post("/update/:role", upload.none(), async (req, res) => {
  const { role } = req.params;
  const { id, ...data } = req.body;

  let Model;
  switch (role) {
    case "Player":
      Model = Player;
      break;
    case "Manager":
      Model = ClubManager;
      break;
    case "Club":
      Model = ClubAdmin;
      break;
    case "Organization":
      Model = Organizer;
      break;
    case "Trainer":
      Model = Trainer;
      break;
    
    default:
      return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile = await Model.findOne({ userId: id });

    if (!profile) {
     
      profile = new Model({ userId: id, ...data });
      await profile.save();
    } else {
      
      profile = await Model.findOneAndUpdate({ userId: id }, data, {
        new: true,
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get('/pending-approval', async (req, res) => {
  try {
    // Find users where isApproved is false
    const pendingUsers = await User.find({ isApproved: false });
    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Approve a user
router.post('/approve/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Reject a user
router.post('/reject/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = false;
    await user.save();

    res.status(200).json({ message: 'User rejected successfully', user });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get List of Approved Users
router.get("/approved-users", async (req, res) => {
  try {
    const approvedUsers = await User.find({ isApproved: true });
    res.status(200).json(approvedUsers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});





module.exports = router;
