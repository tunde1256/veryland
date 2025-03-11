const WebSocket = require('ws');
const mongoose = require('mongoose');
const Message = require('./models/message');
const { parse } = require('url');

const wss = new WebSocket.Server({ port: 4080 });

const connectedUsers = new Map();
const connectedAdminsOrLawyers = new Set();

wss.on('connection', (ws, req) => {
    console.log(`🔗 New WebSocket connection: ${req.url}`);

    // Parse URL query parameters
    const parsedUrl = parse(req.url, true);
    const { query } = parsedUrl;

    const userId = query.userId;
    const userRole = query.role || 'user'; // Default to 'user' if role is missing

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        ws.send(JSON.stringify({ error: 'Invalid or missing userId' }));
        ws.close();
        return;
    }

    connectedUsers.set(userId, ws);

    if (userRole === 'admin' || userRole === 'lawyer') {
        connectedAdminsOrLawyers.add(userId);
        console.log(`👨‍⚖️ Admin/Lawyer connected: ${userId}`);
    } else {
        console.log(`👤 User connected: ${userId}`);
    }

    console.log('📌 Active users:', Array.from(connectedUsers.keys()));

    ws.on('message', async (messageData) => {
        try {
            console.log('📩 Received raw message:', messageData);

            let parsedMessage;
            try {
                parsedMessage = JSON.parse(messageData);
            } catch (error) {
                ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
                return;
            }

            let { message, receiverId } = parsedMessage;

            if (!receiverId) {
                if (connectedAdminsOrLawyers.size > 0) {
                    receiverId = Array.from(connectedAdminsOrLawyers)[0];
                    console.log(`🔄 Assigned Admin/Lawyer: ${receiverId}`);
                } else {
                    ws.send(JSON.stringify({ error: 'No admin or lawyer available' }));
                    return;
                }
            }

            if (!mongoose.Types.ObjectId.isValid(receiverId)) {
                ws.send(JSON.stringify({ error: 'Invalid receiverId' }));
                return;
            }

            const newMessage = new Message({
                senderId: new mongoose.Types.ObjectId(userId),
                receiverId: new mongoose.Types.ObjectId(receiverId),
                message,
                timestamp: new Date()
            });

            await newMessage.save();
            console.log(`💾 Message saved: From ${userId} to ${receiverId}`);

            const receiverSocket = connectedUsers.get(receiverId);

            console.log(`📡 Checking receiver (${receiverId}):`, receiverSocket ? 'Connected' : 'Not Connected');

            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                receiverSocket.send(JSON.stringify({
                    senderId: userId,
                    message,
                    timestamp: newMessage.timestamp
                }));
                console.log(`📤 Message sent to receiver (${receiverId})`);
            } else {
                console.log(`⚠️ Receiver ${receiverId} not online.`);
            }

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    senderId: userId,
                    message,
                    timestamp: newMessage.timestamp,
                    selfMessage: true
                }));
            }

        } catch (error) {
            console.error('❌ Error processing message:', error);
            ws.send(JSON.stringify({ error: 'Error processing message' }));
        }
    });

    ws.on('close', () => {
        console.log(`❌ User disconnected: ${userId}`);
        connectedUsers.delete(userId);
        connectedAdminsOrLawyers.delete(userId);
    });

    ws.on('error', (err) => {
        console.error(`⚠️ WebSocket error for user ${userId}:`, err);
    });

});

console.log('🚀 WebSocket server running on ws://localhost:4080');
