const Notification = require("../models/Notification");

// Function to create a new notification
const createNotification = async (userId, message, type = "info") => {
  try {
    const notification = new Notification({ userId, message, type });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Function to fetch user notifications
const getUserNotifications = async (userId) => {
  try {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

// Function to mark notifications as read
const markAsRead = async (notificationId) => {
  try {
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  } catch (error) {
    console.error("Error updating notification:", error);
  }
};

module.exports = { createNotification, getUserNotifications, markAsRead };
