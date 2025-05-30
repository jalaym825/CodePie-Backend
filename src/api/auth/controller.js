const router = require('express').Router();
const register = require('./services/register');
const zodValidator = require("@middlewares/zodValidator");
const registerDto = require("./dtos/register-dto")
const loginDto = require("./dtos/login-dto");
const login = require("./services/login");
const getMe = require("./services/getMe");
const isAuthenticated = require('@middlewares/isAuthenticated');
const googleCallback = require('./services/googleCallback');

router.post('/register', zodValidator(registerDto), register);
router.post('/login', zodValidator(loginDto), login);
router.get('/me', isAuthenticated, getMe);
router.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.status(200).json({ message: 'Logged out successfully' });
})
router.get('/google-callback', googleCallback)

module.exports = router;