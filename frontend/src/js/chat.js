document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.querySelector('.chat-area');
    const chatInput = document.querySelector('.chat-input-box input');
    const chatForm = document.querySelector('.chat-input-box');
    const logoutButton = document.getElementById('logout-button');

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user._id) {
        window.location.href = 'login.html';
        return;
    }

    let conversationId = `conv_${Date.now()}`; // Simple unique ID for new conversations

    const displayMessage = (text, role) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${role}-bubble`);
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const showLoadingIndicator = () => {
        const loadingBubble = document.createElement('div');
        loadingBubble.classList.add('message', 'ai-bubble', 'loading-indicator');
        loadingBubble.innerHTML = '<p>...</p>';
        chatArea.appendChild(loadingBubble);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const hideLoadingIndicator = () => {
        const indicator = document.querySelector('.loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    };

    const sendMessage = async (text) => {
        displayMessage(text, 'user');
        showLoadingIndicator();

        try {
            const response = await fetch('http://localhost:3000/api/gemini/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    conversationId,
                    text,
                }),
            });

            hideLoadingIndicator();

            if (!response.ok) {
                throw new Error('Failed to get a response from the bot.');
            }

            const data = await response.json();
            displayMessage(data.response, 'ai');
        } catch (error) {
            hideLoadingIndicator();
            console.error('Send message error:', error);
            // Assuming you have a showToast function available
            if (window.showToast) {
                showToast(error.message, 'error');
            }
        }
    };

    const loadConversations = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/gemini/load-conversations?userId=${user._id}`);
            if (!response.ok) {
                throw new Error('Failed to load conversation history.');
            }
            const data = await response.json();

            if (data.conversations && data.conversations.length > 0) {
                // For simplicity, load the latest conversation
                const latestConversation = data.conversations[0];
                conversationId = latestConversation.conversationId;
                chatArea.innerHTML = ''; // Clear static messages
                latestConversation.messages.forEach(msg => {
                    displayMessage(msg.text, msg.role);
                });
            } else {
                // No history, start a new conversation
                chatArea.innerHTML = '';
                displayMessage('Hello! How can I help you today?', 'ai');
            }
        } catch (error) {
            console.error('Load conversations error:', error);
            chatArea.innerHTML = ''; // Clear static messages even on error
            displayMessage('Hello! How can I help you today?', 'ai');
            if (window.showToast) {
                showToast(error.message, 'error');
            }
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            sendMessage(text);
            chatInput.value = '';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            if (window.showToast) {
                showToast('You have been logged out.', 'success');
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }

    // Initial load
    loadConversations();
});
