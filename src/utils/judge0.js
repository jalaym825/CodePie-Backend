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
        if (failed === testCases.length) {
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

const languages = [
    {
        "id": 45,
        "name": "Assembly (NASM 2.14.02)"
    },
    {
        "id": 46,
        "name": "Bash (5.0.0)"
    },
    {
        "id": 47,
        "name": "Basic (FBC 1.07.1)"
    },
    {
        "id": 75,
        "name": "C (Clang 7.0.1)"
    },
    {
        "id": 76,
        "name": "C++ (Clang 7.0.1)"
    },
    {
        "id": 48,
        "name": "C (GCC 7.4.0)"
    },
    {
        "id": 52,
        "name": "C++ (GCC 7.4.0)"
    },
    {
        "id": 49,
        "name": "C (GCC 8.3.0)"
    },
    {
        "id": 53,
        "name": "C++ (GCC 8.3.0)"
    },
    {
        "id": 50,
        "name": "C (GCC 9.2.0)"
    },
    {
        "id": 54,
        "name": "C++ (GCC 9.2.0)"
    },
    {
        "id": 86,
        "name": "Clojure (1.10.1)"
    },
    {
        "id": 51,
        "name": "C# (Mono 6.6.0.161)"
    },
    {
        "id": 77,
        "name": "COBOL (GnuCOBOL 2.2)"
    },
    {
        "id": 55,
        "name": "Common Lisp (SBCL 2.0.0)"
    },
    {
        "id": 56,
        "name": "D (DMD 2.089.1)"
    },
    {
        "id": 57,
        "name": "Elixir (1.9.4)"
    },
    {
        "id": 58,
        "name": "Erlang (OTP 22.2)"
    },
    {
        "id": 44,
        "name": "Executable"
    },
    {
        "id": 87,
        "name": "F# (.NET Core SDK 3.1.202)"
    },
    {
        "id": 59,
        "name": "Fortran (GFortran 9.2.0)"
    },
    {
        "id": 60,
        "name": "Go (1.13.5)"
    },
    {
        "id": 88,
        "name": "Groovy (3.0.3)"
    },
    {
        "id": 61,
        "name": "Haskell (GHC 8.8.1)"
    },
    {
        "id": 62,
        "name": "Java (OpenJDK 13.0.1)"
    },
    {
        "id": 63,
        "name": "JavaScript (Node.js 12.14.0)"
    },
    {
        "id": 78,
        "name": "Kotlin (1.3.70)"
    },
    {
        "id": 64,
        "name": "Lua (5.3.5)"
    },
    {
        "id": 89,
        "name": "Multi-file program"
    },
    {
        "id": 79,
        "name": "Objective-C (Clang 7.0.1)"
    },
    {
        "id": 65,
        "name": "OCaml (4.09.0)"
    },
    {
        "id": 66,
        "name": "Octave (5.1.0)"
    },
    {
        "id": 67,
        "name": "Pascal (FPC 3.0.4)"
    },
    {
        "id": 85,
        "name": "Perl (5.28.1)"
    },
    {
        "id": 68,
        "name": "PHP (7.4.1)"
    },
    {
        "id": 43,
        "name": "Plain Text"
    },
    {
        "id": 69,
        "name": "Prolog (GNU Prolog 1.4.5)"
    },
    {
        "id": 70,
        "name": "Python (2.7.17)"
    },
    {
        "id": 71,
        "name": "Python (3.8.1)"
    },
    {
        "id": 80,
        "name": "R (4.0.0)"
    },
    {
        "id": 72,
        "name": "Ruby (2.7.0)"
    },
    {
        "id": 73,
        "name": "Rust (1.40.0)"
    },
    {
        "id": 81,
        "name": "Scala (2.13.2)"
    },
    {
        "id": 82,
        "name": "SQL (SQLite 3.27.2)"
    },
    {
        "id": 83,
        "name": "Swift (5.2.3)"
    },
    {
        "id": 74,
        "name": "TypeScript (3.7.4)"
    },
    {
        "id": 84,
        "name": "Visual Basic.Net (vbnc 0.0.0.5943)"
    }
]


module.exports = {
    judgeTestCase,
    processAllTestCases,
    mapJudgeStatus,
    languages
};