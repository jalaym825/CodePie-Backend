// routes/submissions.js

const express = require('express');
const isAuthenticated = require('@middlewares/isAuthenticated');
const isAdmin = require('@middlewares/isAdmin');
const getUserSubmissions = require("./services/getUserSubmissions")
const createSubmission = require("./services/createSubmission")
const getSubmissionDetails = require("./services/getSubmissionById")

const router = express.Router();

// Get all submissions for the current user
router.get('/my', isAuthenticated, getUserSubmissions);

// Submit a solution
router.post('/', isAuthenticated, createSubmission);

// Get details of a specific submission
router.get('/:id', isAuthenticated, getSubmissionDetails);

// Get all submissions for a problem (admin only)
// router.get('/problem/:problemId', isAuthenticated, isAdmin, getProblemSubmissions);

module.exports = router;