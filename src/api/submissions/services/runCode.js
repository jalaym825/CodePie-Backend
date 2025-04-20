const ApiError = require("@entities/ApiError");
const ApiResponse = require("@entities/ApiResponse");
const prisma = require("@utils/prisma")
const { processSubmission } = require("../utils")
const axios = require("axios");
const { judgeTestCase } = require("@utils/judge0");

const runCode = async (req, res, next) => {
    try {
        const { problemId, languageId, testCaseId, sourceCode, input, output } = req.body;
        const userId = req.user.id;

        // Check if problem exists and is visible
        const problem = await prisma.problem.findUnique({
            where: {
                id: problemId,
            },
            include: {
                contest: true,
                testCases: true
            }
        });

        if (!problem) {
            return next(new ApiError(404, 'Problem not found', null, '/submissions'));
        }

        // Check if the contest is active
        // const now = new Date();
        // if (now < problem.contest.startTime || now > problem.contest.endTime) {
        //     return next(new ApiError(400, 'Contest is not active', null, '/submissions'));
        // }

        // if contest is live and user hasn't participated
        if (problem.contest && problem.contest.startTime >= new Date() && problem.contest.endTime <= new Date()) {
            const participation = await prisma.participation.findUnique({
                where: {
                    userId_contestId: {
                        userId,
                        contestId: problem.contest.id
                    }
                }
            });
            if (!participation) {
                return next(new ApiError(400, "You need to join the contest", null, "/submissions/createSubmission"));
            }
        }

        // Process submission asynchronously
        // In production, you should use a proper queue system like Bull
        // judgeTestCase(sourceCode, languageId, input, '')
        judgeTestCase({
            sourceCode,
            languageId: parseInt(languageId),
            input,
            expectedOutput: output,
            userId: userId,
            testCaseId: testCaseId,
            problemId: problem.id
        })
            .catch(err => console.error('Error processing submission:', err));

        return res.status(201).json(new ApiResponse({}, 'Code execution in queue'));
    } catch (error) {
        return next(new ApiError(500, error.message, error, '/submissions'));
    }
};

module.exports = runCode;