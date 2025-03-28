const UserModel = require("../models/UserModel")
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function checkPassword(request, response) {
    try {
        const { password, userId } = request.body;

        if (!password || !userId) {
            return response.status(400).json({ 
                message: "Password and User ID are required", 
                error: true 
            });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return response.status(404).json({ 
                message: "User not found", 
                error: true 
            });
        }

        const verifyPassword = await bcryptjs.compare(password, user.password);

        if (!verifyPassword) {
            return response.status(400).json({
                message: "Incorrect password",
                error: true,
            });
        }

        const tokenData = {
            id: user._id,
            email: user.email,
        };
        const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: '10d' });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        };

        // Send token both in cookie and response
        response.cookie('token', token, cookieOptions);

        return response.status(200).json({
            message: "Login successful",
            token: token,
            success: true,
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
        });
    }
}

module.exports = checkPassword;
