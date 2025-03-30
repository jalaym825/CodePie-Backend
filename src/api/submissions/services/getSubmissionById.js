const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

/**
 * Get details of a specific submission
 */
const getSubmissionDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdminUser = req.user.role === 'ADMIN';

        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                problem: {
                    select: {
                        id: true,
                        title: true,
                        contestId: true,
                        points: true,
                        contest: {
                            select: {
                                title: true
                            }
                        }
                    }
                },
                testCaseResults: {
                    include: {
                        testCase: {
                            select: {
                                id: true,
                                input: true,
                                output: true,
                                explanation: true,
                                isHidden: true,
                                points: true
                            }
                        }
                    }
                }
            }
        });

        if (!submission) {
            return next(new ApiError(404, 'Submission not found', null, `/submissions/${id}`));
        }

        // Security check: Only admins or the user who made the submission can view it
        if (!isAdminUser && submission.userId !== userId) {
            return next(new ApiError(403, 'Access denied', null, `/submissions/${id}`));
        }

        // For non-admins, filter out hidden test cases or hide their details
        if (!isAdminUser) {
            submission.testCaseResults = submission.testCaseResults.map(result => {
                if (result.testCase.isHidden) {
                    return {
                        ...result,
                        testCase: {
                            ...result.testCase,
                            input: 'Hidden',
                            output: 'Hidden'
                        }
                    };
                }
                return result;
            });
        }

        return res.json(new ApiResponse(submission, 'Submission details retrieved successfully'));
    } catch (error) {
        return next(new ApiError(500, error.message, error, `/submissions/${req.params.id}`));
    }
};

module.exports = getSubmissionDetails;