const prisma = require("@utils/prisma");
const jwt = require("jsonwebtoken");
const ApiError = require("@entities/ApiError");

const extractUser = async (req, res, next) => {
  const token = req.cookies?.access_token || req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return next();
  }
  try {
    let payload;
    try {
      payload = jwt.verify(token,process.env.JWT_SECRET)
    } catch (error) {
      return next();
    }
    if (!payload.userId) {
      return next();
    }
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      }
    });
    delete user?.password;
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(500, error.message, error, "/middleware/extractUser"));
  }
}
module.exports = extractUser;