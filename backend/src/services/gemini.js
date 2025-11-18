const mongoose = require('mongoose');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require('@google/generative-ai');
const Conversation = require('../models/conversation');
const User = require('../models/user');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Sends a message to the Gemini model, saves the conversation, and returns the response.
 * @param {string} userId - The ID of the user.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} text - The user's message.
 * @returns {Promise<string>} The model's generated response.
 */
const sendMessage = async (userId, conversationId, text) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
    }

    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
        // Ensure the user exists before creating a conversation
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        conversation = new Conversation({ userId, conversationId, messages: [] });
    }

    // Add user message to history
    conversation.messages.push({ role: 'user', text });

    // Format history for the Gemini API
    const history = conversation.messages.map(msg => ({
        role: msg.role === 'ai' ? 'model' : msg.role,
        parts: [{ text: msg.text }],
    })).slice(0, -1); // Exclude the latest user message from history for the API call

    const chat = model.startChat({ history, safetySettings });
    const result = await chat.sendMessage(text);
    const response = await result.response;
    const modelText = response.text();

    // Add model response to history
    conversation.messages.push({ role: 'model', text: modelText });

    await conversation.save();

    return modelText;
};

/**
 * Loads all conversations for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} A list of conversations.
 */
const loadConversations = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
    }
    const conversations = await Conversation.find({ userId }).sort({ 'messages.timestamp': -1 });
    return conversations;
};

module.exports = {
    sendMessage,
    loadConversations,
};
