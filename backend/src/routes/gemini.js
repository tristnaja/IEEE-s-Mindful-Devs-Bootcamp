const express = require('express');
const geminiController = require('../controllers/gemini');

const router = express.Router();

// Route to send a message to the Gemini model
router.post('/send-message', geminiController.sendMessage);

// Route to load all conversations for a user
router.get('/load-conversations', geminiController.loadConversations);

module.exports = router;
