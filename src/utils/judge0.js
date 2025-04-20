const axios = require('axios');
const prisma = require('@utils/prisma');
const { userSockets, sendTestCaseResult } = require('../socket');

const judge0_url = process.env.JUDGE0_URL

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
    return token;
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
        let failed = 0;
        for (const testCase of testCases) {
            try {
                await prisma.testCaseResult.create({
                    data: {
                        submissionId,
                        testCaseId: testCase.id,
                        status: "PROCESSING",
                    }
                });

                await judgeTestCase({
                    userId,
                    sourceCode,
                    languageId,
                    input: testCase.input,
                    expectedOutput: testCase.output,
                    isSubmission,
                    problemId,
                    testCaseId: testCase.id,
                    submissionId
                });
            } catch (testCaseError) {
                failed++;
                // Handle individual test case errors without crashing the whole batch
                console.error(`Error processing test case ${testCase.id}:`, testCaseError);

                sendTestCaseResult(userId, {
                    stdout: '',
                    time: 0,
                    memory: 0,
                    stderr: 'Judge0 server error: ' + (testCaseError.message || 'Unknown error'),
                    compile_output: '',
                    message: 'INTERNAL_ERROR',
                    testCaseId: testCase.id,
                    status: 'INTERNAL_ERROR',
                });

                await prisma.testCaseResult.update({
                    where: {
                        submissionId_testCaseId: {
                            submissionId,
                            testCaseId: testCase.id
                        }
                    },
                    data: {
                        status: "INTERNAL_ERROR",
                        stderr: "Error processing test case"
                    }
                });
            }
        }
        if(failed === testCases.length) {
            await prisma.submission.update({
                where: { id: submissionId },
                data: {
                    status: "INTERNAL_ERROR",
                }
            });
        }
    } catch (error) {
        // Log but don't throw, to prevent server crash
        console.error('Error processing all test cases:', error);
    }
};


module.exports = {
    judgeTestCase,
    processAllTestCases,
    mapJudgeStatus
};