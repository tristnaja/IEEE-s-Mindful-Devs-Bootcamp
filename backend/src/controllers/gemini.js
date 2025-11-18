
const geminiService = require('../services/gemini');

/**
 * Controller to send a message and get a response from the Gemini model.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const sendMessage = async (req, res) => {
    try {
        const { userId, conversationId, text } = req.body;

        if (!userId || !conversationId || !text) {
            return res.status(400).json({ message: 'userId, conversationId, and text are required' });
        }

        const modelResponse = await geminiService.sendMessage(userId, conversationId, text);
        res.status(200).json({ response: modelResponse });
    } catch (error) {
        console.error('Error in sendMessage controller:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

/**
 * Controller to load all conversations for a user.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const loadConversations = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const conversations = await geminiService.loadConversations(userId);
        res.status(200).json({ conversations });
    } catch (error) {
        console.error('Error in loadConversations controller:', error);
        res.status(500).json({ message: 'Failed to load conversations' });
    }
};

module.exports = {
    sendMessage,
    loadConversations,
};
