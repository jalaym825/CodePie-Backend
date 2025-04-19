class ApiError extends Error {
    constructor(code, message = "Something went wrong", error = {}, path = "") {
        super(error?.name?.includes("Prisma") ? "Something went wrong..." : message);
        this.code = code;
        this.error = error;
        this.path = path;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message, // ✅ Now included in `JSON.stringify()`
            error: this.error,
            path: this.path
        };
    }
}

module.exports = ApiError;
