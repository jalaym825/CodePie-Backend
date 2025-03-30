const isAuthenticated = require('../../middlewares/isAuthenticated');
const router = require('express').Router();
const createContest = require("./services/createContest");
const isAdmin = require("@middlewares/isAdmin");
const zodValidator = require("@middlewares/zodValidator")
const createContestDto = require("./dtos/create-contest-dto");
const joinContest = require('./services/joinContest');

router.post('/', isAuthenticated, isAdmin, zodValidator(createContestDto),  createContest);
router.post('/:id/join', isAuthenticated, joinContest)

module.exports = router;