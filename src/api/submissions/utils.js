const prisma = require("@utils/prisma")
const { processAllTestCases,processAllTestCases_batched } = require("@utils/judge0")

/**
 * Process a submission by running it against all test cases
 * @param {string} submissionId The submission ID
 * @param {Array} testCases The test cases to run
 */
async function processSubmission(submissionId, testCases, isSubmission, problemId) {
    try {
        // Get the submission details
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                problem: true
            }
        });

        if (!submission) {
            throw new Error('Submission not found');
        }

        // Update status to processing
        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: 'PROCESSING' }
        });

        // Run all test cases
        processAllTestCases_batched(
            submissionId,
            submission,
            testCases,
            isSubmission,
            problemId,
            submission.userId
        );
    } catch (error) {
        console.error('Error processing submission:', error);
        // Update submission to show an error occurred
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: 'INTERNAL_ERROR',
                judgedAt: new Date()
            }
        });

        throw error;
    }
}

/**
 * Update the user's participation score based on their best submission for each problem
 * @param {string} submissionId The submission ID to process
 */
async function updateParticipationScore(submissionId) {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            problem: {
                select: {
                    contestId: true
                }
            }
        }
    });

    if (!submission) return;

    // Get user's best score for each problem in this contest
    const bestScores = await prisma.submission.groupBy({
        by: ['problemId'],
        where: {
            userId: submission.userId,
            problem: {
                contestId: submission.problem.contestId
            }
        },
        _max: {
            score: true
        }
    });

    // Calculate total score
    const totalScore = bestScores.reduce(
        (sum, item) => sum + (item._max.score || 0),
        0
    );

    const participation = await prisma.participation.findUnique({
        where: {
            userId_contestId: {
                userId: submission.userId,
                contestId: submission.problem.contestId
            }
        },
        select: {
            totalScore: true
        }
    });
    
    if (!participation) {
        throw new Error("Participation record not found");
    }
    
    if (totalScore > participation.totalScore) {
        await prisma.participation.update({
            where: {
                userId_contestId: {
                    userId: submission.userId,
                    contestId: submission.problem.contestId
                }
            },
            data: {
                totalScore,
                scoreUpdatedAt: new Date() // Update timestamp
            }
        });
    } else {
        await prisma.participation.update({
            where: {
                userId_contestId: {
                    userId: submission.userId,
                    contestId: submission.problem.contestId
                }
            },
            data: {
                totalScore
            }
        });
    }
    
    // Update ranks for all participants in this contest
    await updateContestRanks(submission.problem.contestId);
}

/**
 * Update contest rankings for all participants
 * @param {string} contestId The contest ID
 */
async function updateContestRanks(contestId) {
    const participants = await prisma.participation.findMany({
        where: { contestId },
        orderBy: [
            { totalScore: 'desc' },
            { scoreUpdatedAt: 'asc' }
        ]
    });

    // Update ranks (Promise.all for better performance)
    await Promise.all(participants.map((participant, index) =>
        prisma.participation.update({
            where: { id: participant.id },
            data: { rank: index + 1 }
        })
    ));
}

module.exports = {
    processSubmission, updateContestRanks, updateParticipationScore
};
