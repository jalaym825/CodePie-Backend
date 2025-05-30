require("module-alias/register");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const router = require("./router");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cookieParser = require("cookie-parser");
const http = require("http");
const { createSocketServer } = require("./socket");
const ollama = require("@utils/ollama");
const extractUser = require("@middlewares/extractUser");

dotenv.config();

const app = express();
const server = http.createServer(app);
createSocketServer(server);

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(helmet());
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposedHeaders: ["Content-Disposition", "Content-Type"],
}));

// app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

// ollama.preloadModel().then(() => {
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    app.use(extractUser);
    router(app);
    app.use(errorMiddleware);
});
// })
