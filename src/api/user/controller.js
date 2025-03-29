const isAuthenticated = require('../../middlewares/isAuthenticated');
const getUserProfile = require('./services/getUserProfile');
const router = require('express').Router();

router.get('/profile', isAuthenticated, getUserProfile);

module.exports = router;