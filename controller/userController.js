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

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate a secure 6-digit numeric token using crypto
    const buffer = crypto.randomBytes(4); // 4 bytes gives us up to ~4 billion
    const randomNumber = buffer.readUInt32BE(0); // Read as a 32-bit unsigned integer
    const resetToken = (randomNumber % 900000 + 100000).toString(); // Ensures it's between 100000–999999

    // Save token and expiry on user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity

    await user.save();

    // Setup email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PlotXpert Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'PlotXpert - Password Reset Code',
      html: `
        <p>Hello <strong>${user.fullname || 'User'}</strong>,</p>
        <p>You requested a password reset.</p>
        <p>Your password reset code is:</p>
        <h2 style="letter-spacing: 2px;">${resetToken}</h2>
        <p>This code will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br><strong>The PlotXpert Team</strong></p>
      `,
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending reset email:', err);
        return res.status(500).json({ message: 'Failed to send reset email' });
      }

      console.log('Reset email sent:', info.response);
      return res.status(200).json({ message: 'Reset code sent to email successfully' });
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { resetToken } = req.body;

    if (!resetToken) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // ✅ Set the session userId
    req.session.userId = user._id;

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.completeResetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Both password fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Optional: clear the session
    req.session.userId = null;

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

