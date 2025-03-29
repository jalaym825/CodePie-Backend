class ApiResponse {
  constructor(code, data, message = "Success") {
    this.code = code;
    this.data = data;
    this.message = message;
  }
}

module.exports = ApiResponse;