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

    const formatMessage = (text) => {
        // Basic security: escape HTML to prevent XSS, then apply formatting.
        const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 1. Bold: **text** -> <strong>text</strong>
        const boldedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 2. Lists: * item -> • item
        const listedText = boldedText.replace(/^\* (.*$)/gim, '&bull; $1');

        // 3. Newlines: \n -> <br>
        return listedText.replace(/\n/g, '<br>');
    };

    const displayMessage = (text, role) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${role}-bubble`);
        const p = document.createElement('p');

        if (role === 'user') {
            p.textContent = text;
        } else {
            p.innerHTML = formatMessage(text);
        }

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
                const latestConversation = data.conversations[0];
                conversationId = latestConversation.conversationId;
                chatArea.innerHTML = ''; // Clear static messages
                latestConversation.messages.forEach(msg => {
                    displayMessage(msg.text, msg.role === 'model' ? 'ai' : 'user');
                });
            } else {
                chatArea.innerHTML = '';
                displayMessage('Hello! How can I help you today?', 'ai');
            }
        } catch (error) {
            console.error('Load conversations error:', error);
            chatArea.innerHTML = '';
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

    loadConversations();
});
