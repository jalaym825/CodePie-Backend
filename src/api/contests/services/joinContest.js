const ApiError = require("@entities/ApiError");
const ApiResponse = require("@entities/ApiResponse");
const prisma = require('@utils/prisma');

module.exports = async (req, res, next) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;

        // Check if contest exists and is visible
        const contest = await prisma.contest.findUnique({
            where: {
                id, isVisible: true
            }
        });

        if (!contest) {
            next(new ApiError(404, "Contest not found", {}, "contests/joinContest"))
        }

        // Check if contest has started
        const now = new Date();
        if (now < contest.startTime) {
            next(new ApiError(404, "Contest has not started yet", {}, "contests/joinContest"))
        }

        // Check if contest has ended
        if (now > contest.endTime) {
            next(new ApiError(404, "Contest has already ended", {}, "contests/joinContest"))
        }

        // Check if user is already participating
        const existingParticipation = await prisma.participation.findUnique({
            where: {
                userId_contestId: {
                    userId, contestId: id
                }
            }
        });

        if (existingParticipation) {
            return res.status(400).json({error: 'Already participating in this contest'});
        }

        // Create participation
        const participation = await prisma.participation.create({
            data: {
                userId, contestId: id
            }
        });

        res.status(201).json(new ApiResponse(participation, "Successfully participated in contest"));
    } catch (error) {
        next(new ApiError(500, "Coudn't join the contest", error, "contests/joinContest"))
    }
}