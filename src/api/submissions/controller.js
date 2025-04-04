// routes/submissions.js

const express = require('express');
const isAuthenticated = require('@middlewares/isAuthenticated');
const isAdmin = require('@middlewares/isAdmin');
const getUserSubmissions = require("./services/getUserSubmissions")
const createSubmission = require("./services/createSubmission")
const getSubmissionDetails = require("./services/getSubmissionById");
const runCode = require('./services/runCode');
const { sendTestCaseResult } = require('../../socket');
const axios = require('axios');

const router = express.Router();

router.put('/callback', async (req, res) => {
    const { stdout, time, memory, stderr, compile_output, message, status, token } = req.body;
    const { userId, isSubmission, problemId, testCaseId, submissionId } = req.query;
    const result = {
        stdout: stdout ? Buffer.from(stdout, 'base64').toString() : '',
        time,
        memory,
        stderr: stderr ? Buffer.from(stderr, 'base64').toString() : '',
        compile_output: compile_output ? Buffer.from(compile_output, 'base64').toString() : '',
        message,
        status
    }
    console.log(result)
    sendTestCaseResult("xyz", result);
    if (isSubmission) {
        const testCaseResult = await prisma.testCaseResult.create({
            data: {
                submissionId,
                testCaseId: testCase.id,
                status: result.status,
                executionTime: result.executionTime,
                memoryUsed: result.memoryUsed,
                stdout: result.stdout,
                stderr: result.stderr,
                passed: result.passed
            }
        });

        // Calculate score
        if (result.passed) {
            totalScore += testCase.points;
        }

        // Update overall status (prioritize errors)
        if (result.status !== 'ACCEPTED' && overallStatus === 'ACCEPTED') {
            overallStatus = result.status;
        }

        return testCaseResult;
    }
    res.status(200).json({ message: 'Callback received' });
})

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