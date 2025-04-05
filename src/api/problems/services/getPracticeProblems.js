const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getPracticeProblems = async (req, res, next) => {
  try {
    const problems = await prisma.problem.findMany({
      where: {
        isPractice: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficultyLevel: true,
        timeLimit: true,
        memoryLimit: true,
        points: true,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(problems, "Problems fetched successfully"));
  } catch (error) {
    console.log(error);
    next(new ApiError(500, error.message, error, "/problems/practice/"));
  }
};

module.exports = getPracticeProblems;