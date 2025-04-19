const axios = require('axios');
const prisma = require('@utils/prisma');
const { userSockets } = require('../socket');

const judge0_url = process.env.JUDGE0_URL
/**
 * Get the submission result from Judge0
 * @param {string} token The submission token
 * @returns {Promise<Object>} The submission results
 */
const getSubmissionResult = async (token) => {
    try {
        // Implement with polling since Judge0 is asynchronous
        let result;
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts with 1s interval = 30s max wait time

        while (attempts < maxAttempts) {
            const response = await axios.get(`${judge0_url}/submissions/${token}`);

            result = response.data;

            // Check if the submission is processed
            if (result.status.id > 2) { // Not in queue or processing
                return result;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        throw new Error('Judge result timed out');
    } catch (error) {
        console.error('Error getting judge result:', error.message);
        throw new Error('Failed to get judge submission result');
    }
};

/**
 * Submit a solution to Judge0 with a specific test case input
 * @param {string} sourceCode The source code to run
 * @param {number} languageId The language ID
 * @param {string} input The test case input
 * @param {string} expectedOutput The expected output
 * @param {number} timeLimit Time limit in milliseconds
 * @param {number} memoryLimit Memory limit in kilobytes
 * @returns {Promise<Object>} The test case results
 */
const judgeTestCase = async ({ sourceCode, languageId, input, expectedOutput, userId, isSubmission, problemId, testCaseId, submissionId }) => {
    try {
        // Prepare submission payload
        const payload = {
            source_code: sourceCode,
            language_id: parseInt(languageId), // Ensure languageId is a number
            stdin: input || '',
            expected_output: expectedOutput || '',
            cpu_time_limit: 10,
            "memory_limit": 128000,
            "callback_url": process.env.CALLBACK_URL + `/submissions/callback?userId=${userId}&isSubmission=${isSubmission}&problemId=${problemId}&testCaseId=${testCaseId}&submissionId=${submissionId}`,
        };

        // Submit to Judge0
        const response = await axios.post(`${judge0_url}/submissions`, payload, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const token = response.data.token;
    } catch (error) {
        console.error('Error judging test case:', error);

        // Handle different types of errors
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Judge0 API error details:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });

            if (error.response.status === 422) {
                // Provide more specific error info for validation errors
                const errorDetail = error.response.data?.error || 'Invalid submission parameters';
                throw new Error(`Judge0 validation error: ${errorDetail}`);
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from Judge0 API');
            throw new Error('No response received from judge service');
        }

        // Generic error case
        throw new Error(`Failed to judge test case: ${error.message}`);
    }
};
/**
 * Map Judge0 status IDs to our application status strings
 * @param {number} judgeStatusId The Judge0 status ID
 * @returns {string} Our application status string
 */


const mapJudgeStatus = (judgeStatusId) => {
    const statusMap = {
        1: 'IN_QUEUE',             // In Queue
        2: 'PROCESSING',           // Processing
        3: 'ACCEPTED',             // Accepted
        4: 'WRONG_ANSWER',         // Wrong Answer
        5: 'TIME_LIMIT_EXCEEDED',  // Time Limit Exceeded
        6: 'COMPILATION_ERROR',    // Compilation Error
        7: 'RUNTIME_ERROR',        // Runtime Error
        8: 'INTERNAL_ERROR',       // Internal Error
        9: 'MEMORY_LIMIT_EXCEEDED' // Memory Limit Exceeded
    };

    return statusMap[judgeStatusId] || 'INTERNAL_ERROR';
};

/**
 * Run batch testing for all test cases of a submission
 * @param {string} submissionId The submission ID
 * @param {Object} submission The submission details
 * @param {Array} testCases The test cases to run
 * @returns {Promise<Object>} Results summary
 */
const processAllTestCases = async (submissionId, submission, testCases, isSubmission, problemId, userId) => {
    try {
        const { sourceCode, languageId } = submission;

        // Process each test case
        Promise.all(testCases.map(async (testCase) => {
            await prisma.testCaseResult.create({
                data: {
                    submissionId,
                    testCaseId: testCase.id,
                    status: "PROCESSING",
                }
            });
            judgeTestCase({
                userId,
                sourceCode,
                languageId,
                input: testCase.input,
                expectedOutput: testCase.output,
                isSubmission: isSubmission,
                problemId,
                testCaseId: testCase.id,
                submissionId
            });
        }));
    } catch (error) {
        console.error('Error processing test cases:', error);
        throw new Error('Failed to process all test cases');
    }
};

module.exports = {
    // submitToJudge,
    getSubmissionResult,
    judgeTestCase,
    processAllTestCases,
    mapJudgeStatus
};