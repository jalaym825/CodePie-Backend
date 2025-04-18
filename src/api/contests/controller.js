const isAuthenticated = require('../../middlewares/isAuthenticated');
const router = require('express').Router();
const createContest = require("./services/createContest");
const isAdmin = require("@middlewares/isAdmin");
const zodValidator = require("@middlewares/zodValidator")
const createContestDto = require("./dtos/create-contest-dto");
const joinContest = require('./services/joinContest');
const getAllContests = require('./services/getAllContests');
const getContestById = require('./services/getContestById');
const getLeaderboard = require('./services/getLeaderboard');
const updateContest = require('./services/updateContest');
const updateContestDto = require("./dtos/update-contest-dto");

router.post('/', isAuthenticated(), isAdmin, zodValidator(createContestDto),  createContest);
router.get('/', isAuthenticated(false), getAllContests);
router.post('/:id', isAuthenticated(false), getContestById);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/:id/join', isAuthenticated(), joinContest);
router.put('/:id', isAuthenticated(), isAdmin, zodValidator(updateContestDto), updateContest);

module.exports = router;