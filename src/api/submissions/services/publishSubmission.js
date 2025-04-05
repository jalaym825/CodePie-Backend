const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");
const { createLogger, log } = require("winston");

const publishSubmission = async (req, res, next) => {
  try {
    const { submissionId, problemId } = req.body;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
        problem: {
          id: problemId,
          isPractice: true,
        },
      },
    });

    if (!submission) {
      return next(
        new ApiError(
          404,
          "Submission not found",
          null,
          "/submissions/publishSubmission"
        )
      );
    }

    // Publish the submission
    const publishedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { isPublished: true },
    });

    return res.json(
      new ApiResponse(publishedSubmission, "Submission published successfully")
    );
  } catch (error) {
    return next(
      new ApiError(500, error.message, error, "/submissions/publishSubmission")
    );
  }
};

module.exports = publishSubmission;
