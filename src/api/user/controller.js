const ApiResponse = require('@entities/ApiResponse');
const isAuthenticated = require('../../middlewares/isAuthenticated');
const getUserProfile = require('./services/getUserProfile');
const formatCodeByLanguage = require('./services/formatCode');
const router = require('express').Router();

router.get('/profile', isAuthenticated, getUserProfile);

router.get("/api/time", (req, res) => {
    res.json(new ApiResponse({ serverTime: Date.now() }, "Server time fetched successfully"));
});

router.post('/api/format/', isAuthenticated, formatCodeByLanguage);

module.exports = router;