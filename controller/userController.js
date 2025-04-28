const User = require("../models/user");
const crypto = require('crypto'); // For generating a token
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); 
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullname, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullname, email },
      { new: true, runValidators: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ UPDATE USER PASSWORD
exports.updateUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        
        // Validate password length
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user password
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ GET USER BY EMAIL
exports.getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select("-password"); // Exclude password from response
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ LOGOUT USER
exports.logoutUser = (req, res) => {
    res.clearCookie("token"); // Clear auth token if using cookies
    res.status(200).json({ message: "User logged out successfully" });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set token and expiration time
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

    await user.save();

    // Send the reset email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "PlotXpert - Password Reset Request",
      html: `
        <p>Hello <strong>${user.fullname}</strong>,</p>
        
        <p>We received a request to reset your password for your PlotXpert account. Please click the button below to reset your password:</p>
        
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
             style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
             Reset Password
          </a>
        </p>
        
        <p>If the button above does not work, you can also copy and paste this link into your browser:</p>
        <p>${process.env.FRONTEND_URL}/reset-password/${resetToken}</p>
        
        <p><strong>Note:</strong> This link is valid for only 1 hour. If you did not request a password reset, please ignore this email.</p>
        
        <p>For any assistance, please contact our support team at <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a>.</p>
        
        <p>Best regards,</p>
        <p><strong>The PlotXpert Team</strong></p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent:", info.response);
        return res
          .status(200)
          .json({ message: "Password reset link has been sent to your email" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate a 6-digit numeric token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // Always 6 digits

    // Set token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "PlotXpert - Password Reset Code",
      html: `
        <p>Hello <strong>${user.fullname}</strong>,</p>
        <p>You requested a password reset.</p>
        <p>Your password reset code is:</p>
        <h2 style="letter-spacing: 2px;">${resetToken}</h2>
        <p>This code will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br><strong>The PlotXpert Team</strong></p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending reset email:", err);
      } else {
        console.log("Reset email sent:", info.response);
      }
    });

    res.status(200).json({ message: "Reset code sent to email successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.completeResetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Validate inputs
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user by email and check if token matches and hasn't expired
    const user = await User.findOne({
      email,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};