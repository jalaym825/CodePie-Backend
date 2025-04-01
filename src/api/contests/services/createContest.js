const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const createContest = async (req, res, next) => {
    try {
        const {title, description, startTime, endTime, isVisible} = req.body;

        // Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return next(new ApiError(400, "End time must be after start time", {}, "/contests/create"));
        }

        const contest = await prisma.contest.create({
            data: {
                title,
                description,
                startTime: start,
                endTime: end,
                isVisible: isVisible !== undefined ? isVisible : false
            }
        });

        res.status(201).json(new ApiResponse(contest, "Contest created successfully"));
    } catch (error) {
        next(new ApiError(500, "Couldn't create contest", error, "/contests/create"));
    }
}

module.exports = createContest;