const http = require('http');
const WebSocket = require('ws');
const Message = require('./models/message'); // Assuming you have a Message model

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Server is running');
});

// Create WebSocket server and bind it to the HTTP server
const wss = new WebSocket.Server({ server });

// Store clients by their userId
const clients = new Map();

// Handle WebSocket connection
wss.on('connection', (ws, req) => {
  console.log("WebSocket connection established");

  // Extract userId from the query string
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const userId = urlParams.get('userId'); // Extract userId from the query parameter

  // If userId is missing, close the connection
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

// Handle upgrade request (WebSocket handshake)
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// Start the HTTP server
server.listen(4070, () => {
  console.log('Server is listening on port 4070');
});

module.exports = { wss, server };
