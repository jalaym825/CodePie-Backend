const socketIo = require('socket.io');

let io;
const userSockets = new Map();
const createSocketServer = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173', // Whitelist this origin
            methods: ['GET', 'POST'],       // Allowed HTTP methods
            credentials: true               // Allow credentials (cookies, authorization headers, etc.)
        }
    });

    io.on('connection', (socket) => {
        socket.on('register', (userId) => {
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} connected with socket ID ${socket.id}`);
        });

        socket.on('disconnect', () => {
            userSockets.forEach((id, user) => {
                if (id === socket.id) {
                    userSockets.delete(user);
                }
            });
        });
    });
};

// Getter function for io instance
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized yet');
    }
    return io;
};

const sendTestCaseResult = (userId, result) => {
    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit('submissionResult', result);
    } else {
        console.log(`No socket found for user ${userId}`);
    }
};

module.exports = { createSocketServer, getIo, userSockets, sendTestCaseResult };
