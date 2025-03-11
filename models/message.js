// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming 'User' model exists
   
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming 'User' model exists
    
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property', // Assuming 'Property' model exists
  
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: { type: Boolean, default: false }  // Read receipt
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
