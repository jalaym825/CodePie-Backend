const ApiError = require("@entities/ApiError");
const ApiResponse = require("@entities/ApiResponse");
const prisma = require("@utils/prisma");
const { processSubmission } = require("../utils");
const axios = require("axios");

const createSubmission = async (req, res, next) => {
  try {
    const { problemId, languageId, sourceCode } = req.body;
    const userId = req.user.id;

    // Check if problem exists and is visible
    const problem = await prisma.problem.findUnique({
      where: {
        id: problemId,
      },
      include: {
        contest: true,
        testCases: {
          where: {
            isHidden: true,
          }
        },
      },
    });

    if (!problem) {
      return next(new ApiError(404, "Problem not found", null, "/submissions"));
    }

    // Check if the contest is active
    // if (!problem.isPractice) {
    //   const now = new Date();
    //   if (now < problem.contest.startTime || now > problem.contest.endTime) {
    //     return next(
    //       new ApiError(400, "Contest is not active", null, "/submissions")
    //     );
    //   }
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

    // Create the submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        languageId: parseInt(languageId),
        sourceCode,
        status: "IN_QUEUE",
      },
    });

    // Process submission asynchronously
    // In production, you should use a proper queue system like Bull
    processSubmission(submission.id, problem.testCases, true, problem.id).catch(
      (err) => console.error("Error processing submission:", err)
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          { id: submission.id, status: submission.status },
          "Submission created successfully"
        )
      );
  } catch (error) {
    return next(new ApiError(500, error.message, error, "/submissions/createSubmission"));
  }
};

module.exports = createSubmission;
