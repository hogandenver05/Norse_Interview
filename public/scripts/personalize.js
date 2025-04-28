// Decode JWT to get user information
const decodeToken = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode the payload
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Get the current user from the token
    const TOKEN = localStorage.getItem('token');
    const CURRENT_USER = TOKEN ? decodeToken(TOKEN)?.email : null;
    const username = CURRENT_USER ? CURRENT_USER.split('@')[0] : 'User';
    
    document.querySelectorAll('.username').forEach(each => {
        each.textContent = username;
    });
});
