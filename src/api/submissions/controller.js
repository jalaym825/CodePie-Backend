// routes/submissions.js
const express = require('express');
const isAuthenticated = require('@middlewares/isAuthenticated');
const getUserSubmissions = require("./services/getUserSubmissions")
const createSubmission = require("./services/createSubmission")
const getSubmissionDetails = require("./services/getSubmissionById");
const runCode = require('./services/runCode');
const axios = require('axios');
const submissionCallback = require("./services/submissionCallback");

const router = express.Router();

router.put('/callback', submissionCallback)

// Get all submissions for the current user
router.get('/my', isAuthenticated, getUserSubmissions);

// Submit a solution
router.post('/', isAuthenticated, createSubmission);

// Get details of a specific submission
router.get('/:id', isAuthenticated, getSubmissionDetails);

router.post('/run', isAuthenticated, runCode);

// Get all submissions for a problem (admin only)
// router.get('/problem/:problemId', isAuthenticated, isAdmin, getProblemSubmissions);

module.exports = router;