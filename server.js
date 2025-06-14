require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const mongoose = require("mongoose");
const Message = require("./models/message");
const db = require("./config/db");
const stripeRoutes = require("./routes/stripeRoutes");
const expressSession = require("express-session"); // Add this near the top
const rateLimit = require("express-rate-limit");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const propertyRoutes = require("./routes/property");
const verificationRoutes = require("./routes/verificationRoutes");
const lawyerRoutes = require("./routes/lawyerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Connect to MongoDB
db();

const app = express();

// Define CORS options (Allow any origin)
const corsOptions = {
  origin: "*", // Allow any origin (including any port)
  methods: ["GET", "POST"], // Specify allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  credentials: true, // Allow cookies and other credentials
};

// Use CORS middleware with options
app.use(cors(corsOptions));

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || "keyboard_cat", // Use a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000, // 1 hour
      secure: false, // Set to true if you're using HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);
// Middleware
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/payments", paymentRoutes);

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

const clients = new Map(); // Stores multiple connections per user
const adminsAndLawyers = new Set(); // Track all connected admins and lawyers

wss.on("connection", async (ws, req) => {
  console.log("🔗 New WebSocket connection:", req.url);

  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const userId = urlParams.get("userId");
  const role = urlParams.get("role") || "user"; // Default role is 'user'

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    ws.send(JSON.stringify({ error: "Invalid or missing userId" }));
    ws.close();
    return;
  }

  // Store multiple WebSocket connections per user
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(ws);

  console.log(`✅ ${role.toUpperCase()} connected: ${userId}`);
  console.log("📌 Active users:", Array.from(clients.keys()));

  // If user is an admin or lawyer, add them to the broadcaster set
  if (role === "admin" || role === "lawyer") {
    adminsAndLawyers.add(userId);
  }

  // Send any pending messages for the user
  try {
    const pendingMessages = await Message.find({ receiverId: userId }).sort({
      timestamp: 1,
    });
    pendingMessages.forEach((msg) => {
      ws.send(
        JSON.stringify({
          senderId: msg.senderId,
          content: msg.content,
          propertyId: msg.propertyId,
          timestamp: msg.timestamp,
        })
      );
    });

    console.log(
      `📥 Sent ${pendingMessages.length} pending messages to ${role} (${userId})`
    );
  } catch (error) {
    console.error("❌ Error fetching pending messages:", error);
  }

  ws.on("message", async (data) => {
    try {
      console.log("📩 Received message:", data);

      const { content, receiverId, propertyId } = JSON.parse(data);

      if (!content) {
        ws.send(JSON.stringify({ error: "Message content cannot be empty" }));
        return;
      }

      const message = new Message({
        content,
        senderId: userId,
        receiverId: receiverId || null, // Store receiver if specified
        propertyId,
        timestamp: new Date(),
      });

      await message.save();
      console.log(
        `💾 Message saved: From ${userId} to ${
          receiverId || "ALL ADMINS & LAWYERS"
        }`
      );

      // Broadcast to all connected admins and lawyers
      if (!receiverId) {
        adminsAndLawyers.forEach((adminLawyerId) => {
          if (clients.has(adminLawyerId)) {
            clients.get(adminLawyerId).forEach((client) => {
              client.send(
                JSON.stringify({
                  senderId: userId,
                  content,
                  propertyId,
                  timestamp: message.timestamp,
                })
              );
            });
          }
        });
        console.log(`📢 Message broadcasted to all admins and lawyers`);
      } else {
        // Send message to specific receiver
        if (clients.has(receiverId)) {
          clients.get(receiverId).forEach((client) => {
            client.send(
              JSON.stringify({
                senderId: userId,
                content,
                propertyId,
                timestamp: message.timestamp,
              })
            );
          });
          console.log(`📤 Message sent to receiver (${receiverId})`);
        } else {
          console.log(`⚠️ Receiver ${receiverId} is not online.`);
        }
      }

      // Send confirmation to sender
      ws.send(
        JSON.stringify({
          senderId: userId,
          content,
          timestamp: message.timestamp,
          selfMessage: true,
        })
      );
    } catch (error) {
      console.error("❌ Error processing message:", error);
      ws.send(JSON.stringify({ error: "Error processing message" }));
    }
  });

  ws.on("close", () => {
    console.log(`❌ User disconnected: ${userId}`);

    if (clients.has(userId)) {
      clients.get(userId).delete(ws);
      if (clients.get(userId).size === 0) {
        clients.delete(userId);
      }
    }

    // Remove user from broadcaster set if they disconnect
    adminsAndLawyers.delete(userId);
  });

  ws.on("error", (err) => {
    console.error(`⚠️ WebSocket error for user ${userId}:`, err);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
const cron = require("node-cron");

cron.schedule("0 0 * * *", async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await Message.deleteMany({
      timestamp: { $lt: threeDaysAgo },
    });
    console.log(`🗑️ Cron Job: Deleted ${result.deletedCount} old messages.`);
  } catch (error) {
    console.error("❌ Error deleting old messages:", error);
  }
});

console.log("⏳ Message deletion job scheduled to run daily at midnight.");

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server running on ws://localhost:${PORT}`);
});
