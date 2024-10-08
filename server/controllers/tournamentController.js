const Tournament = require('../Modal/Tournament');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save images in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add unique timestamp to filename
  }
});

const upload = multer({ storage: storage });

// Create a new tournament with image upload
exports.createTournament = [
  upload.single('image'), // Middleware to handle image upload
  async (req, res) => {
    const {
      tournamentname,
      organizerName,
      date,
      enddate,
      location,
      teamsparticipants,
      sporttype,
      numberofteams,
      tournamenttype,
      contactinformation,
      prizes,
      rules,
      sponsor,
    } = req.body;

    try {
      const tournament = new Tournament({
        tournamentname,
        organizerName,
        date,
        enddate,
        location,
        teamsparticipants,
        sporttype,
        numberofteams,
        tournamenttype,
        contactinformation,
        prizes,
        rules,
        sponsor,
        image: req.file ? req.file.filename : null, // Save the image filename if uploaded
      });

      // Save the tournament to the database
      await tournament.save();
      res.status(201).json(tournament);
    } catch (err) {
      console.error('Error creating tournament:', err.message);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
];

// Get all tournaments
exports.getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    // Prepend the '/uploads/' path to the image filename
    tournaments.forEach(tournament => {
      if (tournament.image) {
        tournament.image = `${req.protocol}://${req.get('host')}/uploads/${tournament.image}`;
      }
    });
    res.status(200).json(tournaments);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a tournament by ID
exports.getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.status(200).json(tournament);
  } catch (err) {
    console.error('Error fetching tournament by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update a tournament by ID with image upload
exports.updateTournament = [
  upload.single('image'), // Middleware for file upload
  async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
      // Find the tournament to update
      const tournament = await Tournament.findById(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      // If an image file is uploaded, replace the old image
      if (req.file) {
        // Optionally delete the old image file
        if (tournament.image) {
          const oldImagePath = path.join(__dirname, '../uploads/', tournament.image);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error('Error deleting old image:', err);
            }
          });
        }
        updatedData.image = req.file.filename;
      }

      // Update the tournament with new data
      const updatedTournament = await Tournament.findByIdAndUpdate(id, updatedData, { new: true });

      res.status(200).json(updatedTournament);
    } catch (err) {
      console.error('Error updating tournament:', err.message);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
];

// Delete a tournament by ID
exports.deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Tournament.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.status(200).json({ message: 'Tournament deleted successfully' });
  } catch (err) {
    console.error('Error deleting tournament:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle favorite status of a tournament
exports.toggleFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    tournament.isFavorite = !tournament.isFavorite;
    await tournament.save();

    res.status(200).json(tournament);
  } catch (err) {
    console.error('Error toggling favorite status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};





