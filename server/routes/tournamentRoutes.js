/*const express = require('express');
const { createTournament, getTournaments, deleteTournament, updateTournament, getTournamentById, toggleFavorite} = require('../controllers/tournamentController');
const router = express.Router();

router.post('/tournaments', createTournament);
router.get('/tournaments', getTournaments);
router.delete('/tournaments/:id', deleteTournament);
router.put('/tournaments/:id', updateTournament);
router.get('/tournaments/:id', getTournamentById);
router.patch('/tournaments/:id/favorite', toggleFavorite); // Add this line



module.exports = router;*/

const express = require('express');
const { createTournament, getTournaments, deleteTournament, updateTournament, getTournamentById, toggleFavorite } = require('../controllers/tournamentController');
const router = express.Router();

router.post('/tournaments', createTournament);
router.get('/tournaments', getTournaments);
router.delete('/tournaments/:id', deleteTournament);
router.put('/tournaments/:id', updateTournament);
router.get('/tournaments/:id', getTournamentById);
router.patch('/tournaments/:id/favorite', toggleFavorite); // Add this line

module.exports = router;

