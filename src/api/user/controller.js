const ApiResponse = require('@entities/ApiResponse');
const isAuthenticated = require('../../middlewares/isAuthenticated');
const getUserProfile = require('./services/getUserProfile');
const router = require('express').Router();

router.get('/profile', isAuthenticated, getUserProfile);

router.get("/api/time", (req, res) => {
    res.json(new ApiResponse({ serverTime: Date.now() }, "Server time fetched successfully"));
});

module.exports = router;