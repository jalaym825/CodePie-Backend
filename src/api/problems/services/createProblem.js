const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");
const { createLogger, log } = require("winston");

const getDifficultyLevel = (level) => {
  switch (level) {
    case "EASY":
      return 1;
    case "MEDIUM":
      return 2;
    case "HARD":
      return 3;
    default:
      throw new ApiError(
        400,
        "Invalid difficulty level",
        null,
        "/problems/createProblem"
      );
  }
};

const createProblem = async (req, res, next) => {
  try {
    const {
      contestId,
      title,
      description,
      difficultyLevel,
      timeLimit,
      memoryLimit,
      points,
      isVisible,
      testCases,
    } = req.body;

    // Check if contest exists
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.json(
        new ApiError(404, "Contest not found", null, "/problems/createProblem")
      );
    }

    // Calculate distribution weight based on difficulty levels
    // Formula: (1*numEasy + 2*numMedium + 3*numHard)
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    
    testCases.forEach(tc => {
      switch(tc.difficulty || "EASY") {
        case "EASY":
          easyCount++;
          break;
        case "MEDIUM":
          mediumCount++;
          break;
        case "HARD":
          hardCount++;
          break;
      }
    });
    
    const totalWeight = easyCount + (2 * mediumCount) + (3 * hardCount);
    
    // If totalWeight is 0, default to equal distribution
    const defaultPointsPerCase = totalWeight > 0 ? points / testCases.length : points / testCases.length;
    
    const problem = await prisma.problem.create({
      data: {
        contestId,
        title,
        description,
        difficultyLevel: difficultyLevel || 1,
        timeLimit: timeLimit || 1000,
        memoryLimit: memoryLimit || 256,
        points: points || 100,
        isVisible: isVisible !== undefined ? isVisible : true,
        testCases: {
          create:
            testCases && Array.isArray(testCases)
              ? testCases.map((tc) => {
                  const difficulty = tc.difficulty || "EASY";
                  const difficultyValue = getDifficultyLevel(difficulty);
                  
                  // Calculate points for this test case:
                  // (problemPoint / totalWeight * difficultyValue)
                  let testCasePoints = totalWeight > 0 
                    ? (points / totalWeight) * difficultyValue
                    : defaultPointsPerCase;
                  
                  // Round to two decimal places
                  testCasePoints = parseFloat(testCasePoints.toFixed(2));
                  
                  return {
                    input: tc.input || "",
                    output: tc.output || "",
                    explanation: tc.explanation || null,
                    isHidden: tc.isHidden || false,
                    difficulty: difficulty,
                    points: testCasePoints,
                  };
                })
              : [
                  {
                    input: "",
                    output: "",
                    isSample: true,
                    isHidden: false,
                    points: 0,
                  },
                ],
        },
      },
      include: {
        testCases: true,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(problem, "Problem created successfully"));
  } catch (err) {
    next(new ApiError(400, err.message, err, "/problems/createProblem"));
  }
};

module.exports = createProblem;