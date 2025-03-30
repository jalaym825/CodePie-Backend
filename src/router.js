const authController = require('./api/auth/controller');
const usersController = require('./api/user/controller');
const contestsController = require('./api/contests/controller');
const problemsController = require('./api/problems/controller');
const submissionsController = require('./api/submissions/controller');

module.exports = (app, io) => {
    app.use('/auth', authController);
    app.use('/users', usersController);
    app.use('/contests', contestsController);
    app.use('/problems', problemsController);
    app.use('/submissions', submissionsController);
}