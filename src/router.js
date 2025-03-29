const authController = require('./api/auth/controller');
const usersController = require('./api/user/controller');

module.exports = (app, io) => {
    app.use('/auth', authController);
    app.use('/users', usersController);
}