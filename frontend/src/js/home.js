
document.addEventListener('DOMContentLoaded', () => {
    const userNameSpan = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');
    const chatButton = document.getElementById('chat-button');

    // 1. Auth Guard and Initial Setup
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.email) {
        window.location.href = 'login.html';
        return; // Stop script execution
    }

    // Immediately display the name from localStorage for a better user experience
    userNameSpan.textContent = user.name || 'User';

    // 2. Fetch Full Profile
    const fetchProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/auth/profile?email=${user.email}`);
            
            if (response.status === 200) {
                const profile = await response.json();
                // Update the name with the authoritative data from the backend
                userNameSpan.textContent = profile.name;
            } else {
                // If the profile can't be fetched, the stored session is invalid.
                throw new Error('Invalid session. Please log in again.');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            showToast(error.message, 'error');
            localStorage.removeItem('user');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    };

    fetchProfile();

    // 3. Logout Functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            showToast('You have been logged out.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }

    // 4. Chat Button Functionality
    if (chatButton) {
        chatButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'chat.html';
        });
    }
});
