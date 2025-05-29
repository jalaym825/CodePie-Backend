const prisma = require("@utils/prisma")
const { sendTestCaseResult } = require('../../../socket');
const { updateContestRanks } = require("../utils");

const submissionCallback = async (req, res, next) => {
    try {
        
        const { stdout, time, memory, stderr, compile_output, message, status } = req.body;
        const { userId, isSubmission, problemId, testCaseId, submissionId } = req.query;

        // Convert Judge0 status to application TestCaseStatus
        let testCaseStatus;
        let passed = false;

        // Map Judge0 status codes to your application's TestCaseStatus enum
        switch (status.id) {
            case 1: // In Queue
                testCaseStatus = "IN_QUEUE";
                break;
            case 2: // Processing
                testCaseStatus = "PROCESSING";
                break;
            case 3: // Accepted
                testCaseStatus = "ACCEPTED";
                passed = true;
                break;
            case 4: // Wrong Answer
                testCaseStatus = "WRONG_ANSWER";
                break;
            case 5: // Time Limit Exceeded
                testCaseStatus = "TIME_LIMIT_EXCEEDED";
                break;
            case 6: // Compilation Error
                testCaseStatus = "COMPILATION_ERROR";
                break;
            case 7: // Runtime Error (SIGSEGV)
            case 8: // Runtime Error (SIGXFSZ)
            case 9: // Runtime Error (SIGFPE)
            case 10: // Runtime Error (SIGABRT)
            case 11: // Runtime Error (NZEC)
            case 12: // Runtime Error (Other)
                testCaseStatus = "RUNTIME_ERROR";
                break;
            case 13: // Internal Error
                testCaseStatus = "INTERNAL_ERROR";
                break;
            case 14: // Exec Format Error
                testCaseStatus = "EXEC_FORMAT_ERROR";
                break;
            default:
                testCaseStatus = "INTERNAL_ERROR";
        }

        const result = {
            stdout: stdout ? Buffer.from(stdout, 'base64').toString() : '',
            time,
            memory,
            stderr: stderr ? Buffer.from(stderr, 'base64').toString() : '',
            compile_output: compile_output ? Buffer.from(compile_output, 'base64').toString() : '',
            message: message ? Buffer.from(message, 'base64').toString() : '',
            testCaseId,
            status: testCaseStatus
        };

        console.log(result)

        const problem = await prisma.problem.findUnique({
            where: {
                id: problemId
            },
            include: {
                contest: true,
            }
        })
        const testCase = await prisma.testCase.findUnique({
            where: {
                id: testCaseId
            }
        })
        const resToSend = {...result};
        if(problem.contest && testCase && testCase.isHidden) {
            if(problem.contest.startTime <= Date.now() && problem.contest.endTime >= Date.now()) {
                delete resToSend.stdout;
                delete resToSend.stderr;
            }
        }
        sendTestCaseResult(userId, resToSend);

        if (isSubmission === 'true') {
            try {
                // Update the existing test case result instead of creating a new one
                await prisma.testCaseResult.update({
                    where: {
                        submissionId_testCaseId: {
                            submissionId,
                            testCaseId
                        }
                    },
                    data: {
                        status: testCaseStatus,
                        executionTime: time ? Math.round(time * 1000) : null, // Convert to milliseconds
                        memoryUsed: memory ? Math.round(memory) : null, // Memory in kilobytes
                        stdout: result.stdout,
                        stderr: result.stderr,
                        passed: passed
                    }
                });

                // Check if all test cases have been processed
                const submission = await prisma.submission.findUnique({
                    where: { id: submissionId },
                    include: {
                        testCaseResults: true,
                        problem: {
                            include: {
                                testCases: {
                                    where: {isHidden: true}
                                }
                            }
                        }
                    }
                });

                const allTestCases = submission.problem.testCases;
                const processedTestCases = submission.testCaseResults.filter(
                    tcr => tcr.status !== "PROCESSING" && tcr.status !== "IN_QUEUE"
                ).length;

                // If all test cases are processed, update submission status
                if (processedTestCases === allTestCases.length) {
                    // Calculate total score
                    let totalScore = 0;
                    for (const result of submission.testCaseResults) {
                        if (result.passed) {
                            const tc = allTestCases.find(tc => tc.id === result.testCaseId);
                            totalScore += tc ? tc.points : 0;
                        }
                    }
                    // Determine overall submission status
                    let overallStatus;
                    const allPassed = submission.testCaseResults.every(result => result.passed);

                    if (allPassed) {
                        overallStatus = "ACCEPTED";
                    } else if (submission.testCaseResults.some(r => r.status === "COMPILATION_ERROR")) {
                        overallStatus = "COMPILATION_ERROR";
                    } else if (submission.testCaseResults.some(r => r.status === "RUNTIME_ERROR")) {
                        overallStatus = "RUNTIME_ERROR";
                    } else if (submission.testCaseResults.some(r => r.status === "TIME_LIMIT_EXCEEDED")) {
                        overallStatus = "TIME_LIMIT_EXCEEDED";
                    } else if (submission.testCaseResults.some(r => r.status === "MEMORY_LIMIT_EXCEEDED")) {
                        overallStatus = "MEMORY_LIMIT_EXCEEDED";
                    } else {
                        overallStatus = "WRONG_ANSWER";
                    }

                    // Update submission record
                    await prisma.submission.update({
                        where: { id: submissionId },
                        data: {
                            status: overallStatus,
                            score: totalScore,
                            judgedAt: new Date(),
                            executionTime: Math.max(...submission.testCaseResults.map(r => r.executionTime || 0)),
                            memoryUsed: Math.max(...submission.testCaseResults.map(r => r.memoryUsed || 0)),
                            compilationOutput: result.compile_output || null
                        }
                    });

                    // Update participation score if this is during a contest
                    const problem = await prisma.problem.findUnique({
                        where: { id: problemId },
                        include: { contest: true }
                    });

                    // contest must be live to update participation score
                    if (problem && problem.contest && problem.contest.startTime <= new Date() && problem.contest.endTime >= new Date()) {
                        const participation = await prisma.participation.findUnique({
                            where: {
                                userId_contestId: {
                                    userId,
                                    contestId: problem.contestId
                                }
                            }
                        });

                        if (participation) {
                            // Calculate new total score for participation
                            const userSubmissions = await prisma.submission.findMany({
                                where: {
                                    userId,
                                    problem: {
                                        contestId: problem.contestId
                                    }
                                },
                                include: {
                                    problem: true
                                }
                            });

                            // Group by problem and get max score for each
                            const problemScores = {};
                            for (const sub of userSubmissions) {
                                if (!problemScores[sub.problemId] || sub.score > problemScores[sub.problemId]) {
                                    problemScores[sub.problemId] = sub.score;
                                }
                            }

                            let totalParticipationScore = Object.values(problemScores).reduce((sum, score) => sum + score, 0);

                            // Update participation record
                            await prisma.participation.update({
                                where: {
                                    id: participation.id
                                },
                                data: {
                                    totalScore: overallStatus === "ACCEPTED" ? problem.points : totalParticipationScore,
                                    scoreUpdatedAt: new Date()
                                }
                            });

                            // if old score is different from new score, update the leaderboard
                            updateContestRanks(problem.contestId)
                        }
                    }

                    // Notifying the user about the result via websocket
                    const userSockets = req.app.get('userSockets') || {};
                    const userSocket = userSockets[userId];
                    if (userSocket) {
                        userSocket.emit('submissionResult', {
                            submissionId,
                            status: overallStatus,
                            score: totalScore,
                            results: submission.testCaseResults
                        });
                    }
                }
            } catch (error) {
                console.error("Error processing submission callback:", error);
                // Don't return error to Judge0, just log it
            }
        }

        // Always return success to Judge0
        res.status(200).json({ message: 'Callback received' });
    } catch (error) {
        console.error("Error in submission callback:", error);
    }
}

module.exports = submissionCallback