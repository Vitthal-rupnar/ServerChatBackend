const User = require('../models/UserModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Function to send OTP via Ethernal Email
const sendEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS,
            },
        });
        // console.log("Ethereal User:", process.env.ETHEREAL_USER);
        // console.log("Ethereal Pass:", process.env.ETHEREAL_PASS);
        
        const info = await transporter.sendMail({
            from: '"ChatApp Support" <support@chatapp.com>',
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}`,
        });
        console.log("Email sent: ", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.log("Error sending email: ", error);
    }
};

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Forgot Password Handler
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP and expiry
        user.otp = hashedOTP;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail(email, otp);
        res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Verify OTP Handler
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "All fields required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (Date.now() > user.otpExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

        user.otp = null;
        user.otpExpiry = null;
        user.isVerified = true;
        await user.save();

        res.status(200).json({ message: "OTP verified. You can now reset your password." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reset Password Handler
exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "All fields required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.isVerified) {
            return res.status(400).json({ message: "OTP not verified" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isVerified = false; // Reset verification for next time
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
