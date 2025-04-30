const jwt = require('jsonwebtoken');

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

    // Generate temporary JWT token for password reset (expires in 10 minutes)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({ message: "Token is valid", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
