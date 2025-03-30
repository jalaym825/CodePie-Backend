const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
module.exports = async (req, res, next) => {
    try {
        const {title, description, startTime, endTime, isVisible} = req.body;

        // Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return res.status(400).json(new ApiError(400, "End time must be after start time", {}, "/contests/create"));
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

        res.status(201).json(contest);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}