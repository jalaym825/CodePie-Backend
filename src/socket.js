const socketIo = require('socket.io');

let io;
const userSockets = new Map();
const createSocketServer = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Whitelist this origin
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

const sendNotification = (userId, notification) => {
    if (userSockets.has(userId)) {
        io.to(userSockets.get(userId)).emit('receive-notification', notification);
    }
};

// Getter function for io instance
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized yet');
    }
    return io;
};

module.exports = { createSocketServer, getIo, sendNotification };
