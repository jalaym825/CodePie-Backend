const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const updateContest = async (req, res, next) => {
    try {
        const { title, description, startTime, endTime, isVisible } = req.data;
        const { id } = req.params;

        // Ensure the contest exists before updating
        const existingContest = await prisma.contest.findUnique({ where: { id } });
        if (!existingContest) {
            return next(new ApiError(404, "Contest not found", {}, "/contests/update"));
        }

        // if contest is live, starttime is not updatable
        const currentDate = new Date();

        if (currentDate >= new Date(existingContest.startTime)) {
            if (startTime) {
                return next(new ApiError(400, "Contest is live, start time can't be updated", {}, "/contests/update"));
            }
        }
        
        const updatedContest = await prisma.contest.update({
            where: { id },
            data: {
                title: title ?? existingContest.title,
                description: description ?? existingContest.description,
                startTime: startTime ? new Date(startTime) : existingContest.startTime,
                endTime: endTime ? new Date(endTime) : existingContest.endTime,
                isVisible: isVisible ?? existingContest.isVisible
            }
        });

        res.json(new ApiResponse(updatedContest, "Successfully updated contest"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getLeaderboard"));
    }
}
module.exports = updateContest;