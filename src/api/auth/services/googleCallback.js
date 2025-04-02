const ApiError = require("@entities/ApiError");
const prisma = require('@utils/prisma');
const jwt = require('jsonwebtoken');
const axios = require("axios");

const googleCallback = async (req, res, next) => {
    try {
        const state = req.query.state
            ? JSON.parse(decodeURIComponent(req.query.state))
            : {};

        if (!req.query.code) {
            return res.redirect(`${process.env.FRONTEND_URL}`);
        }
        const { user } = await authenticateGoogleLogin(req.query.code);
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}`);
        }
        const data = await googleLogin(user);

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('access_token', data.access_token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: isProduction,
            path: '/',
            sameSite: 'strict',
        });

        res.redirect(`${process.env.FRONTEND_URL}${state.from || '/'}`);
    } catch (error) {
        next(new ApiError(500, "Couldn't join the contest", error, "auth/googleCallback"))
    }
}

const authenticateGoogleLogin = async (code) => {
    const { data: tokenResponse } = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.BACKEND_URL}/auth/google-callback`, // Must match the one used in frontend
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    // Fetch user info using the access token
    const { data: userData } = await axios.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
            },
        }
    );

    // Your logic to handle user data (e.g., create or find user in database)
    return {
        access_token: tokenResponse.access_token,
        user: userData,
    };
}

const googleLogin = async (googleUser) => {
    if (!googleUser) {
        throw new UnauthorizedException('Error in retrieving user from google');
    }

    let user = await prisma.user.findUnique({
        where: {
            email: googleUser.email
        }
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: googleUser.email,
                name: googleUser.name,
                isVerified: true,
                isPasswordSet: false,
                password: crypto.randomUUID()
            }
        });
    }
    const access_token = signToken(user.sys_id, user.email);
    return {
        message: 'User information from google',
        user,
        access_token
    };
}


const signToken = async (
    userId,
    email,
) => {
    const data = {
        userId,
        email,
    };
    return jwt.sign(data, process.env.JWT_SECRET)
}

module.exports = googleCallback;