require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const propertyRoutes = require("./routes/property");
const verificationRoutes = require("./routes/verificationRoutes");
const lawyerRoutes = require("./routes/lawyerRoutes");
const { WebSocketServer } = require("ws");

db(); // Connect to MongoDB

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/lawyers", lawyerRoutes);

// Create the HTTP server and pass the Express app to it
const server = http.createServer(app);

// Create the WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

const clients = new Map();

// Handle WebSocket connection
wss.on('connection', (ws, req) => {
  console.log("WebSocket connection established");

  // Optionally, extract userId from query parameters or headers
  const userId = req.url?.split('?userId=')[1]; // Example: Get userId from the URL query

  // If userId is missing, reject the connection
  if (!userId) {
    ws.close();
    return;
  }

  // Store the client using the userId
  clients.set(userId, ws);

  // When a message is received
  ws.on('message', async (data) => {
    const { content, receiverId, propertyId } = JSON.parse(data);

    // Save the message to the database
    const message = new Message({
      content,
      senderId: userId, // Use the actual userId of the sender
      receiverId,
      propertyId,
    });

    await message.save();

    // If the receiver is online, send the message to them
    if (clients.has(receiverId)) {
      clients.get(receiverId).send(JSON.stringify({
        content,
        senderId: userId,  // Dynamic senderId
        propertyId,
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    clients.delete(userId);  // Remove client by userId when they disconnect
  });

  // Handle WebSocket errors
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Start the HTTP server with WebSocket handling
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
