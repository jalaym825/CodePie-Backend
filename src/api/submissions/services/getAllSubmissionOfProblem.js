const ApiError = require("@entities/ApiError");
const ApiResponse = require("@entities/ApiResponse");
const prisma = require("@utils/prisma");

const getAllSubmissionOfProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const submissions = await prisma.submission.findMany({
            where: {
                problemId: id,
                userId: userId,
            },
            select: {
                id: true,
                code: true,
                language: true,
                status: true,
                createdAt: true,
                testCaseResults: {
                    select: {
                        id: true,
                        status: true,
                        testCase: {
                            select: {
                                id: true,
                                // input: true,
                                // output: true,
                                // explanation: true,
                                isHidden: true,
                                points: true,
                            },
                        },
                    },
                },
            },
        });

        return res.status(200).json(new ApiResponse(submissions, "Submissions fetched successfully"));
    } catch (error) {
        return next(
            new ApiError(
                500,
                error.message,
                error,
                `/submissions/problem/${req.params.problemId}`
            )   
        );
    }
};

module.exports = getAllSubmissionOfProblem;