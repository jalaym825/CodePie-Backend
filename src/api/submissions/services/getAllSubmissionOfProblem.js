const ApiError = require("@entities/ApiError");
const ApiResponse = require("@entities/ApiResponse");
const prisma = require("@utils/prisma");
const { default: axios } = require("axios");

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
                submittedAt: true,
                executionTime: true,
                memoryUsed: true,
                id: true,
                languageId: true,
                // code: true,
                // language: true,
                status: true,
                // createdAt: true,
                score: true,
                // testCaseResults: {
                //     select: {
                //         id: true,
                //         status: true,
                //         testCase: {
                //             select: {
                //                 id: true,
                //                 // input: true,
                //                 // output: true,
                //                 // explanation: true,
                //                 isHidden: true,
                //                 points: true,
                //             },
                //         },
                //     },
                // },
            },
        });

        const languages = await axios.get(process.env.JUDGE0_URL + "/languages")
        submissions.map(sub => {
            sub.language = languages.data.filter(lang => lang.id === sub.languageId)[0].name
            delete sub.languageId;
            return sub;
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