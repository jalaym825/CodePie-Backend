const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getAllProblems = async (req, res, next) => {
    try {
        const isAdminUser = req.user?.role === 'ADMIN';

        const problems = await prisma.problem.findMany({
            where: {
                isVisible: isAdminUser ? undefined : true
            },
            include: {
                contest: {
                    select: {
                        title: true,
                        startTime: true,
                        endTime: true
                    }
                }
            }
        });

        res.json(new ApiResponse(problems, "Problems fetched successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/getAllProblems'));
    }
};

module.exports = getAllProblems;
