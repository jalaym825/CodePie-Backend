class ApiError {
    constructor(code, message = "Something went wrong", error = {}, path = "") {
        this.code = code;
        this.message = message;
        this.error = error;
        this.path = path;
    }
}

module.exports = ApiError;